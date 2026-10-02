import { sourceDePaire, tauxCroise } from '../domain/reference.ts';
import {
  lireBce,
  lireMarche,
  lireSeriesBce,
  type Instantane,
  type PointSerie,
  type Recuperer,
  type Source,
} from './sources.ts';

export type Periode = '1M' | '6M' | '1A';
export type Fraicheur = 'frais' | 'ancien';

export interface TauxDuJour {
  /** La monnaie de référence : l'euro par défaut. */
  reference: string;
  code: string;
  /** Unités de la devise pour une unité de la référence. */
  taux: number;
  source: Source;
  date: string;
  fraicheur: Fraicheur;
}

/** Ce que l'appareil sait des deux sources. */
export interface EtatTaux {
  bce?: Instantane;
  marche?: Instantane;
}

export interface Serie {
  source: Source;
  points: PointSerie[];
  /** `false` si une date de la grille manque (hors ligne, source muette). */
  complete: boolean;
}

/** Le sous-ensemble de l'`idb` du socle dont le service a besoin. */
export interface CacheTaux {
  get<T>(cle: string): Promise<T | undefined>;
  set(cle: string, valeur: unknown): Promise<boolean>;
}

const JOUR = 86_400_000;
const PARALLELES = 6;

const iso = (date: Date) => date.toISOString().slice(0, 10);
const debutDuJour = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

/**
 * Les devises que l'appareil sait convertir : celles des deux sources, et
 * l'euro, que la BCE ne liste pas (c'est sa base) et que le marché peut taire.
 */
export function codesConnus(etat: EtatTaux): string[] {
  return [
    ...new Set([
      'EUR',
      ...Object.keys(etat.bce?.taux ?? {}),
      ...Object.keys(etat.marche?.taux ?? {}),
    ]),
  ];
}

/**
 * Plus de 3 jours, un taux est ancien (R8) : la BCE ne publie ni le week-end
 * ni les jours fériés, et le taux du vendredi lu un lundi ne doit pas alarmer.
 */
export function fraicheur(date: string, maintenant: Date): Fraicheur {
  const ecart =
    (debutDuJour(maintenant).getTime() - Date.parse(`${date}T00:00:00Z`)) /
    JOUR;
  return ecart > 3 ? 'ancien' : 'frais';
}

/**
 * Le taux du jour d'une paire, ou rien : jamais un taux inventé. Une source par
 * paire, la même pour le jour et pour l'historique (spécification 002,
 * recherche R1), et les deux devises lues dans son seul relevé.
 */
export function tauxDuJour(
  reference: string,
  code: string,
  etat: EtatTaux,
  maintenant: Date
): TauxDuJour | undefined {
  const source = sourceDePaire(reference, code, etat.bce?.taux);
  const instantane = source === 'bce' ? etat.bce : etat.marche;
  if (!instantane) return undefined;
  const taux = tauxCroise(reference, code, instantane.taux);
  if (taux === undefined) return undefined;
  return {
    reference,
    code,
    taux,
    source,
    date: instantane.date,
    fraicheur: fraicheur(instantane.date, maintenant),
  };
}

/**
 * Les dates à lire sur la source de marché (R2) : tous les deux jours sur un
 * mois, chaque lundi sur 6 mois et sur un an, plus le jour même. Une grille
 * FIXE fait que 6 mois et un an partagent leurs lundis.
 */
export function grilleMarche(periode: Periode, maintenant: Date): string[] {
  const aujourdhui = debutDuJour(maintenant);
  const dates: string[] = [];
  if (periode === '1M') {
    for (let jours = 30; jours >= 0; jours -= 2) {
      dates.push(iso(new Date(aujourdhui.getTime() - jours * JOUR)));
    }
    return dates;
  }
  const semaines = periode === '6M' ? 26 : 52;
  const depuisLundi = (aujourdhui.getUTCDay() + 6) % 7;
  // Un lundi, le jour même est déjà le dernier point : on part du précédent.
  const dernierLundi = aujourdhui.getTime() - (depuisLundi || 7) * JOUR;
  for (let s = semaines - 1; s >= 0; s--) {
    dates.push(iso(new Date(dernierLundi - s * 7 * JOUR)));
  }
  dates.push(iso(aujourdhui));
  return dates;
}

/** Les bornes d'une série de la BCE : la période, jusqu'à aujourd'hui. */
export function bornesBce(
  periode: Periode,
  maintenant: Date
): { debut: string; fin: string } {
  const mois = periode === '1M' ? 1 : periode === '6M' ? 6 : 12;
  const debut = new Date(
    Date.UTC(
      maintenant.getUTCFullYear(),
      maintenant.getUTCMonth() - mois,
      maintenant.getUTCDate()
    )
  );
  return { debut: iso(debut), fin: iso(debutDuJour(maintenant)) };
}

/**
 * La série prolongée du taux du jour, s'il est plus récent que son dernier
 * point. Jamais l'inverse : un instantané plus ancien ne s'ajoute pas.
 */
function raccorder(
  points: PointSerie[],
  reference: string,
  code: string,
  instantane: Instantane | undefined
): PointSerie[] {
  const taux = instantane && tauxCroise(reference, code, instantane.taux);
  if (!instantane || taux === undefined) return points;
  const dernier = points.at(-1)?.date;
  if (dernier !== undefined && dernier >= instantane.date) return points;
  return [...points, { date: instantane.date, taux }];
}

/**
 * Le taux croisé de chaque date où les séries de la paire ont toutes un
 * point, l'euro valant 1. Une date où l'une manque est sautée : rien n'est
 * inventé, et la courbe passe au-dessus.
 */
function croiser(
  reference: string,
  code: string,
  series: Record<string, PointSerie[]>
): PointSerie[] {
  const parDate = new Map<string, Record<string, number>>();
  for (const [c, points] of Object.entries(series)) {
    for (const point of points) {
      parDate.set(point.date, {
        ...parDate.get(point.date),
        [c]: point.taux,
      });
    }
  }
  return [...parDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, taux]) => {
      const croise = tauxCroise(reference, code, taux);
      return croise === undefined ? [] : [{ date, taux: croise }];
    });
}

/** Exécute des tâches avec au plus `n` en cours. */
async function parPaquets<T, R>(
  elements: T[],
  n: number,
  tache: (element: T) => Promise<R>
): Promise<R[]> {
  const resultats: R[] = new Array(elements.length);
  let suivant = 0;
  async function ouvrier() {
    while (suivant < elements.length) {
      const i = suivant++;
      resultats[i] = await tache(elements[i]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(n, elements.length) }, ouvrier)
  );
  return resultats;
}

export interface OptionsService {
  cache: CacheTaux;
  recuperer: Recuperer;
  maintenant?: () => Date;
}

/**
 * Le service de taux : le cache d'abord, le réseau ensuite. Le réseau et le
 * cache sont injectés : le service se teste sans l'un ni l'autre.
 */
export function createServiceTaux({
  cache,
  recuperer,
  maintenant = () => new Date(),
}: OptionsService) {
  return {
    /** Ce que l'appareil a gardé, sans réseau. */
    async hydrater(): Promise<EtatTaux> {
      const [bce, marche] = await Promise.all([
        cache.get<Instantane>('taux:bce'),
        cache.get<Instantane>('taux:marche'),
      ]);
      return { ...(bce && { bce }), ...(marche && { marche }) };
    },

    /** Relit les deux sources ; ne lève jamais, rend ce qui a pu être lu. */
    async rafraichir(signal?: AbortSignal): Promise<EtatTaux> {
      const [bce, marche] = await Promise.allSettled([
        lireBce(recuperer, signal),
        lireMarche('latest', recuperer, signal),
      ]);
      const etat: EtatTaux = {};
      if (bce.status === 'fulfilled') {
        etat.bce = bce.value;
        await cache.set('taux:bce', bce.value);
      }
      if (marche.status === 'fulfilled') {
        etat.marche = marche.value;
        await cache.set('taux:marche', marche.value);
      }
      return etat;
    },

    /**
     * La série d'une paire sur une période, depuis le cache ou le réseau : le
     * taux de `code` pour une unité de `reference`, date par date.
     */
    async serie(
      reference: string,
      code: string,
      periode: Periode,
      etat: EtatTaux,
      signal?: AbortSignal
    ): Promise<Serie> {
      const maintenantDate = maintenant();
      if (sourceDePaire(reference, code, etat.bce?.taux) === 'bce') {
        const { debut, fin } = bornesBce(periode, maintenantDate);
        // Chaque devise sous sa clé de la 001 (recherche R2) : une série lue
        // pour une paire sert aux autres. Celles qui manquent se lisent en
        // UNE requête. L'euro n'a pas de série : il vaut 1.
        const codes = [reference, code].filter(c => c !== 'EUR').sort();
        const cle = (c: string) => `serie:bce:${c}:${debut}:${fin}`;
        const gardees = await Promise.all(
          codes.map(c => cache.get<PointSerie[]>(cle(c)))
        );
        const manquants = codes.filter((_, i) => !gardees[i]);
        const lues =
          manquants.length > 0
            ? await lireSeriesBce(manquants, debut, fin, recuperer, signal)
            : {};
        for (const c of manquants) await cache.set(cle(c), lues[c] ?? []);
        const series = Object.fromEntries(
          codes.map((c, i) => [c, gardees[i] ?? lues[c] ?? []])
        );
        // Lue avant la publication de 16 h, la série gardée s'arrête à la
        // veille : le taux du jour la prolonge, sans toucher au cache.
        return {
          source: 'bce',
          points: raccorder(
            croiser(reference, code, series),
            reference,
            code,
            etat.bce
          ),
          complete: true,
        };
      }

      // Le marché : chaque date est un fichier complet, gardé une fois pour
      // toutes et partagé entre devises et périodes. La dernière date de la
      // grille est le jour même : le taux du jour la remplace.
      const dates = grilleMarche(periode, maintenantDate).slice(0, -1);
      const jours = await parPaquets(dates, PARALLELES, async date => {
        const cle = `jour:${date}`;
        const garde = await cache.get<Instantane>(cle);
        if (garde) return garde;
        try {
          const lu = await lireMarche(date, recuperer, signal);
          await cache.set(cle, lu);
          return lu;
        } catch {
          return undefined;
        }
      });
      const points: PointSerie[] = [];
      for (const jour of jours) {
        const taux = jour && tauxCroise(reference, code, jour.taux);
        if (jour && taux !== undefined) points.push({ date: jour.date, taux });
      }
      const aujourdhui =
        etat.marche && tauxCroise(reference, code, etat.marche.taux);
      return {
        source: 'marche',
        points: raccorder(points, reference, code, etat.marche),
        complete: jours.every(Boolean) && aujourdhui !== undefined,
      };
    },
  };
}

export type ServiceTaux = ReturnType<typeof createServiceTaux>;

import {
  lireBce,
  lireMarche,
  lireSerieBce,
  type Instantane,
  type PointSerie,
  type Recuperer,
  type Source,
} from './sources.ts';

export type Periode = '1M' | '6M' | '1A';
export type Fraicheur = 'frais' | 'ancien';

export interface TauxDuJour {
  code: string;
  /** Unités de la devise pour un euro. */
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
 * Une source par devise, la même pour le jour et pour l'historique (R1) : la
 * BCE pour les devises qu'elle publie, le marché pour les autres. Tant que la
 * BCE n'est pas connue, le marché.
 */
export function sourceDe(code: string, bce: Instantane | undefined): Source {
  return bce && code in bce.taux ? 'bce' : 'marche';
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

/** Le taux du jour d'une devise, ou rien : jamais un taux inventé. */
export function tauxDuJour(
  code: string,
  etat: EtatTaux,
  maintenant: Date
): TauxDuJour | undefined {
  const source = sourceDe(code, etat.bce);
  const instantane = source === 'bce' ? etat.bce : etat.marche;
  const taux = instantane?.taux[code];
  if (!instantane || taux === undefined) return undefined;
  return {
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
  code: string,
  instantane: Instantane | undefined
): PointSerie[] {
  const taux = instantane?.taux[code];
  if (!instantane || taux === undefined) return points;
  const dernier = points.at(-1)?.date;
  if (dernier !== undefined && dernier >= instantane.date) return points;
  return [...points, { date: instantane.date, taux }];
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

    /** La série d'une devise sur une période, depuis le cache ou le réseau. */
    async serie(
      code: string,
      periode: Periode,
      etat: EtatTaux,
      signal?: AbortSignal
    ): Promise<Serie> {
      const maintenantDate = maintenant();
      if (sourceDe(code, etat.bce) === 'bce') {
        const { debut, fin } = bornesBce(periode, maintenantDate);
        const cle = `serie:bce:${code}:${debut}:${fin}`;
        let points = await cache.get<PointSerie[]>(cle);
        if (!points) {
          points = await lireSerieBce(code, debut, fin, recuperer, signal);
          await cache.set(cle, points);
        }
        // Lue avant la publication de 16 h, la série gardée s'arrête à la
        // veille : le taux du jour la prolonge, sans toucher au cache.
        return {
          source: 'bce',
          points: raccorder(points, code, etat.bce),
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
        const taux = jour?.taux[code];
        if (jour && taux !== undefined) points.push({ date: jour.date, taux });
      }
      return {
        source: 'marche',
        points: raccorder(points, code, etat.marche),
        complete: jours.every(Boolean) && etat.marche?.taux[code] !== undefined,
      };
    },
  };
}

export type ServiceTaux = ReturnType<typeof createServiceTaux>;

import {
  formatCurrency,
  formatNumber,
} from '@mister-guiiug/dev-pwa-config/format';

export type Langue = 'fr' | 'en';

/**
 * Tous les espaces. En JavaScript, `\s` couvre aussi l'insécable (U+00A0) et
 * la fine insécable (U+202F) que `Intl` met entre les milliers en français :
 * les tests le vérifient avec ces deux caractères.
 */
const ESPACES = /\s/g;

/**
 * Lit un montant saisi, ou rend `null` (recherche R4).
 *
 * « 12,5 » et « 12.5 » valent douze et demi dans les deux langues, et
 * « 1.234 » vaut mille deux cent trente-quatre en français :
 *
 * 1. les espaces disparaissent ;
 * 2. si `,` et `.` sont présents, le plus à droite est le séparateur décimal ;
 * 3. sinon, un séparateur répété sépare des milliers ;
 * 4. sinon, un séparateur unique est décimal s'il est celui de la langue, ou
 *    s'il n'est pas suivi d'exactement trois chiffres.
 *
 * Les milliers doivent former des groupes de trois chiffres. Un séparateur
 * décimal en fin de saisie (« 12, ») garde la partie entière : c'est l'état
 * normal d'une frappe en cours, pas une erreur.
 */
export function lireMontant(saisie: string, langue: Langue): number | null {
  const brut = saisie.replace(ESPACES, '');
  if (!brut || !/^[\d.,]+$/.test(brut)) return null;

  const virgules = brut.split(',').length - 1;
  const points = brut.split('.').length - 1;
  let decimal: ',' | '.' | null = null;
  let milliers: ',' | '.' | null = null;

  if (virgules > 0 && points > 0) {
    decimal = brut.lastIndexOf(',') > brut.lastIndexOf('.') ? ',' : '.';
    milliers = decimal === ',' ? '.' : ',';
    if (brut.split(decimal).length - 1 > 1) return null;
    if (brut.lastIndexOf(milliers) > brut.lastIndexOf(decimal)) return null;
  } else if (virgules + points > 0) {
    const separateur = virgules > 0 ? ',' : '.';
    if (virgules + points > 1) milliers = separateur;
    else {
      const apres = brut.length - brut.indexOf(separateur) - 1;
      const decimalDeLaLangue = langue === 'fr' ? ',' : '.';
      if (separateur === decimalDeLaLangue || apres !== 3) decimal = separateur;
      else milliers = separateur;
    }
  }

  let entier = brut;
  let fraction = '';
  if (decimal) {
    const i = brut.lastIndexOf(decimal);
    entier = brut.slice(0, i);
    fraction = brut.slice(i + 1);
  }
  if (milliers) {
    const groupes = entier.split(milliers);
    const malFormes = groupes.some((groupe, i) =>
      i === 0 ? !/^\d{1,3}$/.test(groupe) : !/^\d{3}$/.test(groupe)
    );
    if (malFormes) return null;
    entier = groupes.join('');
  }
  if (!/^\d*$/.test(entier) || !/^\d*$/.test(fraction)) return null;
  if (!entier && !fraction) return null;

  const valeur = Number(`${entier || '0'}.${fraction || '0'}`);
  return Number.isFinite(valeur) ? valeur : null;
}

/**
 * Les décimales d'une devise, celles que retient `Intl` (ISO 4217, recherche
 * R3) : il les connaît pour toutes les devises, pas seulement pour les 41
 * illustrées. Deux pour un code qu'il ne connaît pas.
 */
export function decimalesDe(code: string): number {
  try {
    return (
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency: code,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/**
 * Arrondi au plus proche, demi vers le haut, à `decimales` chiffres. Le
 * décalage par la notation exponentielle évite le piège du flottant :
 * `1.005 * 100` vaut 100,49999…, et un `Math.round` direct rendrait 1,00.
 *
 * L'EXPOSANT S'AJOUTE, IL NE SE COLLE PAS : JavaScript écrit lui-même `1e-7`
 * ou `1e+21`, et « 1e-7 » suivi de « e2 » n'est plus un nombre.
 */
export function arrondir(montant: number, decimales: number): number {
  if (!Number.isFinite(montant)) return montant;
  return decaler(Math.round(decaler(montant, decimales)), -decimales);
}

/** `x × 10^n`, par l'exposant écrit et non par une multiplication. */
function decaler(x: number, n: number): number {
  const [mantisse, exposant = '0'] = String(x).split('e');
  return Number(`${mantisse}e${Number(exposant) + n}`);
}

/**
 * Le montant tel qu'on le lit : arrondi À L'AFFICHAGE seulement, aux
 * décimales de la devise, dans le format de la langue (constitution,
 * principe I). `signe` : un écart, qui montre son « + » comme son « - ».
 */
export function formaterMontant(
  montant: number,
  code: string,
  langue: Langue,
  { signe = false }: { signe?: boolean } = {}
): string {
  const decimales = decimalesDe(code);
  return formatCurrency(arrondir(montant, decimales), langue, code, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    ...(signe ? { signDisplay: 'exceptZero' } : {}),
  });
}

/** Une variation (0,047 pour +4,7 %), signée, à une décimale. */
export function formaterPourcentage(fraction: number, langue: Langue): string {
  return formatNumber(fraction, langue, {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  });
}

/**
 * La date d'un taux (`AAAA-MM-JJ`), lisible. EN UTC : une date sans heure se
 * lit comme minuit UTC, et formatée en heure locale elle reculerait d'un jour
 * à l'ouest de Greenwich — le taux de la BCE paraîtrait dater de la veille.
 */
export function formaterDate(date: string, langue: Langue): string {
  return new Intl.DateTimeFormat(langue, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

/** Un taux, à cinq chiffres significatifs : 58,833 comme 0,016997. */
export function formaterTaux(taux: number, langue: Langue): string {
  return formatNumber(taux, langue, { maximumSignificantDigits: 5 });
}

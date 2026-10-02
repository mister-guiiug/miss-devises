import type { Source } from '../rates/sources.ts';

/** Ce qu'une source publie : unités de chaque devise pour UN euro. */
type Taux = Readonly<Record<string, number>>;

/** Le taux d'une devise contre l'euro dans un relevé ; l'euro vaut 1. */
function contreEuro(code: string, taux: Taux): number | undefined {
  return code === 'EUR' ? 1 : taux[code];
}

/**
 * LA SOURCE D'UNE PAIRE (spécification 002, recherche R1) : la BCE quand elle
 * publie les deux devises, l'euro comptant comme publié ; le marché sinon, et
 * tant que la BCE n'est pas connue.
 *
 * UNE SEULE SOURCE POUR LES DEUX CÔTÉS, jamais la BCE pour l'un et le marché
 * pour l'autre : ce serait deux dates, et un taux qu'aucune source n'a publié.
 */
export function sourceDePaire(
  reference: string,
  devise: string,
  bce: Taux | undefined
): Source {
  const publie = (code: string) =>
    code === 'EUR' || (bce !== undefined && code in bce);
  return publie(reference) && publie(devise) ? 'bce' : 'marche';
}

/**
 * LE TAUX CROISÉ : unités de `devise` pour une unité de `reference`, lues dans
 * UN relevé. Les deux sources publient tout contre l'euro ; une paire sans lui
 * est le rapport de ses deux taux. Avec l'euro pour référence, c'est le taux
 * publié tel quel : la spécification 001 ne voit aucune différence.
 *
 * AUCUN ARRONDI ICI, comme dans `convertir` : il n'a lieu qu'à l'affichage.
 */
export function tauxCroise(
  reference: string,
  devise: string,
  taux: Taux
): number | undefined {
  const r = contreEuro(reference, taux);
  const d = contreEuro(devise, taux);
  if (r === undefined || d === undefined) return undefined;
  return d / r;
}

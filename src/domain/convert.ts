/**
 * Le sens d'une conversion, vu de la devise étrangère : `versDevise` part de
 * l'euro, `versEuro` y revient.
 */
export type Sens = 'versDevise' | 'versEuro';

/**
 * Convertit entre l'euro et une devise. Le taux s'exprime en unités de la
 * devise pour UN euro, comme le publient les deux sources (58,83 EGP pour
 * 1 €).
 *
 * AUCUN ARRONDI ICI : il n'a lieu qu'à l'affichage (recherche R3). Arrondir en
 * route ferait dériver un aller-retour.
 */
export function convertir(montant: number, taux: number, sens: Sens): number {
  if (!Number.isFinite(taux) || taux <= 0) {
    throw new RangeError(`taux invalide : ${taux}`);
  }
  return sens === 'versDevise' ? montant * taux : montant / taux;
}

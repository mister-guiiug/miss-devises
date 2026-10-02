/**
 * Le sens d'une conversion, vu de la devise étrangère : `versDevise` part de
 * la monnaie de référence, `versReference` y revient.
 */
export type Sens = 'versDevise' | 'versReference';

/**
 * Convertit entre la référence et une devise. Le taux s'exprime en unités de
 * la devise pour UNE unité de la référence : avec l'euro, tel que le publient
 * les deux sources (58,83 EGP pour 1 €) ; sinon, le taux croisé.
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

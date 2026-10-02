/**
 * Recharger l'application : la page entière, comme le bouton du navigateur.
 *
 * Une application installée n'a ni barre d'adresse ni bouton de
 * rechargement : le réglage « Recharger l'application » est son seul moyen de
 * repartir de zéro (taux relus au démarrage, écran remis à neuf). Un module à
 * part, parce que jsdom ne sait pas recharger une page : les tests le
 * remplacent.
 */
export function rechargerLaPage(): void {
  window.location.reload();
}

/**
 * La mise en scène des captures du manifeste (`npm run screenshots`). Elles
 * décident de la fiche d'installation : on y montre l'application EN SERVICE,
 * pas deux écrans vides.
 *
 * - `narrow` (téléphone) : 200 livres égyptiennes, et le volet des billets et
 *   des pièces ouvert sur leur composition ;
 * - `wide` : l'historique d'un an, avec ces 200 livres comparées.
 *
 * Les taux sont les vrais, lus au moment de la capture.
 */
export default async function preparer(page, { name }) {
  const accueil = new URL('.', page.url()).href.replace(/historique\/?$/, '');
  if (name === 'wide') await page.goto(accueil);

  await page.getByLabel('Montant en livre égyptienne').fill('200');
  await page
    .getByText(/1 € = /)
    .first()
    .waitFor();

  if (name === 'narrow') {
    await page.getByRole('button', { name: 'Billets et pièces' }).click();
    await page.getByRole('region', { name: /Composition de/ }).waitFor();
    return;
  }
  await page.getByRole('link', { name: 'Historique' }).click();
  await page.getByText('Plus haut', { exact: true }).waitFor();
}

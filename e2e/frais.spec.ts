import { expect, test, type Page } from '@playwright/test';
import { simulerTaux } from './taux.ts';

const lisible = (texte: string | null) => (texte ?? '').replace(/\s/g, ' ');

/** Enregistre des frais depuis les réglages, puis revient à Convertir. */
async function ajouterFrais(
  page: Page,
  {
    libelle,
    pourcentage,
    fixe,
  }: { libelle: string; pourcentage: string; fixe: string }
) {
  await page.goto('/reglages');
  await page.getByRole('button', { name: 'Ajouter des frais' }).click();
  const feuille = page.getByRole('dialog', { name: 'Nouveaux frais' });
  await feuille.getByLabel('Libellé').fill(libelle);
  await feuille.getByLabel('Pourcentage').fill(pourcentage);
  await feuille.getByLabel('Montant fixe par opération').fill(fixe);
  await feuille.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText(libelle, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Convertir' }).click();
}

/** Spécification 005, récit 1. 58,83 EGP pour un euro, au marché. */
test.describe('@critical 005, récit 1 : les frais d’une conversion', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
  });

  test('« Carte », 2 % et 0,50 € : 200 EGP coûtent 3,97 €, et le choix reste', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByLabel('Frais')).toHaveCount(0);
    await ajouterFrais(page, {
      libelle: 'Carte',
      pourcentage: '2',
      fixe: '0,50',
    });

    await page.getByLabel('Frais').selectOption({ label: 'Carte' });
    await page.getByLabel('Montant en livres égyptiennes').fill('200');
    await expect
      .poll(async () =>
        lisible(await page.getByText(/^Coût avec frais/).textContent())
      )
      .toBe('Coût avec frais : 3,97 €');
    await expect
      .poll(async () => lisible(await page.getByText(/^dont/).textContent()))
      .toBe('dont 0,57 € de frais (2 % + 0,50 €)');

    await page.reload();
    await expect(page.getByLabel('Frais')).toHaveValue(/.+/);
  });

  test('supprimés dans les réglages, ils quittent Convertir (scénario 5)', async ({
    page,
  }) => {
    await page.goto('/');
    await ajouterFrais(page, {
      libelle: 'Retrait',
      pourcentage: '1',
      fixe: '3',
    });
    await page.goto('/reglages');
    await page.getByRole('button', { name: 'Supprimer Retrait' }).click();
    await expect(page.getByText('Aucun frais enregistré.')).toBeVisible();
    await page.getByRole('link', { name: 'Convertir' }).click();
    await expect(page.getByLabel('Frais')).toHaveCount(0);
  });
});

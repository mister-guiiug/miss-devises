import { expect, test } from '@playwright/test';
import { simulerTaux } from './taux.ts';

test.describe('@critical récit 2 : voir les billets et les pièces', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
  });

  test('la livre : ses coupures en ordre, le montant composé, puis l’euro', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Montant en livre égyptienne').fill('200');
    await page.getByRole('button', { name: 'Billets et pièces' }).click();
    const volet = page.getByRole('dialog', { name: 'Billets et pièces' });

    const billets = volet
      .getByRole('region', { name: 'Billets' })
      .getByRole('img');
    await expect(billets).toHaveCount(9);
    await expect(billets.last()).toHaveAccessibleName(
      /^Billet de 200 livres égyptiennes, soit 3,40\s€$/
    );
    await expect(
      volet.getByRole('region', { name: /Composition de 200,00\sEGP/ })
    ).toContainText(/1 × 200\sEGP/);

    await volet.getByRole('tab', { name: 'En euros' }).click();
    // Le billet de 500 € a cours légal, mais n'est plus émis.
    await expect(billets.last()).toHaveAccessibleName(
      /^Billet de 500 euros, soit 29\s415,00\sEGP, n’est plus émis$/
    );
  });
});

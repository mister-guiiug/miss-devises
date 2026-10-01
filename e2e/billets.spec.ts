import { expect, test, type Locator } from '@playwright/test';
import { simulerTaux } from './taux.ts';

/** Les coupures d'une section : chacune est un bouton qu'on touche. */
const coupures = (volet: Locator, section: string) =>
  volet
    .getByRole('region', { name: section })
    .getByRole('button', { name: /^(Billet|Pièce) de / });

test.describe('@critical récits 2 et 5 : billets et pièces', () => {
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

    const billets = coupures(volet, 'Billets');
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

  test('composer en touchant ses billets, puis l’utiliser dans Convertir', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Billets et pièces' }).click();
    const volet = page.getByRole('dialog', { name: 'Billets et pièces' });

    const cent = coupures(volet, 'Billets').filter({
      has: page.locator('text=100 EGP'),
    });
    await cent.click();
    await cent.click();
    await coupures(volet, 'Pièces').last().click();
    await expect(volet.getByTestId('total-compose')).toHaveText(
      /^Total : 201,00\sEGP, soit 3,42\s€$/
    );

    await volet.getByRole('button', { name: 'Utiliser ce montant' }).click();
    await expect(volet).toBeHidden();
    await expect(page.getByLabel('Montant en livre égyptienne')).toHaveValue(
      '201'
    );
    await expect(page.getByLabel('Montant en euros')).toHaveValue('3,42');
  });
});

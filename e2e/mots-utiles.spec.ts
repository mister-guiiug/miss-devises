import { expect, test, type Page } from '@playwright/test';
import { simulerTaux } from './taux.ts';

/** Change la devise de l'écran Convertir, par la recherche. */
async function choisirDevise(page: Page, recherche: string, code: string) {
  await page.getByRole('button', { name: /^Changer de devise/ }).click();
  const feuille = page.getByRole('dialog', { name: 'Devise' });
  await feuille.getByLabel('Rechercher une devise').fill(recherche);
  await feuille.getByRole('button', { name: new RegExp(`^${code}`) }).click();
}

/** Spécification 004 : les mots utiles du pays. */
test.describe('@critical 004 : les mots utiles du pays', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
  });

  test('en Égypte : seize phrases en arabe égyptien, à montrer en grand', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Mots utiles' }).click();
    const feuille = page.getByRole('dialog', { name: 'Mots utiles' });
    await expect(
      feuille.getByText('En arabe (Égypte)', { exact: true })
    ).toBeVisible();
    await expect(feuille.getByRole('listitem')).toHaveCount(16);
    const phrase = feuille.getByText('بكام ده؟', { exact: true });
    await expect(phrase).toHaveAttribute('lang', 'ar-EG');
    await expect(phrase).toHaveAttribute('dir', 'rtl');
    await expect(feuille.getByText('Combien ça coûte ?')).toBeVisible();

    await feuille.getByRole('button', { name: /بكام ده؟/ }).click();
    const grande = feuille.getByRole('region', { name: 'Combien ça coûte ?' });
    await expect(grande.getByText('bikam da?')).toBeVisible();
    await feuille.getByRole('button', { name: 'Retour à la liste' }).click();
    await expect(
      feuille.getByRole('button', { name: /بكام ده؟/ })
    ).toBeFocused();
  });

  test('le sens suit la langue de l’application', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('dwc_locale', 'en'));
    await page.goto('/');
    await page.getByRole('button', { name: 'Useful phrases' }).click();
    const feuille = page.getByRole('dialog', { name: 'Useful phrases' });
    await expect(feuille.getByText('In Arabic (Egypt)')).toBeVisible();
    await expect(feuille.getByText('The bill, please.')).toBeVisible();
  });

  test('en Suisse : allemand et italien, pas le français de l’application', async ({
    page,
  }) => {
    await page.goto('/');
    await choisirDevise(page, 'franc suisse', 'CHF');
    await page.getByRole('button', { name: 'Mots utiles' }).click();
    const feuille = page.getByRole('dialog', { name: 'Mots utiles' });
    await expect(feuille.getByRole('tab')).toHaveText(['allemand', 'italien']);
    await expect(feuille.getByText('Wie viel kostet das?')).toBeVisible();
    await feuille.getByRole('tab', { name: 'italien' }).click();
    await expect(feuille.getByText('Il conto, per favore.')).toBeVisible();
  });

  test('en franc CFA, l’application en français : pas de bouton', async ({
    page,
  }) => {
    await page.goto('/');
    await choisirDevise(page, 'XOF', 'XOF');
    await expect(page.getByLabel(/^Montant en francs CFA/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mots utiles' })).toHaveCount(
      0
    );
  });
});

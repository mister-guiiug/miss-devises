import { expect, test } from '@playwright/test';
import { simulerTaux } from './taux.ts';
import { simulerVoix } from './voix.ts';

/** Spécification 005, récit 2 : entendre une phrase. */
test.describe('@critical 005, récit 2 : les phrases parlées', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
  });

  test('« Écouter » dit la phrase en arabe égyptien', async ({ page }) => {
    await simulerVoix(page, ['ar-EG', 'de-DE']);
    await page.goto('/');
    await page.getByRole('button', { name: 'Mots utiles' }).click();
    const feuille = page.getByRole('dialog', { name: 'Mots utiles' });
    await feuille
      .getByRole('button', { name: 'Écouter : Combien ça coûte ?' })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as never as { __dites: unknown[] }).__dites)
      )
      .toEqual([{ text: 'بكام ده؟', lang: 'ar-EG' }]);
    // La fin de la lecture rend le bouton.
    await expect(
      feuille.getByRole('button', { name: 'Écouter : Combien ça coûte ?' })
    ).toBeVisible();
  });

  test('sans voix pour la langue : pas de bouton, et la feuille le dit', async ({
    page,
  }) => {
    await simulerVoix(page, ['de-DE']);
    await page.goto('/');
    await page.getByRole('button', { name: 'Mots utiles' }).click();
    const feuille = page.getByRole('dialog', { name: 'Mots utiles' });
    await expect(
      feuille.getByText(/^Pas de voix en arabe \(Égypte\) sur cet appareil/)
    ).toBeVisible();
    await expect(feuille.getByRole('button', { name: /^Écouter/ })).toHaveCount(
      0
    );
  });
});

import { expect, test } from '@playwright/test';
import { simulerTaux } from './taux.ts';

/**
 * Spécification 002, récit 5 : explorer l'historique sans repasser par
 * Convertir. Le réseau simulé donne 56,18 EGP pour un euro à toute date
 * passée, 58,83 aujourd'hui.
 */
test.describe('@critical 002, récit 5 : explorer l’historique', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
    await page.goto('/historique');
  });

  test('changer de devise depuis l’historique, et Convertir suit', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /Changer de devise/ }).click();
    await page.getByLabel('Rechercher une devise').fill('dirham');
    await page.getByRole('button', { name: /MAD/ }).click();
    await expect(
      page.getByRole('heading', {
        name: /^Évolution de 1\s€ en MAD sur 1 an$/,
      })
    ).toBeVisible();

    await page.getByRole('link', { name: 'Convertir' }).click();
    await expect(
      page.getByRole('button', { name: /Changer de devise/ })
    ).toHaveAccessibleName('Changer de devise : MAD, Dirham marocain');
  });

  test('lire un point de la courbe au clavier', async ({ page }) => {
    const curseur = page.getByRole('slider', { name: 'Lire la courbe' });
    // Le curseur part d'aujourd'hui.
    await expect(curseur).toHaveAttribute(
      'aria-valuetext',
      /^Le .+ : 1\s€ = 58,83 EGP$/
    );
    await curseur.focus();
    await page.keyboard.press('Home');
    await expect(curseur).toHaveAttribute(
      'aria-valuetext',
      /^Le .+ : 1\s€ = 56,18 EGP$/
    );
    // Les axes de la courbe disent les extrêmes de la période.
    const courbe = page.locator('figure');
    await expect(courbe.getByText('58,83 EGP', { exact: true })).toBeVisible();
    await expect(courbe.getByText('56,18 EGP', { exact: true })).toBeVisible();
  });
});

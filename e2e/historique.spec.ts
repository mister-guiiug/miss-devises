import { expect, test } from '@playwright/test';
import { simulerTaux } from './taux.ts';

test.describe('@critical récit 3 : comparer avec l’historique', () => {
  let journal: string[] = [];
  test.beforeEach(async ({ page }) => {
    journal = await simulerTaux(page);
  });

  test('un an de livre égyptienne, et le montant saisi comparé', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Montant en livres égyptiennes').fill('200');
    await page.getByRole('link', { name: 'Historique' }).click();

    await expect(
      page.getByRole('heading', { name: /^Évolution de 1\s€ en EGP sur 1 an$/ })
    ).toBeVisible();
    await expect(page.getByText('Plus haut', { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        /200,00\sEGP valaient 3,56\s€ le .+, et valent 3,40\s€ aujourd’hui\./
      )
    ).toBeVisible();
    // `\s` : Intl écrit « 3,56 € » et « 4,5 % » avec des espaces insécables,
    // qu'une expression régulière ne confond pas avec l'espace ordinaire.
    await expect(
      page.getByText(/Écart : -0,16\s€ \(-4,5\s%\)\./)
    ).toBeVisible();
  });

  test('une devise de la BCE : un an en une requête', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Changer de devise/ }).click();
    await page.getByLabel('Rechercher une devise').fill('dollar des');
    await page.getByRole('button', { name: /USD/ }).click();
    await page.getByRole('link', { name: 'Historique' }).click();

    // « du … au … » : la ligne de l'historique, pas celle de Convertir, qui
    // dit aussi « taux de référence de la BCE, du » et passerait avant que
    // la série ne soit demandée.
    await expect(
      page.getByText(/taux de référence de la BCE, du .+ au /)
    ).toBeVisible();
    const series = journal.filter(url =>
      /frankfurter\.dev\/v1\/\d{4}-\d{2}-\d{2}\.\./.test(url)
    );
    expect(series).toHaveLength(1);
  });

  test('changer de période suit la courbe', async ({ page }) => {
    await page.goto('/historique');
    await page.getByRole('tab', { name: '1 mois' }).click();
    await expect(
      page.getByRole('heading', {
        name: /^Évolution de 1\s€ en EGP sur 1 mois$/,
      })
    ).toBeVisible();
    await expect(page.getByText('Variation', { exact: true })).toBeVisible();
  });
});

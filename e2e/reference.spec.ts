import { expect, test, type Page } from '@playwright/test';
import { simulerTaux } from './taux.ts';

/** Règle la monnaie de référence depuis les réglages, par la recherche. */
async function choisirReference(page: Page, recherche: string, code: string) {
  await page.goto('/reglages');
  await page
    .getByRole('button', { name: /Changer de monnaie de référence/ })
    .click();
  const feuille = page.getByRole('dialog', { name: 'Monnaie de référence' });
  await feuille.getByLabel('Rechercher une devise').fill(recherche);
  await feuille.getByRole('button', { name: new RegExp(code) }).click();
  await page.getByRole('link', { name: 'Convertir' }).click();
}

/** Spécification 002, récit 1 : choisir sa monnaie de référence. */
test.describe('@critical 002, récit 1 : choisir sa monnaie de référence', () => {
  test('le franc pour référence : 200 EGP valent 3,19 CHF, et la référence reste', async ({
    page,
  }) => {
    await simulerTaux(page);
    await choisirReference(page, 'franc suisse', 'CHF');

    await page.getByLabel('Montant en livres égyptiennes').fill('200');
    await expect(page.getByLabel('Montant en francs suisses')).toHaveValue(
      '3,19'
    );
    // 58,83 EGP et 0,9384 CHF pour un euro, au marché : 62,692 livres.
    await expect(page.getByText(/1\sCHF = 62,692 EGP/)).toBeVisible();
    await expect(page.getByText(/taux de marché, du/)).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Montant en francs suisses')).toBeVisible();
  });

  test('une paire de la BCE : son taux, et un an d’historique en une requête', async ({
    page,
  }) => {
    const journal = await simulerTaux(page);
    await choisirReference(page, 'franc suisse', 'CHF');

    await page.getByRole('button', { name: /Changer de devise/ }).click();
    await page.getByLabel('Rechercher une devise').fill('dollar des');
    await page.getByRole('button', { name: /USD/ }).click();
    await expect(page.getByText(/taux de référence de la BCE/)).toBeVisible();

    await page.getByRole('link', { name: 'Historique' }).click();
    await expect(
      page.getByRole('heading', {
        name: /^Évolution de 1\sCHF en USD sur 1 an$/,
      })
    ).toBeVisible();
    await expect(page.getByText('Plus haut', { exact: true })).toBeVisible();
    const series = journal.filter(url =>
      /frankfurter\.dev\/v1\/\d{4}-\d{2}-\d{2}\.\./.test(url)
    );
    expect(series).toHaveLength(1);
    expect(new URL(series[0] ?? '').searchParams.get('symbols')).toBe(
      'CHF,USD'
    );
  });

  test('choisir comme référence la devise affichée échange les deux', async ({
    page,
  }) => {
    await simulerTaux(page);
    await choisirReference(page, 'livre égyptienne', 'EGP');
    await expect(
      page.getByRole('button', { name: /Changer de devise/ })
    ).toHaveAccessibleName('Changer de devise : EUR, Euro');
    await expect(
      page.getByLabel('Montant en livres égyptiennes')
    ).toBeVisible();
  });
});

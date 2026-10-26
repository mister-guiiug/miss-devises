import { expect, test, type Page } from '@playwright/test';
import { simulerTaux } from './taux.ts';

const lisible = (texte: string) => texte.replace(/\s/g, ' ');

/** Ajoute la seconde devise depuis l'écran Convertir, par la recherche. */
async function ajouterSeconde(page: Page, recherche: string, code: string) {
  await page.getByRole('button', { name: 'Ajouter une devise' }).click();
  const feuille = page.getByRole('dialog', { name: 'Seconde devise' });
  await feuille.getByLabel('Rechercher une devise').fill(recherche);
  await feuille.getByRole('button', { name: new RegExp(`^${code}`) }).click();
}

/**
 * Spécification 003, récit 1. Taux simulés : 58,83 EGP pour un euro au
 * marché, 1,0812 USD à la BCE, qui publie le dollar.
 */
test.describe('@critical 003, récit 1 : deux devises à la fois', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
    await page.goto('/');
  });

  test('les trois champs se remplissent l’un l’autre, chacun à son taux', async ({
    page,
  }) => {
    await expect(page.getByLabel(/^Montant en/)).toHaveCount(2);
    await ajouterSeconde(page, 'dollar des', 'USD');

    const eur = page.getByLabel('Montant en euros');
    const egp = page.getByLabel('Montant en livres égyptiennes');
    const usd = page.getByLabel(/^Montant en dollars/);

    await eur.fill('20');
    await expect
      .poll(async () => lisible(await egp.inputValue()))
      .toBe('1 176,60');
    await expect(usd).toHaveValue('21,62');

    await egp.fill('200');
    await expect(eur).toHaveValue('3,40');
    await expect(usd).toHaveValue('3,68');

    await usd.fill('10');
    await expect(eur).toHaveValue('9,25');
    await expect(egp).toHaveValue('544,12');

    await expect(page.getByText(/1\s€ = 58,83 EGP/)).toBeVisible();
    await expect(page.getByText(/1\s€ = 1,0812 USD/)).toBeVisible();
    await expect(
      page.getByText(/taux de référence de la BCE, du/)
    ).toBeVisible();
    await expect(page.getByText(/taux de marché, du/)).toBeVisible();
  });

  test('elle reste au rechargement, s’échange avec la devise, se retire', async ({
    page,
  }) => {
    await ajouterSeconde(page, 'dollar des', 'USD');
    await page.reload();
    await expect(page.getByLabel(/^Montant en dollars/)).toBeVisible();

    // Choisie comme devise, elle s'échange avec elle.
    await page.getByRole('button', { name: /^Changer de devise/ }).click();
    await page
      .getByRole('dialog', { name: 'Devise' })
      .getByRole('button', { name: /^USD/ })
      .click();
    await expect(
      page.getByRole('button', { name: /^Changer de seconde devise : EGP/ })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Retirer EGP' }).click();
    await expect(page.getByLabel(/^Montant en/)).toHaveCount(2);
    await page.reload();
    await expect(page.getByLabel(/^Montant en/)).toHaveCount(2);
  });

  test('un montant saisi en dollars s’enregistre de USD vers EUR', async ({
    page,
  }) => {
    await ajouterSeconde(page, 'dollar des', 'USD');
    await page.getByLabel(/^Montant en dollars/).fill('10');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Enregistré dans le carnet.')).toBeVisible();
    await page.getByRole('link', { name: 'Carnet' }).click();
    await expect(page.getByRole('listitem').first()).toContainText(
      /10,00\s\$US → 9,25\s€/
    );
  });
});

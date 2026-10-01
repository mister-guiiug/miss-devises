import { expect, test } from '@playwright/test';
import { simulerTaux } from './taux.ts';

const lisible = (texte: string) => texte.replace(/\s/g, ' ');

test.describe('@critical récit 1 : convertir dans les deux sens', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
  });

  test("l'accueil porte le nom de l'app", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Miss Devises'
    );
  });

  test('200 EGP donnent 3,40 €, et 20 € donnent 1 176,60 EGP', async ({
    page,
  }) => {
    await page.goto('/');
    const egp = page.getByLabel('Montant en livre égyptienne');
    const eur = page.getByLabel('Montant en euros');
    await egp.fill('200');
    await expect(eur).toHaveValue('3,40');
    await eur.fill('20');
    await expect
      .poll(async () => lisible(await egp.inputValue()))
      .toBe('1 176,60');
  });

  test('la ligne de taux dit la source et la date', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/1 € = 58,83 EGP/)).toBeVisible();
    await expect(page.getByText(/taux de marché, du/)).toBeVisible();
  });

  test('une devise de la BCE dit sa source', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Changer de devise/ }).click();
    await page.getByLabel('Rechercher une devise').fill('yen');
    await page.getByRole('button', { name: /JPY/ }).click();
    await expect(page.getByText(/taux de référence de la BCE/)).toBeVisible();
  });

  // AU CLAVIER, PAS À LA SOURIS : Safari ne donne pas le focus à un bouton
  // cliqué, et il n'y a alors rien à rendre en fermant. Le parcours qui
  // compte est celui de la personne qui navigue au clavier.
  test('le volet des devises se ferme par Échap et rend le focus', async ({
    page,
  }) => {
    await page.goto('/');
    const bouton = page.getByRole('button', { name: /Changer de devise/ });
    await bouton.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(bouton).toBeFocused();
  });

  test('inverser garde les montants', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Montant en livre égyptienne').fill('200');
    await page
      .getByRole('button', { name: 'Inverser les deux devises' })
      .click();
    await expect(page.getByRole('textbox').first()).toHaveAccessibleName(
      'Montant en euros'
    );
    await expect(page.getByLabel('Montant en euros')).toHaveValue('3,40');
  });
});

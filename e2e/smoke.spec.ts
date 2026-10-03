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

  test("l'accroche suit le nom, hors du titre, sans le chevaucher", async ({
    page,
  }) => {
    await page.goto('/');
    const titre = page.getByRole('heading', { level: 1 });
    const accroche = page.getByText('Convertisseur indicatif', {
      exact: true,
    });
    await expect(accroche).toBeVisible();
    await expect(titre.getByText('Convertisseur indicatif')).toHaveCount(0);
    // Le bas du TEXTE du nom, pas celui de la boîte du `h1`, que le logo
    // grandit. L'accroche est remontée contre lui (`-mt-4`, voir `App.tsx`) :
    // elle doit commencer dessous, et à moins d'une de ses lignes (1 rem).
    // L'écart dépend des métriques de la police : 3 à 5 px sous Windows,
    // 6,7 px en CI (`mobile-chrome`, 03/10/2026). Sans la remontée, il monte
    // à 19 ou 21 px : la borne de 12 px garde ce qui compte, au-delà des
    // écarts de police.
    const basDuNom = await titre.evaluate(h1 => {
      const marcheur = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
      let bas = -Infinity;
      for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
        const plage = document.createRange();
        plage.selectNodeContents(n);
        for (const r of plage.getClientRects()) bas = Math.max(bas, r.bottom);
      }
      return bas;
    });
    const boite = await accroche.boundingBox();
    if (!boite) throw new Error('accroche sans boîte');
    expect(boite.y).toBeGreaterThanOrEqual(basDuNom - 1);
    expect(boite.y - basDuNom).toBeLessThanOrEqual(12);
  });

  test('200 EGP donnent 3,40 €, et 20 € donnent 1 176,60 EGP', async ({
    page,
  }) => {
    await page.goto('/');
    const egp = page.getByLabel('Montant en livres égyptiennes');
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
    await expect(page.getByText(/1\s€ = 58,83 EGP/)).toBeVisible();
    await expect(page.getByText(/taux de marché, du/)).toBeVisible();
  });

  test('une devise de la BCE dit sa source', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Changer de devise/ }).click();
    await page.getByLabel('Rechercher une devise').fill('yen');
    await page.getByRole('button', { name: /^JPY/ }).click();
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
    await page.getByLabel('Montant en livres égyptiennes').fill('200');
    await page
      .getByRole('button', { name: 'Inverser les deux devises' })
      .click();
    await expect(page.getByRole('textbox').first()).toHaveAccessibleName(
      'Montant en euros'
    );
    await expect(page.getByLabel('Montant en euros')).toHaveValue('3,40');
  });

  test('l’en-tête porte le logo de l’application', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator(
      '[data-dwc="app-header"] img[src$="favicon.svg"]'
    );
    await expect(logo).toBeVisible();
    // Décoratif : le titre, juste après, dit déjà le nom.
    await expect(logo).toHaveAttribute('alt', '');
    await page.getByRole('link', { name: 'Historique' }).click();
    await expect(logo).toBeVisible();
  });

  test('dans une feuille, l’anneau de focus d’un champ n’est pas coupé', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Changer de devise/ }).click();
    const champ = page.getByLabel('Rechercher une devise');
    await champ.focus();
    // Le corps d'une feuille défile : ce qui dépasse de sa boîte est coupé.
    // L'anneau (épaisseur + écart) doit tenir dedans, de chaque côté.
    const marges = await champ.evaluate(input => {
      const corps = input.closest('[data-dwc="sheet-body"]');
      if (!corps) throw new Error('pas de corps de feuille');
      const style = getComputedStyle(input);
      const anneau =
        parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      const c = corps.getBoundingClientRect();
      const i = input.getBoundingClientRect();
      return {
        gauche: i.left - c.left - anneau,
        droite: c.right - i.right - anneau,
        haut: i.top - c.top - anneau,
      };
    });
    expect(marges.gauche).toBeGreaterThanOrEqual(0);
    expect(marges.droite).toBeGreaterThanOrEqual(0);
    expect(marges.haut).toBeGreaterThanOrEqual(0);
  });
});

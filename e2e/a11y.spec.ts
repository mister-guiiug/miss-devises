// Template de suite a11y minimale (axe-core + Playwright).
// Cible : <projet>/e2e/a11y.spec.ts
// Prérequis : npm i -D @axe-core/playwright
//
// Le tag @a11y permet de filtrer en CI : `playwright test --grep @a11y`.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { expectNoA11yViolations } from '@mister-guiiug/dev-pwa-config/playwright-a11y';
import { simulerTaux } from './taux.ts';

test.describe('@a11y accessibilité', () => {
  // La conversion se vérifie AVEC un taux : sans lui, axe ne verrait que
  // l'écran d'attente.
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
  });

  test("page d'accueil sans violation WCAG A/AA", async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-dwc="app-shell-skip"]')).toBeAttached();
    await expect(page.locator('main#contenu')).toBeVisible();
    await expectNoA11yViolations(page, AxeBuilder, expect);
  });

  // Axe ne juge que ce qui est rendu : on attend la courbe et ses chiffres,
  // pas l'écran de chargement.
  test('historique sans violation, courbe chargée', async ({ page }) => {
    await page.goto('/historique');
    await expect(page.getByText('Plus haut', { exact: true })).toBeVisible();
    // EXCEPTION TEMPORAIRE, UNE RÈGLE SEULEMENT : le `Stat` du socle 6.21
    // rend un `<dl>` invalide (un `<div>` autour du seul `<dt>`). Corrigé en
    // amont par dev-pwa-config#415 ; retirer l'option à la montée qui
    // l'embarque. Tout le reste de l'écran reste contrôlé.
    await expectNoA11yViolations(page, AxeBuilder, expect, {
      disableRules: ['definition-list'],
    });
  });

  test('carnet vide, puis avec une ligne, sans violation', async ({ page }) => {
    await page.goto('/carnet');
    await expect(
      page.getByText('Aucune conversion enregistrée.')
    ).toBeVisible();
    await expectNoA11yViolations(page, AxeBuilder, expect);

    await page.goto('/');
    await page.getByLabel('Montant en livre égyptienne').fill('200');
    await page.getByLabel('Libellé').fill('Visite du musée');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await page.getByRole('link', { name: 'Carnet' }).click();
    await expect(
      page.getByRole('heading', { name: 'Visite du musée' })
    ).toBeVisible();
    await expectNoA11yViolations(page, AxeBuilder, expect);
  });

  test('volet des billets ouvert, sans violation', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Montant en livre égyptienne').fill('200');
    await page.getByRole('button', { name: 'Billets et pièces' }).click();
    await expect(
      page.getByRole('region', { name: /Composition de/ })
    ).toBeVisible();
    await expectNoA11yViolations(page, AxeBuilder, expect);
  });

  test('À propos : coquille + FamilyAbout sans violation', async ({ page }) => {
    await page.goto('/a-propos');
    await expect(page.locator('[data-dwc="family-about"]')).toBeVisible();
    await expect(page.locator('[data-dwc="app-footer"]')).toBeVisible();
    await expectNoA11yViolations(page, AxeBuilder, expect);
  });
});

import { expect, test } from '@playwright/test';
import { simulerTaux } from './taux.ts';

/**
 * Spécification 002, récit 4 : une page À propos qui se lit d'un coup d'œil.
 * Les cartes de l'application sont celles que `FamilyAbout` reçoit en
 * `children` : ses enfants directs, avant la grille de la famille.
 */
test.describe('@critical 002, récit 4 : À propos se lit d’un coup d’œil', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
    await page.goto('/a-propos');
  });

  test('le nom, la version, et aucune phrase deux fois', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 2, name: 'Miss Devises' })
    ).toBeVisible();
    await expect(page.getByText(/^Version \d+\.\d+\.\d+/)).toBeVisible();

    const cartes = page.locator(
      '[data-dwc="family-about"] > [data-dwc="card"]'
    );
    const textes = (await cartes.locator('p, li').allInnerTexts())
      .map(texte => texte.trim())
      .filter(Boolean);
    expect(textes.length).toBeGreaterThan(5);
    expect(new Set(textes).size).toBe(textes.length);
  });

  test('les fonctions, les sources liées, une section de confidentialité', async ({
    page,
  }) => {
    await expect(
      page.getByRole('list', { name: 'Ce qu’elle fait' }).getByRole('listitem')
    ).toHaveCount(5);

    await expect(
      page.getByRole('link', { name: 'Frankfurter' })
    ).toHaveAttribute('href', 'https://frankfurter.dev/');
    await expect(
      page.getByRole('link', { name: 'fawazahmed0/currency-api' })
    ).toHaveAttribute('href', 'https://github.com/fawazahmed0/exchange-api');

    const confidentialite = page.getByRole('region', {
      name: 'Confidentialité',
    });
    await expect(confidentialite).toBeVisible();
    for (const origine of [
      'api.frankfurter.dev',
      'cdn.jsdelivr.net',
      'currency-api.pages.dev',
    ]) {
      await expect(confidentialite).toContainText(origine);
    }
  });

  test('rien ne déborde sur 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const deborde = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(deborde).toBe(false);
  });

  test('« M’offrir un café » une seule fois : dans le pied de page', async ({
    page,
  }) => {
    const cafe = page.getByRole('link', { name: /offrir un café/ });
    await expect(cafe).toHaveCount(1);
    await expect(
      page.locator('[data-dwc="app-footer"]').getByRole('link', {
        name: /offrir un café/,
      })
    ).toBeVisible();
  });
});

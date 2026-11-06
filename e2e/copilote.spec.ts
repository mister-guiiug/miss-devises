import { expect, test } from '@playwright/test';
import { simulerTaux } from './taux.ts';

/**
 * Spécification 007 : le copilote de démonstration, sur le BUILD DE
 * PRODUCTION, avec sa CSP. Le modèle simulé répond : aucune clé, et aucun
 * appel à Anthropic — une requête vers l'API ferait échouer le test.
 */
test.describe('@critical 007 : le copilote de démonstration', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
    await page.route(/api\.anthropic\.com/, route => {
      throw new Error(`appel inattendu à Anthropic : ${route.request().url()}`);
    });
  });

  test('éteint par défaut : rien n’en est chargé', async ({ page }) => {
    const charges: string[] = [];
    page.on('request', r => {
      if (r.url().includes('/assets/copilote/')) charges.push(r.url());
    });
    await page.goto('/');
    await expect(
      page.getByLabel('Montant en livres égyptiennes')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copilote' })).toHaveCount(0);
    expect(charges).toEqual([]);
  });

  test('activé dans les réglages, « 1200 JPY » règle l’écran Convertir', async ({
    page,
  }) => {
    const erreurs: string[] = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', m => {
      if (m.type() === 'error') erreurs.push(m.text());
    });

    await page.goto('/reglages');
    await page
      .getByRole('switch', { name: 'Copilote (démonstration)' })
      .click();
    await page.getByRole('link', { name: 'Convertir' }).click();
    await page.getByRole('button', { name: 'Copilote' }).click();

    const panneau = page.getByRole('complementary', { name: 'Copilote' });
    await expect(
      panneau.getByRole('button', { name: 'Le modèle simulé' })
    ).toBeVisible();
    await panneau.getByRole('textbox').fill('1200 JPY');
    await panneau.getByRole('button', { name: 'Envoyer' }).click();

    await expect(page.getByLabel(/^Montant en yens/)).toHaveValue('1200');
    await expect(panneau.getByText('Calculé par l’application')).toBeVisible();
    await expect(
      panneau.getByText(/^D’après l’application : 1\s200\sJPY font 7,39\s€/)
    ).toBeVisible();

    // L'inspecteur a vu les deux exécutions : l'appel d'outil, puis la réponse.
    await panneau.getByRole('tab', { name: /^Événements/ }).click();
    await expect(panneau.getByText('TOOL_CALL_START').first()).toBeVisible();
    await expect(panneau.getByText('RUN_FINISHED').first()).toBeVisible();

    expect(erreurs).toEqual([]);
  });
});

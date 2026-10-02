import { expect, test } from '@playwright/test';
import { simulerTaux } from './taux.ts';

/**
 * Les réglages, pour de vrai : une application installée n'a ni barre
 * d'adresse ni bouton de rechargement, ces deux boutons sont les siens. Le
 * rechargement se prouve par un repère posé sur `window`, que seule une page
 * neuve n'a plus ; la garde des données, par une marge réglée avant.
 */
test.describe('@critical les réglages : recharger l’application', () => {
  test('« Recharger » relance la page et reste sur les réglages', async ({
    page,
  }) => {
    await simulerTaux(page);
    await page.goto('/reglages');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Application' })
    ).toBeVisible();
    await page.evaluate(() => {
      (window as unknown as { avant?: boolean }).avant = true;
    });
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Recharger l’application' }).click(),
    ]);
    expect(
      await page.evaluate(
        () => (window as unknown as { avant?: boolean }).avant
      )
    ).toBeUndefined();
    await expect(page).toHaveURL(/\/reglages$/);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Application' })
    ).toBeVisible();
  });

  test('« Forcer la mise à jour » recharge, et la marge réglée reste', async ({
    page,
  }) => {
    await simulerTaux(page);
    await page.goto('/reglages');
    await page
      .getByRole('tablist', { name: 'Marge d’un bureau' })
      .getByRole('tab', { name: '5 %' })
      .click();
    await page.evaluate(() => {
      (window as unknown as { avant?: boolean }).avant = true;
    });
    await page.getByRole('button', { name: 'Forcer la mise à jour' }).click();
    // La purge recharge l'application à sa racine, avec un paramètre qui
    // déjoue les caches (`sw-update.js` du socle).
    await page.waitForURL(/[?&]_t=/);
    await page.waitForLoadState('load');
    expect(
      await page.evaluate(
        () => (window as unknown as { avant?: boolean }).avant
      )
    ).toBeUndefined();
    await page.goto('/reglages');
    await expect(
      page
        .getByRole('tablist', { name: 'Marge d’un bureau' })
        .getByRole('tab', { name: '5 %' })
    ).toHaveAttribute('aria-selected', 'true');
  });
});

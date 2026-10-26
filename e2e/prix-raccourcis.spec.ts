import { expect, test } from '@playwright/test';
import { simulerTaux } from './taux.ts';
import { simulerVoix } from './voix.ts';

const lisible = (texte: string | null) => (texte ?? '').replace(/\s/g, ' ');

/** Spécification 006 : dire le prix, l'annonce, les raccourcis. */
test.describe('@critical 006 : dire le prix, annoncer, raccourcis', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
  });

  test('le montant saisi se dit au vendeur, en arabe', async ({ page }) => {
    await simulerVoix(page, ['ar-EG']);
    await page.goto('/');
    await page.getByLabel('Montant en livres égyptiennes').fill('150');
    await page.getByRole('button', { name: 'Mots utiles' }).click();
    const feuille = page.getByRole('dialog', { name: 'Mots utiles' });
    const rangee = feuille.getByRole('region', { name: 'Le montant' });
    await expect
      .poll(async () => lisible(await rangee.textContent()))
      .toContain('150 EGP');
    await rangee.getByRole('button', { name: 'Écouter le montant' }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as never as { __dites: { lang: string }[] }).__dites[0]
              ?.lang
        )
      )
      .toBe('ar-EG');
  });

  test('le montant calculé est annoncé à la fin de la saisie', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Montant en livres égyptiennes').fill('200');
    const annonce = page.locator('[data-annonce]');
    await expect(annonce).toHaveAttribute('aria-live', 'polite');
    await expect
      .poll(async () => lisible(await annonce.textContent()))
      .toBe('Soit 3,40 euros.');
  });

  test('le manifeste déclare trois raccourcis', async ({ page, request }) => {
    await page.goto('/');
    const lien = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    const manifeste = await (
      await request.get(new URL(lien!, page.url()).href)
    ).json();
    expect(manifeste.shortcuts.map((s: { name: string }) => s.name)).toEqual([
      'Convertir',
      'Carnet',
      'Mots utiles',
    ]);
  });

  test('?mots ouvre les mots utiles, une fois', async ({ page }) => {
    await page.goto('/?mots');
    await expect(
      page.getByRole('dialog', { name: 'Mots utiles' })
    ).toBeVisible();
    await expect.poll(() => new URL(page.url()).search).toBe('');
  });
});

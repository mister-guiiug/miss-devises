import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { simulerTaux } from './taux.ts';

async function enregistrer(page: Page, montant: string, libelle: string) {
  await page.goto('/');
  await page.getByLabel('Montant en livres égyptiennes').fill(montant);
  await page.getByLabel('Libellé').fill(libelle);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Enregistré dans le carnet.')).toBeVisible();
}

test.describe('@critical récit 4 : garder une conversion avec un libellé', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
  });

  test('enregistrer, recharger, renommer, supprimer, annuler', async ({
    page,
  }) => {
    await enregistrer(page, '200', 'Visite du musée');

    // Recharger : le carnet vit sur l'appareil, pas dans la page.
    await page.reload();
    await page.getByRole('link', { name: 'Carnet' }).click();
    const titre = (nom: string) => page.getByRole('heading', { name: nom });
    await expect(titre('Visite du musée')).toBeVisible();
    await expect(page.getByRole('listitem').first()).toContainText(
      /200,00\sEGP → 3,40\s€/
    );

    await page.getByRole('button', { name: /Renommer « Visite/ }).click();
    const feuille = page.getByRole('dialog');
    await feuille.getByLabel('Libellé').fill('Musée égyptien');
    await feuille.getByRole('button', { name: 'Valider' }).click();
    await expect(titre('Musée égyptien')).toBeVisible();
    await page.reload();
    await expect(titre('Musée égyptien')).toBeVisible();

    await page.getByRole('button', { name: /Supprimer « Musée/ }).click();
    await expect(titre('Musée égyptien')).toBeHidden();
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(titre('Musée égyptien')).toBeVisible();
  });

  test('le carnet s’exporte en fichier, depuis les réglages', async ({
    page,
  }) => {
    await enregistrer(page, '200', 'Visite du musée');
    await page.getByRole('link', { name: 'Réglages' }).click();
    const [telechargement] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exporter le carnet' }).click(),
    ]);
    expect(telechargement.suggestedFilename()).toMatch(
      /^miss-devises-carnet-.+\.json$/
    );
    const chemin = await telechargement.path();
    expect(await readFile(chemin, 'utf8')).toContain('Visite du musée');
  });
});

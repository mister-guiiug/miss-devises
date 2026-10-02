import { expect, test, type Locator, type Page } from '@playwright/test';
import { simulerPhotos, simulerTaux } from './taux.ts';

/** Les photos du volet : une image par coupure photographiée. */
const photos = (volet: Locator) => volet.locator('img[data-photo]');
/** L'interrupteur de la rangée « Vraies photos ». */
const interrupteur = (volet: Locator) =>
  volet.getByRole('switch', { name: 'Vraies photos' });

async function ouvrirVolet(page: Page) {
  await page.getByLabel('Montant en livres égyptiennes').fill('200');
  await page.getByRole('button', { name: 'Billets et pièces' }).click();
  const volet = page.getByRole('dialog', { name: 'Billets et pièces' });
  await expect(volet.getByRole('region', { name: 'Billets' })).toBeVisible();
  return volet;
}

/**
 * Spécification 002, récit 3 : voir les vrais billets et pièces. Les photos
 * de Wikimedia sont simulées (un pixel) ; le journal dit ce qui serait parti.
 */
test.describe('@critical 002, récit 3 : les photos de Wikimedia Commons', () => {
  test('en mode dessins, rien ne part vers Wikimedia', async ({ page }) => {
    await simulerTaux(page);
    const journal = await simulerPhotos(page);
    await page.goto('/');
    const volet = await ouvrirVolet(page);
    // Le compte vient du jeu servi par l'application, pas de Wikimedia.
    await expect(interrupteur(volet)).toHaveAttribute('aria-checked', 'false');
    await expect(volet.getByText('3 sur 12 coupures')).toBeVisible();
    // Les billets égyptiens restent dessinés : un lien mène à leur article,
    // sans rien demander à Wikimedia avant le clic.
    await expect(
      volet.getByRole('link', { name: /^Les vraies, sur Wikipédia/ })
    ).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Egyptian_pound');
    await volet.getByRole('tab', { name: 'En EUR' }).click();
    await expect(volet.getByText('13 sur 15 coupures')).toBeVisible();
    expect(journal).toEqual([]);
    await expect(photos(volet)).toHaveCount(0);
  });

  test('l’avis d’abord, puis les photos, leurs crédits, et le choix gardé', async ({
    page,
  }) => {
    await simulerTaux(page);
    const journal = await simulerPhotos(page);
    await page.goto('/');
    const volet = await ouvrirVolet(page);

    await interrupteur(volet).click();
    const avis = volet.getByRole('region', {
      name: 'Les photos viennent de Wikimedia Commons',
    });
    await expect(avis).toContainText('adresse IP');
    const afficher = avis.getByRole('button', { name: 'Afficher les photos' });
    await expect(afficher).toBeFocused();
    expect(journal).toEqual([]);

    await afficher.click();
    await expect(interrupteur(volet)).toHaveAttribute('aria-checked', 'true');
    // Les pièces égyptiennes ont leur photo ; les neuf billets, que le Code
    // pénal égyptien réserve, gardent leur dessin et le disent. L'euro les a
    // presque tous.
    await expect(photos(volet).first()).toBeVisible();
    await expect(volet.getByText('Dessin', { exact: true })).toHaveCount(9);
    await volet.getByRole('tab', { name: 'En EUR' }).click();
    await expect.poll(() => photos(volet).count()).toBeGreaterThan(5);
    // Chaque photo part sans référent ni cookie.
    await expect.poll(() => journal.length).toBeGreaterThan(0);
    for (const requete of journal) {
      expect(requete.url).toMatch(
        /^https:\/\/(thumb|upload)\.wikimedia\.org\//
      );
      expect(requete.referent).toBeUndefined();
      expect(requete.cookie).toBeUndefined();
    }
    // Un crédit par coupure photographiée, et la liste des crédits. La
    // composition du montant reprend des photos : on compte les sections.
    const sections = volet.getByRole('region', { name: /^(Billets|Pièces)$/ });
    await expect(
      volet.getByRole('link', { name: /^Crédit de la photo : / })
    ).toHaveCount(await photos(sections).count());
    await volet.getByText('Crédits des photos').click();
    await expect(
      volet.getByRole('link', { name: 'Wikimedia Commons' }).first()
    ).toHaveAttribute(
      'href',
      /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/
    );

    // Le choix survit au rechargement, et l'avis ne revient pas.
    await page.reload();
    const rouvert = await ouvrirVolet(page);
    await expect(photos(rouvert).first()).toBeVisible();
    await expect(
      rouvert.getByRole('region', {
        name: 'Les photos viennent de Wikimedia Commons',
      })
    ).toHaveCount(0);
  });

  test('une devise sans photo libre garde ses dessins, et le dit', async ({
    page,
  }) => {
    await simulerTaux(page);
    await simulerPhotos(page);
    await page.goto('/');
    const volet = await ouvrirVolet(page);
    await interrupteur(volet).click();
    await volet.getByRole('button', { name: 'Afficher les photos' }).click();
    await expect(photos(volet).first()).toBeVisible();
    await page.keyboard.press('Escape');

    // Le dirham marocain : Commons n'a pas de photo libre de sa série.
    await page.getByRole('button', { name: /Changer de devise/ }).click();
    await page.getByLabel('Rechercher une devise').fill('dirham');
    await page.getByRole('button', { name: /^MAD/ }).click();
    await page.getByRole('button', { name: 'Billets et pièces' }).click();
    const marocain = page.getByRole('dialog', { name: 'Billets et pièces' });
    await expect(
      marocain.getByText('Aucune photo libre pour cette devise.')
    ).toBeVisible();
    await expect(photos(marocain)).toHaveCount(0);
    // Déjà en mode photos, l'interrupteur reste actif : on doit pouvoir en
    // sortir. En dessins, il est grisé.
    await expect(interrupteur(marocain)).not.toHaveAttribute('aria-disabled');
    await interrupteur(marocain).click();
    await expect(interrupteur(marocain)).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });
});

import { expect, test, type Locator } from '@playwright/test';
import { simulerTaux } from './taux.ts';

/** Le drapeau d'un bouton : une image de pays, ou le signe neutre. */
const drapeau = (bouton: Locator) => bouton.locator('[data-drapeau]');

/** Une image affichée a une largeur naturelle : elle a bien été chargée. */
const chargee = (image: Locator) =>
  image.evaluate(
    element => element instanceof HTMLImageElement && element.naturalWidth > 0
  );

/** Spécification 002, récit 2 : reconnaître chaque devise à son drapeau. */
test.describe('@critical 002, récit 2 : un drapeau pour chaque devise', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
    await page.goto('/');
  });

  test('chaque devise de la liste a son drapeau, ou un signe neutre', async ({
    page,
  }) => {
    const bouton = page.getByRole('button', { name: /Changer de devise/ });
    await expect(drapeau(bouton)).toHaveAttribute('data-drapeau', 'EG');
    await expect.poll(() => chargee(drapeau(bouton))).toBe(true);
    // Le drapeau est muet : le bouton dit toujours le code et le nom.
    await expect(bouton).toHaveAccessibleName(
      'Changer de devise : EGP, Livre égyptienne'
    );

    await bouton.click();
    const liste = page.getByRole('dialog').getByRole('listitem');
    const nombre = await liste.count();
    expect(nombre).toBeGreaterThan(5);
    for (let i = 0; i < nombre; i++) {
      await expect(drapeau(liste.nth(i))).toHaveCount(1);
    }

    // Le franc CFA d'Afrique de l'Ouest n'a pas de pays : signe neutre.
    const xof = page.getByRole('dialog').getByRole('button', { name: /XOF/ });
    await expect(drapeau(xof)).toHaveAttribute('data-drapeau', 'neutre');
    const usd = page.getByRole('dialog').getByRole('button', { name: /USD/ });
    await expect(drapeau(usd)).toHaveAttribute('data-drapeau', 'US');
  });

  test('le volet et le carnet montrent les drapeaux de la paire', async ({
    page,
  }) => {
    await page.getByLabel('Montant en livre égyptienne').fill('200');
    await page.getByRole('button', { name: 'Billets et pièces' }).click();
    const volet = page.getByRole('dialog', { name: 'Billets et pièces' });
    await expect(
      drapeau(volet.getByRole('tab', { name: 'En EGP' }))
    ).toHaveAttribute('data-drapeau', 'EG');
    await expect(
      drapeau(volet.getByRole('tab', { name: 'En euros' }))
    ).toHaveAttribute('data-drapeau', 'EU');
    await page.keyboard.press('Escape');

    await page.getByLabel('Libellé').fill('Visite du musée');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await page.getByRole('link', { name: 'Carnet' }).click();
    const ligne = page.getByRole('listitem').first();
    await expect(drapeau(ligne)).toHaveCount(2);
    await expect(drapeau(ligne).first()).toHaveAttribute('data-drapeau', 'EG');
    await expect(drapeau(ligne).last()).toHaveAttribute('data-drapeau', 'EU');
  });

  test('hors ligne, les drapeaux restent : ils sont livrés avec l’application', async ({
    page,
    context,
    browserName,
  }) => {
    // Playwright ne pilote les service workers que dans Chromium (la CI joue
    // chromium et mobile-chrome).
    test.skip(
      browserName !== 'chromium',
      'service worker : Chromium seulement'
    );
    // Le service worker précache les drapeaux ; il ne sert la page qu'à la
    // navigation suivante.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);

    await context.setOffline(true);
    await page.reload();
    const bouton = page.getByRole('button', { name: /Changer de devise/ });
    await expect.poll(() => chargee(drapeau(bouton))).toBe(true);
    await context.setOffline(false);
  });

  test('À propos crédite les drapeaux et leur licence', async ({ page }) => {
    await page.goto('/a-propos');
    const credit = page.getByRole('link', { name: 'country-flag-icons' });
    await expect(credit).toHaveAttribute(
      'href',
      'https://gitlab.com/catamphetamine/country-flag-icons'
    );
    await expect(
      page.getByRole('listitem').filter({ has: credit })
    ).toContainText('licence MIT');
  });
});

import { expect, test, type Page } from '@playwright/test';
import { simulerTaux } from './taux.ts';

const lisible = (texte: string) => texte.replace(/\s/g, ' ');

/** Appuie sur les touches du pavé, nommées comme un lecteur d'écran les dit. */
async function touches(page: Page, noms: string[]) {
  const pave = page.getByRole('group', { name: 'Calculatrice' });
  for (const nom of noms) {
    await pave.getByRole('button', { name: nom, exact: true }).click();
  }
}

/** Spécification 003, récit 2. 58,83 EGP pour un euro, au marché. */
test.describe('@critical 003, récit 2 : une mini-calculatrice dans la saisie', () => {
  test.beforeEach(async ({ page }) => {
    await simulerTaux(page);
    await page.goto('/');
  });

  test('éteinte par défaut ; allumée, elle le reste au rechargement', async ({
    page,
  }) => {
    const bouton = page.getByRole('button', { name: 'Calculatrice' });
    await expect(bouton).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByLabel('Montant en euros')).toHaveAttribute(
      'inputmode',
      'decimal'
    );
    await bouton.click();
    await expect(
      page.getByRole('group', { name: 'Calculatrice' })
    ).toBeVisible();
    await expect(page.getByLabel('Montant en euros')).toHaveAttribute(
      'inputmode',
      'none'
    );
    await page.reload();
    await expect(
      page.getByRole('group', { name: 'Calculatrice' })
    ).toBeVisible();
  });

  test('« 12,5 + 7,5 » dans les euros : le résultat, les livres, puis « = »', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Calculatrice' }).click();
    const eur = page.getByLabel('Montant en euros');
    const egp = page.getByLabel('Montant en livres égyptiennes');
    await eur.click();
    await touches(page, [
      '1',
      '2',
      'virgule',
      '5',
      'plus',
      '7',
      'virgule',
      '5',
    ]);
    await expect(eur).toHaveValue('12,5 + 7,5');
    await expect(page.getByText(/^=\s20,00\s€$/)).toBeVisible();
    await expect
      .poll(async () => lisible(await egp.inputValue()))
      .toBe('1 176,60');
    await expect(eur).toBeFocused();

    await touches(page, ['Égal']);
    await expect(eur).toHaveValue('20,00');
  });

  test('dans un autre champ, un opérateur reprend le montant affiché', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Calculatrice' }).click();
    const eur = page.getByLabel('Montant en euros');
    const egp = page.getByLabel('Montant en livres égyptiennes');
    await egp.click();
    await touches(page, ['2', '0', '0']);
    await expect(eur).toHaveValue('3,40');
    await eur.click();
    await touches(page, ['plus', '1']);
    await expect(eur).toHaveValue('3,40 + 1');
    await expect(egp).toHaveValue('258,85');
  });

  test('calculatrice éteinte, un calcul tapé au clavier est compris', async ({
    page,
  }) => {
    await page.getByLabel('Montant en euros').fill('12+8');
    await expect
      .poll(async () =>
        lisible(
          await page.getByLabel('Montant en livres égyptiennes').inputValue()
        )
      )
      .toBe('1 176,60');
  });
});

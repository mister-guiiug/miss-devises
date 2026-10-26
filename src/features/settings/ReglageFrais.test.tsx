import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../i18n/index.ts';
import { usePreferences } from '../../app/preferences.ts';
import { ReglageFrais } from './ReglageFrais.tsx';

const lisible = (texte: string | null | undefined) =>
  (texte ?? '').replace(/\s/g, ' ');

function monter() {
  render(
    <I18nProvider>
      <ReglageFrais reference="EUR" codes={['EUR', 'EGP', 'THB', 'USD']} />
    </I18nProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
  usePreferences.setState({ reference: 'EUR', frais: [], fraisChoisis: null });
});

afterEach(cleanup);

async function remplir(
  user: ReturnType<typeof userEvent.setup>,
  champs: { libelle?: string; pourcentage?: string; fixe?: string }
) {
  const feuille = screen.getByRole('dialog');
  for (const [nom, valeur] of [
    ['Libellé', champs.libelle],
    ['Pourcentage', champs.pourcentage],
    ['Montant fixe par opération', champs.fixe],
  ] as const) {
    if (valeur === undefined) continue;
    const champ = within(feuille).getByLabelText(nom);
    await user.clear(champ);
    if (valeur) await user.type(champ, valeur);
  }
  return feuille;
}

describe('les frais dans les réglages (spécification 005, récit 1)', () => {
  it('aucun frais : le dit, et propose d’en ajouter', () => {
    monter();
    expect(screen.getByText('Aucun frais enregistré.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ajouter des frais' })
    ).toBeInTheDocument();
  });

  it('ajoute « Carte » : 2 % et 0,50 €, en euros par défaut', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(screen.getByRole('button', { name: 'Ajouter des frais' }));
    const feuille = await remplir(user, {
      libelle: 'Carte',
      pourcentage: '2',
      fixe: '0,50',
    });
    await user.click(
      within(feuille).getByRole('button', { name: 'Enregistrer' })
    );
    expect(usePreferences.getState().frais).toMatchObject([
      { libelle: 'Carte', pourcentage: 2, fixe: 0.5, deviseFixe: 'EUR' },
    ]);
    const ligne = screen.getByRole('listitem');
    expect(lisible(ligne.textContent)).toContain('Carte');
    expect(lisible(ligne.textContent)).toContain('2 % + 0,50 €');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('refuse des frais sans libellé, ou nuls', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(screen.getByRole('button', { name: 'Ajouter des frais' }));
    let feuille = await remplir(user, { libelle: '', pourcentage: '2' });
    await user.click(
      within(feuille).getByRole('button', { name: 'Enregistrer' })
    );
    expect(
      within(feuille).getByText(/Un libellé, et un pourcentage/)
    ).toBeInTheDocument();
    feuille = await remplir(user, { libelle: 'Rien', pourcentage: '0' });
    await user.click(
      within(feuille).getByRole('button', { name: 'Enregistrer' })
    );
    expect(usePreferences.getState().frais).toHaveLength(0);
  });

  it('modifie, puis supprime (scénario 5)', async () => {
    const user = userEvent.setup();
    usePreferences.getState().ajouterFrais({
      libelle: 'Carte',
      pourcentage: 2,
      fixe: 0.5,
      deviseFixe: 'EUR',
    });
    monter();
    await user.click(screen.getByRole('button', { name: 'Modifier Carte' }));
    const feuille = await remplir(user, { pourcentage: '3' });
    await user.click(
      within(feuille).getByRole('button', { name: 'Enregistrer' })
    );
    expect(lisible(screen.getByRole('listitem').textContent)).toContain(
      '3 % + 0,50 €'
    );
    await user.click(screen.getByRole('button', { name: 'Supprimer Carte' }));
    expect(usePreferences.getState().frais).toEqual([]);
    expect(screen.getByText('Aucun frais enregistré.')).toBeInTheDocument();
  });
});

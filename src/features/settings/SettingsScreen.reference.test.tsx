import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../i18n/index.ts';
import { usePreferences } from '../../app/preferences.ts';
import { useTaux } from '../../rates/store.ts';
import { SettingsScreen } from './SettingsScreen.tsx';

const AUJOURDHUI = new Date().toISOString().slice(0, 10);

function monter() {
  render(
    <I18nProvider>
      <SettingsScreen />
    </I18nProvider>
  );
}

/** Ouvre la liste de la référence et choisit une devise par son code. */
async function choisir(code: string) {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: /Changer de monnaie de référence/ })
  );
  const feuille = screen.getByRole('dialog', { name: 'Monnaie de référence' });
  await user.click(
    within(feuille).getByRole('button', { name: new RegExp(code) })
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
  useTaux.setState({
    etat: {
      marche: {
        source: 'marche',
        date: AUJOURDHUI,
        taux: { EGP: 58.83, CHF: 0.9384 },
      },
    },
    pret: true,
    chargement: false,
    echec: false,
  });
  usePreferences.setState({ reference: 'EUR', devise: 'EGP' });
});

afterEach(cleanup);

describe('la monnaie de référence dans les réglages (spécification 002)', () => {
  it('montre l’euro par défaut, et se change', async () => {
    monter();
    expect(
      screen.getByRole('button', { name: /Changer de monnaie de référence/ })
    ).toHaveAccessibleName('Changer de monnaie de référence : EUR, Euro');
    await choisir('CHF');
    expect(usePreferences.getState().reference).toBe('CHF');
    expect(usePreferences.getState().devise).toBe('EGP');
  });

  it('choisir la devise affichée échange les deux', async () => {
    monter();
    await choisir('EGP');
    expect(usePreferences.getState().reference).toBe('EGP');
    expect(usePreferences.getState().devise).toBe('EUR');
  });
});

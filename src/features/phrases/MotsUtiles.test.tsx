import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../i18n/index.ts';
import { MotsUtiles } from './MotsUtiles.tsx';

function monter(langues: string[]) {
  render(
    <I18nProvider>
      <MotsUtiles open onClose={() => {}} langues={langues} />
    </I18nProvider>
  );
  return screen.getByRole('dialog', { name: 'Mots utiles' });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
});

afterEach(cleanup);

describe('la feuille des mots utiles (spécification 004)', () => {
  it('l’arabe égyptien : quatre groupes, le texte, sa transcription et son sens (scénario 1)', () => {
    const feuille = monter(['ar-EG']);
    expect(within(feuille).getByText('En arabe (Égypte)')).toBeInTheDocument();
    for (const groupe of [
      'Les bases',
      'Marchander',
      'La monnaie',
      'L’addition',
    ]) {
      expect(
        within(feuille).getByRole('heading', { name: groupe })
      ).toBeInTheDocument();
    }
    const phrase = within(feuille).getByText('بكام ده؟');
    expect(phrase).toHaveAttribute('lang', 'ar-EG');
    expect(phrase).toHaveAttribute('dir', 'rtl');
    expect(within(feuille).getByText('bikam da?')).toBeInTheDocument();
    expect(within(feuille).getByText('Combien ça coûte ?')).toBeInTheDocument();
    expect(within(feuille).getAllByRole('listitem')).toHaveLength(16);
  });

  it('le sens suit la langue de l’application (scénario 2)', () => {
    localStorage.setItem('dwc_locale', 'en');
    render(
      <I18nProvider>
        <MotsUtiles open onClose={() => {}} langues={['ar-EG']} />
      </I18nProvider>
    );
    const feuille = screen.getByRole('dialog', { name: 'Useful phrases' });
    expect(within(feuille).getByText('How much is it?')).toBeInTheDocument();
    expect(within(feuille).getByText('In Arabic (Egypt)')).toBeInTheDocument();
  });

  it('plusieurs langues : la première d’abord, les autres au choix (scénario 3)', async () => {
    const user = userEvent.setup();
    const feuille = monter(['de', 'it']);
    expect(
      within(feuille).getByText('Wie viel kostet das?')
    ).toBeInTheDocument();
    await user.click(within(feuille).getByRole('tab', { name: 'italien' }));
    expect(within(feuille).getByText('Quanto costa?')).toHaveAttribute(
      'lang',
      'it'
    );
    expect(within(feuille).queryByText('Wie viel kostet das?')).toBeNull();
  });

  it('une phrase touchée s’affiche en grand, et le retour rend le focus (scénario 5)', async () => {
    const user = userEvent.setup();
    const feuille = monter(['ar-EG']);
    const bouton = within(feuille).getByRole('button', { name: /بكام ده؟/ });
    await user.click(bouton);
    const grande = within(feuille).getByRole('region', {
      name: 'Combien ça coûte ?',
    });
    expect(within(grande).getByText('بكام ده؟')).toHaveAttribute(
      'lang',
      'ar-EG'
    );
    expect(within(grande).getByText('bikam da?')).toBeInTheDocument();
    expect(within(feuille).queryAllByRole('listitem')).toHaveLength(0);
    await user.click(
      within(feuille).getByRole('button', { name: 'Retour à la liste' })
    );
    expect(
      within(feuille).getByRole('button', { name: /بكام ده؟/ })
    ).toHaveFocus();
  });
});

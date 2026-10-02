import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../../i18n/index.ts';
import { Courbe } from './Courbe.tsx';

const lisible = (texte: string | null | undefined) =>
  (texte ?? '').replace(/\s/g, ' ');

const POINTS = [
  { date: '2025-10-01', taux: 56.18 },
  { date: '2026-01-05', taux: 50.9 },
  { date: '2026-06-01', taux: 60.4 },
  { date: '2026-10-01', taux: 58.83 },
];

function monter() {
  render(
    <I18nProvider>
      <Courbe
        points={POINTS}
        reference="EUR"
        devise="EGP"
        description="Quatre points."
      />
    </I18nProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
});

afterEach(cleanup);

describe('la courbe qui se lit (spécification 002, récit 5)', () => {
  it('ses axes disent le plus haut, le plus bas, la première et la dernière date', () => {
    monter();
    const axes = lisible(screen.getByTestId('courbe-axes').textContent);
    expect(axes).toContain('60,4 EGP');
    expect(axes).toContain('50,9 EGP');
    expect(axes).toContain('1 oct. 2025');
    expect(axes).toContain('1 oct. 2026');
  });

  // user-event ne sait pas déplacer un curseur natif dans jsdom : le pas du
  // clavier est celui du navigateur, éprouvé par l'e2e ; ici, le changement.
  it('le curseur part du dernier point, et se lit à chaque pas', () => {
    monter();
    const curseur = screen.getByRole('slider', { name: 'Lire la courbe' });
    expect(lisible(curseur.getAttribute('aria-valuetext'))).toBe(
      'Le 1 oct. 2026 : 1 € = 58,83 EGP'
    );
    fireEvent.change(curseur, { target: { value: '2' } });
    expect(lisible(curseur.getAttribute('aria-valuetext'))).toBe(
      'Le 1 juin 2026 : 1 € = 60,4 EGP'
    );
    // La lecture s'écrit aussi en clair au-dessus de la courbe ; le curseur
    // l'annonce déjà, le texte ne la répète pas au lecteur d'écran.
    const lecture = screen.getByTestId('courbe-lecture');
    expect(lecture).toHaveAttribute('aria-hidden', 'true');
    expect(lisible(lecture.textContent)).toBe(
      'Le 1 juin 2026 : 1 € = 60,4 EGP'
    );
  });

  it('marque le point choisi sur la courbe', () => {
    const { container } = render(
      <I18nProvider>
        <Courbe
          points={POINTS}
          reference="EUR"
          devise="EGP"
          description="Quatre points."
        />
      </I18nProvider>
    );
    const marque = () =>
      container.querySelector('[data-courbe="curseur"]')?.getAttribute('cx');
    const avant = marque();
    const curseur = screen.getByRole('slider', { name: 'Lire la courbe' });
    fireEvent.change(curseur, { target: { value: '0' } });
    expect(marque()).not.toBe(avant);
  });
});

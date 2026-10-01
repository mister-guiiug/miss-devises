import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Banknote } from './Banknote.tsx';
import { Coin } from './Coin.tsx';
import { TEINTES } from './metaux.ts';

describe('Banknote : un billet stylisé (recherche R6)', () => {
  it('se nomme, et garde les proportions réelles du billet', () => {
    render(
      <Banknote
        couleur="#7a5c8f"
        texte="200"
        code="EUR"
        largeurMm={153}
        hauteurMm={82}
        largeur={153}
        libelle="Billet de 200 €, soit 11 766 EGP"
      />
    );
    const dessin = screen.getByRole('img', {
      name: 'Billet de 200 €, soit 11 766 EGP',
    });
    expect(dessin.getAttribute('width')).toBe('153');
    expect(Number(dessin.getAttribute('height'))).toBeCloseTo(82, 5);
  });

  it('sans dimensions connues, un rectangle de 2 pour 1', () => {
    render(
      <Banknote
        couleur="#2e7d32"
        texte="5"
        code="EGP"
        largeur={120}
        libelle="b"
      />
    );
    expect(screen.getByRole('img').getAttribute('height')).toBe('60');
  });

  it('écrit en blanc sur un billet sombre, en noir sur un billet clair', () => {
    const { container, rerender } = render(
      <Banknote
        couleur="#1b2a49"
        texte="50"
        code="USD"
        largeur={120}
        libelle="b"
      />
    );
    expect(container.querySelector('text')?.getAttribute('fill')).toBe(
      '#ffffff'
    );
    rerender(
      <Banknote
        couleur="#f2d16b"
        texte="50"
        code="USD"
        largeur={120}
        libelle="b"
      />
    );
    expect(container.querySelector('text')?.getAttribute('fill')).toBe(
      '#000000'
    );
  });

  it('un billet qui n’est plus émis se distingue', () => {
    render(
      <Banknote
        couleur="#7a5c8f"
        texte="500"
        code="EUR"
        largeur={120}
        libelle="b"
        plusEmis
      />
    );
    expect(screen.getByRole('img').dataset.plusEmis).toBe('true');
  });
});

describe('Coin : une pièce stylisée', () => {
  it('se nomme, à son diamètre', () => {
    render(
      <Coin
        metal="cuivre"
        texte="0,05"
        diametre={42}
        libelle="Pièce de 0,05 €"
      />
    );
    const dessin = screen.getByRole('img', { name: 'Pièce de 0,05 €' });
    expect(dessin.getAttribute('width')).toBe('42');
    expect(dessin.getAttribute('height')).toBe('42');
  });

  it('une pièce simple est un disque à la teinte de son métal', () => {
    const { container } = render(
      <Coin metal="laiton" texte="0,50" diametre={48} libelle="p" />
    );
    const disques = container.querySelectorAll('circle');
    expect(disques).toHaveLength(1);
    expect(disques[0]?.getAttribute('fill')).toBe(TEINTES.laiton);
  });

  it('le bimétal porte un anneau : le centre, puis l’anneau', () => {
    // La pièce de 2 € : centre doré (un laiton), anneau argenté.
    const { container } = render(
      <Coin metal="bimetal-or-argent" texte="2" diametre={52} libelle="p" />
    );
    const [anneau, centre] = container.querySelectorAll('circle');
    expect(anneau?.getAttribute('fill')).toBe(TEINTES.argent);
    expect(centre?.getAttribute('fill')).toBe(TEINTES.laiton);
  });
});

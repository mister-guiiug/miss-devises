import { describe, expect, it } from 'vitest';
import { contraste, encreSur } from './contraste.ts';

describe('contraste : le rapport WCAG entre deux couleurs', () => {
  it('noir sur blanc vaut 21, une couleur sur elle-même 1', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contraste('#3b6ea5', '#3b6ea5')).toBeCloseTo(1, 5);
  });

  it('est symétrique et lit la forme courte', () => {
    expect(contraste('#fff', '#767676')).toBeCloseTo(
      contraste('#767676', '#ffffff'),
      10
    );
    // Le gris #767676 est le plus clair qui tienne 4,5 sur du blanc.
    expect(contraste('#fff', '#767676')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('encreSur : du noir ou du blanc, le plus lisible', () => {
  it.each([
    ['#ffffff', '#000000'],
    ['#000000', '#ffffff'],
    ['#7a1f1f', '#ffffff'],
    ['#f2d16b', '#000000'],
    ['#808080', '#000000'],
  ])('sur %s, %s', (fond, encre) => {
    expect(encreSur(fond)).toBe(encre);
  });

  it('tient toujours au moins 4,5 : le texte d’un billet reste lisible', () => {
    for (let i = 0; i < 4096; i += 7) {
      const fond = `#${i.toString(16).padStart(3, '0')}`;
      expect(contraste(fond, encreSur(fond))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('refuse une couleur illisible plutôt que de deviner', () => {
    expect(() => encreSur('rouge')).toThrow(RangeError);
  });
});

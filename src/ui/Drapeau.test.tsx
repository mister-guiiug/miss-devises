import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Drapeau } from './Drapeau.tsx';

afterEach(cleanup);

describe('Drapeau', () => {
  it('montre le fichier du pays émetteur, à 3 : 2', () => {
    const { container } = render(<Drapeau code="EGP" hauteur={16} />);
    const image = container.querySelector('img');
    expect(image?.getAttribute('src')).toMatch(/EG.*\.svg/);
    expect(image?.getAttribute('data-drapeau')).toBe('EG');
    expect(image?.getAttribute('width')).toBe('24');
    expect(image?.getAttribute('height')).toBe('16');
  });

  it('montre un signe neutre pour une devise de plusieurs pays', () => {
    const { container } = render(<Drapeau code="XAF" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-drapeau="neutre"]')).not.toBeNull();
  });

  it('n’est pas annoncé : le code et le nom de la devise le disent', () => {
    render(
      <>
        <Drapeau code="JPY" />
        <Drapeau code="XOF" />
      </>
    );
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});

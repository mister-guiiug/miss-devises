const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `#rgb` ou `#rrggbb` → luminance relative (WCAG 2), entre 0 et 1. */
function luminance(couleur: string): number {
  const brut = HEX.exec(couleur)?.[1];
  if (!brut) throw new RangeError(`Couleur illisible : ${couleur}`);
  const hex = brut.length === 3 ? [...brut].map(c => c + c).join('') : brut;
  const canal = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
}

/** Le rapport de contraste WCAG entre deux couleurs, de 1 à 21. */
export function contraste(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * L'encre d'un texte posé sur `fond` : du noir ou du blanc, celui qui
 * contraste le plus (recherche R6). L'un des deux tient toujours au moins
 * 4,58 : le plus petit maximum possible, atteint vers une luminance de 0,18.
 */
export function encreSur(fond: string): '#000000' | '#ffffff' {
  return contraste(fond, '#000000') >= contraste(fond, '#ffffff')
    ? '#000000'
    : '#ffffff';
}

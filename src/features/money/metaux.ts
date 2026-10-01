import type { Metal } from '../../data/coupures.ts';

export type { Metal };

/**
 * Une teinte par famille de métal, pas par alliage : l'œil distingue le
 * cuivré, le doré et l'argenté, et c'est tout ce qu'un dessin doit dire.
 * L'« or » d'une pièce bimétallique est un laiton : même teinte.
 */
export const TEINTES = {
  cuivre: '#b87333',
  laiton: '#d4b14e',
  argent: '#c9ced3',
  autre: '#a3a9b0',
} as const;

/** Bimétal : le CENTRE d'abord, l'ANNEAU ensuite (`or-argent` : la 2 €). */
export const PARTIES: Record<Metal, { centre: string; anneau?: string }> = {
  cuivre: { centre: TEINTES.cuivre },
  laiton: { centre: TEINTES.laiton },
  argent: { centre: TEINTES.argent },
  'bimetal-or-argent': { centre: TEINTES.laiton, anneau: TEINTES.argent },
  'bimetal-argent-or': { centre: TEINTES.argent, anneau: TEINTES.laiton },
  autre: { centre: TEINTES.autre },
};

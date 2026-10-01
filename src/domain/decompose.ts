import { arrondir } from './money.ts';

export interface Coupure {
  /** Dans l'unité principale : 0.2 pour une pièce de 20 centimes. */
  valeur: number;
  plusEmis?: boolean;
}

/** Ce que la décomposition lit d'une devise : ses décimales, ses coupures. */
export interface Systeme {
  decimales: number;
  billets: readonly Coupure[];
  pieces: readonly Coupure[];
}

export interface Ligne {
  valeur: number;
  type: 'billet' | 'piece';
  nombre: number;
}

export interface Decomposition {
  /** Du plus grand au plus petit, sans ligne à zéro. */
  lignes: Ligne[];
  /** Ce qui reste sous la plus petite pièce, dans l'unité principale. */
  reste: number;
}

/**
 * Un montant en billets et en pièces (recherche R5) : glouton, du plus grand
 * au plus petit, sur les coupures encore émises, en unités mineures ENTIÈRES
 * pour que 0,1 + 0,2 fassent 0,3. Les systèmes du jeu de données sont
 * canoniques (1-2-5, 25-50) : le glouton y donne le moins de coupures.
 *
 * Une valeur émise à la fois en billet et en pièce compte une fois, en pièce :
 * c'est la forme sous laquelle on rend la monnaie.
 */
export function decomposer(montant: number, systeme: Systeme): Decomposition {
  if (!Number.isFinite(montant) || montant <= 0)
    return { lignes: [], reste: 0 };

  const facteur = 10 ** systeme.decimales;
  const enMineures = (valeur: number) =>
    Math.round(arrondir(valeur, systeme.decimales) * facteur);

  const coupures = new Map<number, Omit<Ligne, 'nombre'>>();
  const retenir = (liste: readonly Coupure[], type: Ligne['type']) => {
    for (const { valeur, plusEmis } of liste) {
      const mineures = enMineures(valeur);
      if (!plusEmis && mineures > 0) coupures.set(mineures, { valeur, type });
    }
  };
  retenir(systeme.billets, 'billet');
  retenir(systeme.pieces, 'piece');

  let reste = enMineures(montant);
  const lignes: Ligne[] = [];
  for (const [mineures, coupure] of [...coupures].sort((a, b) => b[0] - a[0])) {
    const nombre = Math.floor(reste / mineures);
    if (nombre > 0) {
      lignes.push({ ...coupure, nombre });
      reste -= nombre * mineures;
    }
  }
  return { lignes, reste: reste / facteur };
}

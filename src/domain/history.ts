import { convertir, type Sens } from './convert.ts';

/** Un taux daté : unités de la devise pour un euro. */
export interface Point {
  date: string;
  taux: number;
}

export interface Statistiques {
  debut: Point;
  fin: Point;
  plusHaut: Point;
  plusBas: Point;
  /** Variation du taux d'un euro, en fraction : 0,05 pour +5 %. */
  variation: number;
}

/**
 * Ce qu'une période dit du taux (récit 3, EF-008) : ses bornes, ses extrêmes
 * et sa variation. À égalité, le premier extrême atteint l'emporte.
 */
export function statistiques(
  points: readonly Point[]
): Statistiques | undefined {
  const tries = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const debut = tries[0];
  const fin = tries.at(-1);
  if (!debut || !fin) return undefined;
  let plusHaut = debut;
  let plusBas = debut;
  for (const point of tries) {
    if (point.taux > plusHaut.taux) plusHaut = point;
    if (point.taux < plusBas.taux) plusBas = point;
  }
  return {
    debut,
    fin,
    plusHaut,
    plusBas,
    variation: fin.taux / debut.taux - 1,
  };
}

export interface Comparaison {
  /** La contre-valeur au début de la période. */
  avant: number;
  /** La contre-valeur aujourd'hui. */
  maintenant: number;
  /** `maintenant - avant`, dans la devise de la contre-valeur. */
  ecart: number;
  /** L'écart rapporté à `avant`, en fraction. */
  pourcentage: number;
}

/**
 * Le montant saisi, converti au taux du début de la période puis à celui
 * d'aujourd'hui (EF-009). Sans arrondi : il se fait à l'affichage.
 */
export function comparer(
  montant: number,
  sens: Sens,
  tauxDebut: number,
  tauxFin: number
): Comparaison {
  const avant = convertir(montant, tauxDebut, sens);
  const maintenant = convertir(montant, tauxFin, sens);
  return {
    avant,
    maintenant,
    ecart: maintenant - avant,
    pourcentage: maintenant / avant - 1,
  };
}

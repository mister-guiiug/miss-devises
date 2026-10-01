import type { ConversionEnregistree } from '../backend/ports.ts';
import { convertir } from './convert.ts';

/** L'autre côté de l'euro : l'une des deux devises l'est toujours. */
export function deviseEtrangere(c: ConversionEnregistree): string {
  return c.de.code === 'EUR' ? c.vers.code : c.de.code;
}

/**
 * La même conversion, refaite au taux du jour (récit 4, scénario 2) : le
 * montant de départ ne change pas, l'arrivée suit le taux. `ecart` rapporte
 * le nouveau montant d'arrivée à l'ancien, en fraction.
 */
export function auTauxDuJour(
  c: ConversionEnregistree,
  tauxDuJour: number
): { montant: number; ecart: number } {
  const montant = convertir(
    c.de.montant,
    tauxDuJour,
    c.de.code === 'EUR' ? 'versDevise' : 'versEuro'
  );
  return { montant, ecart: montant / c.vers.montant - 1 };
}

export interface Total {
  code: string;
  nombre: number;
  /** La somme des montants dans la devise étrangère. */
  devise: number;
  /** La somme des montants en euros, tels qu'enregistrés. */
  euros: number;
}

/**
 * Les totaux du carnet par devise étrangère (récit 4, scénario 4), dans
 * l'ordre de première apparition. Chaque ligne apporte ses deux côtés tels
 * qu'enregistrés : un total ne se recalcule pas au taux du jour.
 */
export function totauxParDevise(
  conversions: readonly ConversionEnregistree[]
): Total[] {
  const totaux = new Map<string, Total>();
  for (const c of conversions) {
    const code = deviseEtrangere(c);
    const total = totaux.get(code) ?? { code, nombre: 0, devise: 0, euros: 0 };
    const [euro, etranger] =
      c.de.code === 'EUR' ? [c.de, c.vers] : [c.vers, c.de];
    total.nombre += 1;
    total.devise += etranger.montant;
    total.euros += euro.montant;
    totaux.set(code, total);
  }
  return [...totaux.values()];
}

import type { ConversionEnregistree } from '../backend/ports.ts';
import { convertir } from './convert.ts';

/** L'autre côté de la référence : l'une des deux devises l'est toujours. */
export function deviseEtrangere(c: ConversionEnregistree): string {
  return c.de.code === c.reference ? c.vers.code : c.de.code;
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
    c.de.code === c.reference ? 'versDevise' : 'versReference'
  );
  return { montant, ecart: montant / c.vers.montant - 1 };
}

export interface Total {
  /** La devise étrangère. */
  code: string;
  reference: string;
  nombre: number;
  /** La somme des montants dans la devise étrangère. */
  devise: number;
  /** La somme des montants dans la référence, tels qu'enregistrés. */
  montantReference: number;
}

/**
 * Les totaux du carnet par paire, devise étrangère et référence (récit 4 de
 * la 001, spécification 002), dans l'ordre de première apparition. Deux
 * références ne se mêlent pas : la livre comptée en euros et la livre
 * comptée en francs font deux totaux. Chaque ligne apporte ses deux côtés
 * tels qu'enregistrés : un total ne se recalcule pas au taux du jour.
 */
export function totauxParPaire(
  conversions: readonly ConversionEnregistree[]
): Total[] {
  const totaux = new Map<string, Total>();
  for (const c of conversions) {
    const code = deviseEtrangere(c);
    const cle = `${code}/${c.reference}`;
    const total = totaux.get(cle) ?? {
      code,
      reference: c.reference,
      nombre: 0,
      devise: 0,
      montantReference: 0,
    };
    const [reference, etranger] =
      c.de.code === c.reference ? [c.de, c.vers] : [c.vers, c.de];
    total.nombre += 1;
    total.devise += etranger.montant;
    total.montantReference += reference.montant;
    totaux.set(cle, total);
  }
  return [...totaux.values()];
}

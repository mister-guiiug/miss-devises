import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { formaterMontant, type Langue } from './money.ts';

/**
 * Les frais d'une banque ou d'un distributeur (spécification 005, récit 1) :
 * un pourcentage et un montant fixe, ajoutés à ce que coûte un paiement ou un
 * retrait. À ne pas confondre avec la marge d'un bureau, écart sur le taux,
 * retranché du montant reçu : les frais se comptent sur le montant indicatif,
 * et les deux ne se cumulent pas (recherche R1).
 */
export interface Frais {
  id: string;
  libelle: string;
  /** En pour cent, de 0 à 100. */
  pourcentage: number;
  /** Par opération, dans `deviseFixe`. */
  fixe: number;
  deviseFixe: string;
}

/**
 * Le montant fixe en monnaie de référence, ou `null` sans taux pour sa devise :
 * jamais un taux inventé (principe I).
 *
 * `taux` : unités de `deviseFixe` pour une unité de la référence, celui de la
 * paire tel que l'écran le lit (spécification 002, R1).
 */
export function fixeEnReference(
  frais: Frais,
  reference: string,
  taux: number | undefined
): number | null {
  if (frais.fixe === 0 || frais.deviseFixe === reference) return frais.fixe;
  if (taux === undefined || !Number.isFinite(taux) || taux <= 0) return null;
  return frais.fixe / taux;
}

/**
 * Le coût en référence, frais compris, et la part des frais. AUCUN ARRONDI :
 * il n'a lieu qu'à l'affichage (principe I).
 */
export function coutAvecFrais(
  montantReference: number,
  pourcentage: number,
  fixe: number
): { frais: number; total: number } {
  const frais = (montantReference * pourcentage) / 100 + fixe;
  return { frais, total: montantReference + frais };
}

/**
 * Les frais dits en clair : « 2 % + 0,50 € », « 220,00 THB ». La part nulle
 * se tait.
 */
export function decrireFrais(
  frais: Pick<Frais, 'pourcentage' | 'fixe' | 'deviseFixe'>,
  langue: Langue
): string {
  return [
    frais.pourcentage > 0
      ? formatNumber(frais.pourcentage / 100, langue, {
          style: 'percent',
          maximumFractionDigits: 2,
        })
      : null,
    frais.fixe > 0
      ? formaterMontant(frais.fixe, frais.deviseFixe, langue)
      : null,
  ]
    .filter(Boolean)
    .join(' + ');
}

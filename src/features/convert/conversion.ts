import { create } from 'zustand';
import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { convertir } from '../../domain/convert.ts';
import {
  arrondir,
  decimalesDe,
  lireMontant,
  type Langue,
} from '../../domain/money.ts';

/** Le champ de la devise choisie, ou celui de la monnaie de référence. */
export type Champ = 'devise' | 'reference';

/** Ce que l'utilisateur a tapé, et où. L'autre champ se calcule. */
export interface Saisie {
  champ: Champ;
  texte: string;
}

export interface Derive {
  montantDevise: number | null;
  montantReference: number | null;
  texteDevise: string;
  texteReference: string;
  /** La saisie n'est pas vide, et n'est pas un montant. */
  invalide: boolean;
}

/** Un montant à éditer : nombre seul, aux décimales de la devise. */
function texteDe(montant: number, code: string, langue: Langue): string {
  const decimales = decimalesDe(code);
  return formatNumber(arrondir(montant, decimales), langue, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/**
 * La conversion à afficher. Le champ saisi garde exactement ce qui a été
 * tapé ; l'autre affiche le résultat arrondi aux décimales de SA devise. Sans
 * taux, l'autre champ reste vide : jamais un taux inventé (principe I).
 *
 * `taux` : unités de `devise` pour une unité de `reference` (spécification
 * 002 ; avec l'euro, le taux publié).
 */
export function deriver(
  saisie: Saisie,
  devise: string,
  reference: string,
  taux: number | undefined,
  langue: Langue
): Derive {
  const valeur = lireMontant(saisie.texte, langue);
  const invalide = saisie.texte.trim() !== '' && valeur === null;
  const calcule =
    valeur === null || taux === undefined
      ? null
      : convertir(
          valeur,
          taux,
          saisie.champ === 'devise' ? 'versReference' : 'versDevise'
        );

  if (saisie.champ === 'devise') {
    return {
      montantDevise: valeur,
      montantReference: calcule,
      texteDevise: saisie.texte,
      texteReference:
        calcule === null ? '' : texteDe(calcule, reference, langue),
      invalide,
    };
  }
  return {
    montantDevise: calcule,
    montantReference: valeur,
    texteDevise: calcule === null ? '' : texteDe(calcule, devise, langue),
    texteReference: saisie.texte,
    invalide,
  };
}

interface EtatConversion {
  saisie: Saisie;
  /** Quelle devise est en haut ; « inverser » l'échange. */
  haut: Champ;
  saisir: (champ: Champ, texte: string) => void;
  inverser: () => void;
}

/**
 * L'état vivant de la conversion, partagé par l'écran, le volet et
 * l'enregistrement au carnet. Il ne persiste pas : une saisie se refait.
 */
export const useConversion = create<EtatConversion>(set => ({
  saisie: { champ: 'devise', texte: '' },
  haut: 'devise',
  saisir: (champ, texte) => set({ saisie: { champ, texte } }),
  inverser: () =>
    set(etat => ({ haut: etat.haut === 'devise' ? 'reference' : 'devise' })),
}));

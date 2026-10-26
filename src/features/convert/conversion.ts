import { create } from 'zustand';
import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { convertir } from '../../domain/convert.ts';
import { arrondir, decimalesDe, type Langue } from '../../domain/money.ts';
import {
  estUnCalcul,
  evaluer,
  type ErreurCalcul,
} from '../../domain/calcul.ts';

/** Le champ de la devise choisie, ou celui de la monnaie de référence. */
export type Champ = 'devise' | 'reference';

/** Un champ où l'on peut saisir : ceux de la paire, et la seconde devise. */
export type ChampSaisi = Champ | 'seconde';

/** Ce que l'utilisateur a tapé, et où. Les autres champs se calculent. */
export interface Saisie {
  champ: ChampSaisi;
  texte: string;
}

/** La seconde devise et son taux, contre la référence (spécification 003). */
export interface Seconde {
  code: string;
  /** Unités de la seconde devise pour une unité de la référence. */
  taux: number | undefined;
}

export interface Derive {
  montantDevise: number | null;
  montantReference: number | null;
  /** `null` sans seconde devise, ou sans son taux. */
  montantSeconde: number | null;
  texteDevise: string;
  texteReference: string;
  texteSeconde: string;
  /** La saisie n'est pas vide, et ne donne pas un montant. */
  invalide: boolean;
  /** Le texte saisi est un calcul (spécification 003, récit 2). */
  calcul: boolean;
  /** Pourquoi la saisie ne donne pas de montant ; `null` sinon. */
  erreur: ErreurCalcul | null;
}

/** Un montant à éditer : nombre seul. `choix` remplace les décimales de la devise. */
export function texteDe(
  montant: number,
  code: string,
  langue: Langue,
  choix: number | null
): string {
  const decimales = choix ?? decimalesDe(code);
  return formatNumber(arrondir(montant, decimales), langue, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/**
 * La conversion à afficher. Le champ saisi garde exactement ce qui a été
 * tapé, calcul compris (« 12,5 + 7,5 ») ; les autres affichent le résultat arrondi aux décimales de LEUR
 * devise. Sans taux, un champ reste vide : jamais un taux inventé
 * (principe I).
 *
 * LA RÉFÉRENCE EST LE PIVOT (spécification 003, recherche R1). Toute saisie
 * se ramène d'abord à un montant en référence, sans marge ; chaque champ
 * calculé s'en déduit au taux de SA paire, et la marge s'applique une fois, à
 * la fin. Les trois champs se tiennent ainsi : aucun taux entre les deux
 * devises n'est ni calculé ni affiché.
 *
 * `taux` : unités de `devise` pour une unité de `reference` (spécification
 * 002 ; avec l'euro, le taux publié). `seconde` : la seconde devise et son
 * taux, de la même façon.
 */
export function deriver(
  saisie: Saisie,
  devise: string,
  reference: string,
  taux: number | undefined,
  langue: Langue,
  /** Marge en pour cent, retranchée de chaque montant calculé. */
  marge = 0,
  /** Chiffres des montants calculés. `null` : ceux de chaque devise. */
  decimales: number | null = null,
  seconde: Seconde | null = null
): Derive {
  // Un montant seul ou un calcul, lus de la même façon (recherche R2).
  const lecture =
    saisie.texte.trim() === '' ? null : evaluer(saisie.texte, langue);
  const valeur = lecture && 'valeur' in lecture ? lecture.valeur : null;
  const erreur = lecture && 'erreur' in lecture ? lecture.erreur : null;
  const tauxDuChamp = (champ: ChampSaisi) =>
    champ === 'reference' ? 1 : champ === 'devise' ? taux : seconde?.taux;
  const valide = (t: number | undefined) =>
    t !== undefined && Number.isFinite(t) && t > 0;

  // Le montant en référence, avant la marge.
  const tauxSaisi = tauxDuChamp(saisie.champ);
  const enReference =
    valeur === null || !valide(tauxSaisi)
      ? null
      : saisie.champ === 'reference'
        ? valeur
        : convertir(valeur, tauxSaisi!, 'versReference');
  const apresMarge = (montant: number) =>
    marge <= 0 ? montant : montant * (1 - marge / 100);

  const champ = (lequel: ChampSaisi, code: string | undefined) => {
    if (lequel === saisie.champ) {
      return { montant: valeur, texte: saisie.texte };
    }
    const t = tauxDuChamp(lequel);
    if (enReference === null || code === undefined || !valide(t)) {
      return { montant: null, texte: '' };
    }
    const brut =
      lequel === 'reference'
        ? enReference
        : convertir(enReference, t!, 'versDevise');
    const montant = apresMarge(brut);
    return { montant, texte: texteDe(montant, code, langue, decimales) };
  };

  const d = champ('devise', devise);
  const r = champ('reference', reference);
  const s = champ('seconde', seconde?.code);
  return {
    montantDevise: d.montant,
    montantReference: r.montant,
    montantSeconde: s.montant,
    texteDevise: d.texte,
    texteReference: r.texte,
    texteSeconde: s.texte,
    invalide: erreur !== null,
    calcul: estUnCalcul(saisie.texte),
    erreur,
  };
}

interface EtatConversion {
  saisie: Saisie;
  /** Quelle devise est en haut ; « inverser » l'échange. */
  haut: Champ;
  saisir: (champ: ChampSaisi, texte: string) => void;
  inverser: () => void;
  /** Rouvre une ligne du carnet : le montant saisi, son champ en haut. */
  reprendre: (saisie: { champ: Champ; texte: string }) => void;
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
  reprendre: saisie => set({ saisie, haut: saisie.champ }),
}));

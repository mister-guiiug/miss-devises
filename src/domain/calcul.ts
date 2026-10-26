import { lireMontant, type Langue } from './money.ts';

/**
 * La mini-calculatrice de la saisie (spécification 003, récit 2) : lire un
 * calcul, et les gestes du pavé. Des fonctions pures, sans écran.
 */

export type ErreurCalcul = 'illisible' | 'division' | 'negatif';
export type Lecture = { valeur: number } | { erreur: ErreurCalcul };

/** Les touches du pavé, hors « = », qui dépend de la devise du champ. */
export type Touche =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'decimal'
  | '+'
  | '−'
  | '×'
  | '÷'
  | 'retour'
  | 'effacer';

/** Ceux du pavé, et ceux d'un clavier d'ordinateur. */
const OPERATEUR = /([+\-−×÷*/])/;
const FINIT_PAR_UN_OPERATEUR = /[+\-−×÷*/]$/;

/** Le texte contient au moins un opérateur. */
export function estUnCalcul(texte: string): boolean {
  return OPERATEUR.test(texte);
}

type Signe = '+' | '−' | '×' | '÷';
const signe = (op: string): Signe =>
  op === '-' || op === '−'
    ? '−'
    : op === '*' || op === '×'
      ? '×'
      : op === '/' || op === '÷'
        ? '÷'
        : '+';

/**
 * Lit un calcul, ou un montant seul (recherche R2). SANS `eval` : la CSP le
 * refuse, et ce serait exécuter ce qui a été tapé.
 *
 * Le texte se coupe aux opérateurs ; chaque nombre se lit par `lireMontant`,
 * comme dans un champ simple (« 1 234,5 », « 12.5 ») ; × et ÷ passent avant
 * + et −. Un opérateur final est ignoré : c'est une frappe en cours. Un
 * résultat négatif n'est pas un montant.
 */
export function evaluer(texte: string, langue: Langue): Lecture {
  const morceaux = texte.split(OPERATEUR);
  if (morceaux.length > 1 && morceaux[morceaux.length - 1]!.trim() === '') {
    morceaux.splice(-2, 2);
  }

  const nombres: number[] = [];
  const signes: Signe[] = [];
  for (let i = 0; i < morceaux.length; i += 1) {
    const morceau = morceaux[i]!;
    if (i % 2 === 1) {
      signes.push(signe(morceau));
      continue;
    }
    const nombre = lireMontant(morceau, langue);
    if (nombre === null) return { erreur: 'illisible' };
    nombres.push(nombre);
  }

  // × et ÷ d'abord : chaque terme d'une somme se calcule en entier.
  const termes = [nombres[0]!];
  const sommes: ('+' | '−')[] = [];
  for (let k = 0; k < signes.length; k += 1) {
    const s = signes[k]!;
    const n = nombres[k + 1]!;
    const dernier = termes.length - 1;
    if (s === '×') termes[dernier] = termes[dernier]! * n;
    else if (s === '÷') {
      if (n === 0) return { erreur: 'division' };
      termes[dernier] = termes[dernier]! / n;
    } else {
      termes.push(n);
      sommes.push(s);
    }
  }
  const total = termes.reduce(
    (acc, terme, i) =>
      i === 0 ? terme : sommes[i - 1] === '−' ? acc - terme : acc + terme,
    0
  );

  if (!Number.isFinite(total)) return { erreur: 'illisible' };
  if (total < 0) return { erreur: 'negatif' };
  return { valeur: total };
}

/**
 * Le texte après une touche du pavé (recherche R4). Les opérateurs s'écrivent
 * entourés d'espaces ; un opérateur qui en suit un autre le remplace ; aucun
 * n'ouvre un calcul ; une seconde virgule dans un même nombre est ignorée.
 */
export function appuyer(texte: string, touche: Touche, langue: Langue): string {
  if (touche === 'effacer') return '';
  if (touche === 'retour') return texte.trimEnd().slice(0, -1).trimEnd();

  const base = texte.trimEnd();
  const apresUnOperateur = FINIT_PAR_UN_OPERATEUR.test(base);

  if (touche === '+' || touche === '−' || touche === '×' || touche === '÷') {
    if (base === '') return texte;
    const sans = apresUnOperateur ? base.slice(0, -1).trimEnd() : base;
    return `${sans} ${touche} `;
  }

  // Un chiffre ou la virgule : collé au nombre en cours, ou après un espace.
  const suite = (ajout: string) =>
    apresUnOperateur && !texte.endsWith(' ')
      ? `${texte} ${ajout}`
      : `${texte}${ajout}`;

  if (touche === 'decimal') {
    const separateur = langue === 'fr' ? ',' : '.';
    const enCours = texte.split(OPERATEUR).pop() ?? '';
    if (/[.,]/.test(enCours)) return texte;
    return suite(enCours.trim() === '' ? `0${separateur}` : separateur);
  }
  return suite(touche);
}

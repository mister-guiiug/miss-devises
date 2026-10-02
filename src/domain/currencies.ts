import { capitalize } from '@mister-guiiug/dev-pwa-config/format';
import type { Langue } from './money.ts';

/**
 * Le nom des devises vient d'`Intl` (recherche R9) : il connaît toutes les
 * devises ISO, dans les deux langues, sans un octet de données à livrer.
 */
const noms: Record<Langue, Intl.DisplayNames> = {
  fr: new Intl.DisplayNames(['fr'], { type: 'currency', fallback: 'code' }),
  en: new Intl.DisplayNames(['en'], { type: 'currency', fallback: 'code' }),
};

/** « livre égyptienne » devient « Livre égyptienne » : c'est un intitulé de liste. */
export function nomDevise(code: string, langue: Langue): string {
  try {
    return capitalize(noms[langue].of(code) ?? code);
  } catch {
    return code;
  }
}

/**
 * Le nom d'une devise au pluriel, tel qu'`Intl` l'écrit après un nombre :
 * « livres égyptiennes », « euros », « Egyptian pounds ». C'est celui de
 * « Montant en … » : un montant se compte au pluriel, dans les deux langues.
 */
export function nomAuPluriel(code: string, langue: Langue): string {
  try {
    return (
      new Intl.NumberFormat(langue, {
        style: 'currency',
        currency: code,
        currencyDisplay: 'name',
      })
        .formatToParts(2)
        .find(partie => partie.type === 'currency')?.value ?? code
    );
  } catch {
    return code;
  }
}

export interface DeviseListee {
  code: string;
  nom: string;
  recente?: boolean;
}

/**
 * Les devises proposées : sans `exclure` (la monnaie de référence, qui est
 * toujours l'autre côté), les récentes en tête dans leur ordre, puis les
 * autres par nom dans la langue.
 */
export function listerDevises(
  codes: Iterable<string>,
  langue: Langue,
  recentes: readonly string[] = [],
  exclure?: string
): DeviseListee[] {
  const disponibles = new Set(codes);
  if (exclure) disponibles.delete(exclure);
  const enTete = recentes
    .filter(code => disponibles.has(code))
    .map(code => ({ code, nom: nomDevise(code, langue), recente: true }));
  const reste = [...disponibles]
    .filter(code => !recentes.includes(code))
    .map(code => ({ code, nom: nomDevise(code, langue) }))
    .sort((a, b) =>
      a.nom.localeCompare(b.nom, langue, { sensitivity: 'base' })
    );
  return [...enTete, ...reste];
}

/** Minuscules, sans accents : « Égyptienne » se trouve en tapant « egy ». */
const plat = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Par code (début) ou par nom (n'importe où), sans accents ni casse. */
export function chercherDevises(
  devises: readonly DeviseListee[],
  requete: string
): DeviseListee[] {
  const cherche = plat(requete.trim());
  if (!cherche) return [...devises];
  return devises.filter(
    d =>
      d.code.toLowerCase().startsWith(cherche) || plat(d.nom).includes(cherche)
  );
}

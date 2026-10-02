import { z } from 'zod';

/**
 * Les deux sources de taux (recherche R1, contrat `sources-de-taux.md`).
 *
 * Toute réponse passe par un schéma avant usage : une réponse qui ne s'y
 * conforme pas est une source indisponible, jamais une source lue de travers.
 */
export type Source = 'bce' | 'marche';

/** Un relevé d'une source : unités de chaque devise pour UN euro, à une date. */
export interface Instantane {
  source: Source;
  date: string;
  taux: Record<string, number>;
}

export interface PointSerie {
  date: string;
  taux: number;
}

/** Lit une URL et rend son JSON ; lève si la réponse n'est pas exploitable. */
export type Recuperer = (url: string, signal?: AbortSignal) => Promise<unknown>;

export const DELAI_MS = 8_000;
export const URL_BCE = 'https://api.frankfurter.dev/v1';

const urlsMarche = (ref: string) => [
  `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${ref}/v1/currencies/eur.json`,
  `https://${ref}.currency-api.pages.dev/v1/currencies/eur.json`,
];

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const TAUX = z.number().positive();

const schemaBce = z.object({
  base: z.literal('EUR'),
  date: DATE,
  rates: z.record(z.string().regex(/^[A-Z]{3}$/), TAUX),
});

const schemaSerieBce = z.object({
  base: z.literal('EUR'),
  rates: z.record(DATE, z.record(z.string(), TAUX)),
});

const schemaMarche = z.object({
  date: DATE,
  eur: z.record(z.string(), z.unknown()),
});

/**
 * Les codes que l'application convertit (recherche R9) : ISO 4217, nommés par
 * `Intl`, sans les métaux, les fonds ni les codes de test. Les codes non ISO
 * de la source de marché (cryptomonnaies) n'ont pas de nom : ils tombent.
 */
const EXCLUS = new Set([
  'XAU',
  'XAG',
  'XPD',
  'XPT',
  'XDR',
  'XSU',
  'XUA',
  'XTS',
  'XXX',
  'XBA',
  'XBB',
  'XBC',
  'XBD',
]);
const nomsAnglais = new Intl.DisplayNames(['en'], {
  type: 'currency',
  fallback: 'code',
});

export function codeRetenu(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code) || EXCLUS.has(code)) return false;
  try {
    return nomsAnglais.of(code) !== code;
  } catch {
    return false;
  }
}

/** Le `fetch` de l'application : délai de 8 s, statut vérifié. */
export const recupererJson: Recuperer = async (url, signal) => {
  const delai = AbortSignal.timeout(DELAI_MS);
  const reponse = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, delai]) : delai,
  });
  if (!reponse.ok) throw new Error(`${reponse.status} ${url}`);
  return reponse.json();
};

/** Le dernier taux de la BCE, via Frankfurter. */
export async function lireBce(
  recuperer: Recuperer,
  signal?: AbortSignal
): Promise<Instantane> {
  const json = schemaBce.parse(
    await recuperer(`${URL_BCE}/latest?base=EUR`, signal)
  );
  return { source: 'bce', date: json.date, taux: json.rates };
}

/**
 * Les séries de la BCE pour une ou deux devises, en UNE requête (spécification
 * 002, recherche R2), chacune triée par date. Une date où une devise manque
 * est sautée pour elle seule.
 */
export async function lireSeriesBce(
  codes: readonly string[],
  debut: string,
  fin: string,
  recuperer: Recuperer,
  signal?: AbortSignal
): Promise<Record<string, PointSerie[]>> {
  const json = schemaSerieBce.parse(
    await recuperer(
      `${URL_BCE}/${debut}..${fin}?base=EUR&symbols=${codes.join(',')}`,
      signal
    )
  );
  const dates = Object.keys(json.rates).sort();
  return Object.fromEntries(
    codes.map(code => [
      code,
      dates.flatMap(date => {
        const valeur = json.rates[date]?.[code];
        return valeur === undefined ? [] : [{ date, taux: valeur }];
      }),
    ])
  );
}

/**
 * Le relevé de marché d'un jour (`AAAA-MM-JJ`) ou le dernier (`latest`) :
 * jsDelivr d'abord, Cloudflare Pages ensuite. Les codes passent en
 * majuscules ; ne restent que ceux de R9, à une valeur finie et positive.
 */
export async function lireMarche(
  ref: string,
  recuperer: Recuperer,
  signal?: AbortSignal
): Promise<Instantane> {
  let derniereErreur: unknown;
  for (const url of urlsMarche(ref)) {
    try {
      const json = schemaMarche.parse(await recuperer(url, signal));
      const taux: Record<string, number> = {};
      for (const [cle, valeur] of Object.entries(json.eur)) {
        const code = cle.toUpperCase();
        if (
          typeof valeur === 'number' &&
          Number.isFinite(valeur) &&
          valeur > 0 &&
          codeRetenu(code)
        ) {
          taux[code] = valeur;
        }
      }
      return { source: 'marche', date: json.date, taux };
    } catch (erreur) {
      if (signal?.aborted) throw erreur;
      derniereErreur = erreur;
    }
  }
  throw derniereErreur instanceof Error
    ? derniereErreur
    : new Error('source de marché injoignable');
}

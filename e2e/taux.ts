import type { Page } from '@playwright/test';

/** La date du jour, au format des sources. */
export const AUJOURDHUI = new Date().toISOString().slice(0, 10);

/** Le taux de la BCE aujourd'hui, et celui de toutes les dates passées. */
const BCE = { USD: 1.0812, JPY: 162.4, GBP: 0.8512, CHF: 0.9381 };
const BCE_AVANT = { USD: 1.17, JPY: 158.2, GBP: 0.8721, CHF: 0.9302 };

/** Le marché aujourd'hui, et à toutes les dates passées. */
const MARCHE = {
  egp: 58.83,
  usd: 1.0815,
  mad: 10.81,
  tnd: 3.312,
  xof: 655.957,
  chf: 0.9384,
};
const MARCHE_AVANT = {
  egp: 56.18,
  usd: 1.17,
  mad: 10.62,
  tnd: 3.29,
  xof: 655.957,
  chf: 0.95,
};

const DATE = /(\d{4}-\d{2}-\d{2})/;

/**
 * LE RÉSEAU EST SIMULÉ, toujours. Une suite qui interrogerait la BCE et
 * jsDelivr échouerait le jour où l'une des deux est lente, et ses chiffres
 * bougeraient chaque jour ouvré. Les taux ci-dessous sont fixes : 58,83 EGP
 * pour un euro aujourd'hui (la valeur de la spécification), 56,18 à toute
 * date passée, donc 200 EGP valaient 3,56 € et valent 3,40 €.
 *
 * Rend le JOURNAL des adresses servies : compter les requêtes là où elles
 * sont servies, et non par `page.on('request')`, qui ne les voyait pas.
 */
export async function simulerTaux(
  page: Page,
  options: { horsLigne?: boolean } = {}
): Promise<string[]> {
  const journal: string[] = [];
  await page.route(
    /api\.frankfurter\.dev|cdn\.jsdelivr\.net|currency-api\.pages\.dev/,
    async route => {
      if (options.horsLigne) return route.abort('internetdisconnected');
      const url = route.request().url();
      journal.push(url);

      if (url.includes('frankfurter.dev')) {
        if (url.includes('/latest')) {
          return route.fulfill({
            json: { amount: 1, base: 'EUR', date: AUJOURDHUI, rates: BCE },
          });
        }
        // Une série : `/v1/<début>..<fin>?symbols=<codes>`, deux points.
        // Une paire sans l'euro demande ses deux codes d'un coup (002, R2).
        const bornes = /\/v1\/(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})/.exec(
          url
        );
        const codes = (new URL(url).searchParams.get('symbols') ?? '')
          .split(',')
          .filter((code): code is keyof typeof BCE => code in BCE);
        if (bornes?.[1] && bornes[2] && codes.length > 0) {
          const releve = (taux: typeof BCE) =>
            Object.fromEntries(codes.map(code => [code, taux[code]]));
          return route.fulfill({
            json: {
              amount: 1,
              base: 'EUR',
              start_date: bornes[1],
              end_date: bornes[2],
              rates: {
                [bornes[1]]: releve(BCE_AVANT),
                [bornes[2]]: releve(BCE),
              },
            },
          });
        }
      }

      if (url.includes('currency-api')) {
        if (url.includes('@latest') || url.includes('//latest.')) {
          return route.fulfill({ json: { date: AUJOURDHUI, eur: MARCHE } });
        }
        const date = DATE.exec(url)?.[1];
        if (date) {
          return route.fulfill({ json: { date, eur: MARCHE_AVANT } });
        }
      }

      return route.abort('failed');
    }
  );
  return journal;
}

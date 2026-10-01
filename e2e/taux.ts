import type { Page } from '@playwright/test';

/** La date du jour, au format des sources. */
export const AUJOURDHUI = new Date().toISOString().slice(0, 10);

/**
 * LE RÉSEAU EST SIMULÉ, toujours. Une suite qui interrogerait la BCE et
 * jsDelivr échouerait le jour où l'une des deux est lente, et ses chiffres
 * bougeraient chaque jour ouvré. Les taux ci-dessous sont fixes : 58,83 EGP
 * pour un euro, la valeur de la spécification.
 */
export async function simulerTaux(
  page: Page,
  options: { horsLigne?: boolean } = {}
) {
  await page.route(
    /api\.frankfurter\.dev|cdn\.jsdelivr\.net|currency-api\.pages\.dev/,
    async route => {
      if (options.horsLigne) return route.abort('internetdisconnected');
      const url = route.request().url();
      if (url.includes('frankfurter.dev') && url.includes('/latest')) {
        return route.fulfill({
          json: {
            amount: 1,
            base: 'EUR',
            date: AUJOURDHUI,
            rates: { USD: 1.0812, JPY: 162.4, GBP: 0.8512, CHF: 0.9381 },
          },
        });
      }
      if (url.includes('currency-api') && url.includes('@latest')) {
        return route.fulfill({
          json: {
            date: AUJOURDHUI,
            eur: { egp: 58.83, usd: 1.0815, mad: 10.81, tnd: 3.312 },
          },
        });
      }
      return route.abort('failed');
    }
  );
}

import { describe, expect, it, vi } from 'vitest';
import {
  codeRetenu,
  lireBce,
  lireMarche,
  lireSeriesBce,
  type Recuperer,
} from './sources.ts';

// Un faux réseau : une table URL → réponse, et une erreur pour le reste.
function reseau(reponses: Record<string, unknown>): Recuperer {
  return vi.fn(async (url: string) => {
    if (url in reponses) return reponses[url];
    throw new Error(`hors ligne : ${url}`);
  });
}

const BCE = 'https://api.frankfurter.dev/v1/latest?base=EUR';
const JSDELIVR =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json';
const PAGES = 'https://latest.currency-api.pages.dev/v1/currencies/eur.json';

describe('codeRetenu : ce qui se convertit (recherche R9)', () => {
  it.each(['USD', 'EGP', 'JPY', 'XOF', 'XPF'])('%s est retenu', code => {
    expect(codeRetenu(code)).toBe(true);
  });

  it.each(['XAU', 'XAG', 'XDR', 'XTS', 'BTC', 'eur', 'EURO', 'ZZZ'])(
    '%s est écarté',
    code => {
      expect(codeRetenu(code)).toBe(false);
    }
  );
});

describe('lireBce : le dernier taux de la BCE', () => {
  it('rend un instantané daté, source bce', async () => {
    const instantane = await lireBce(
      reseau({
        [BCE]: { base: 'EUR', date: '2026-10-01', rates: { USD: 1.0812 } },
      })
    );
    expect(instantane).toEqual({
      source: 'bce',
      date: '2026-10-01',
      taux: { USD: 1.0812 },
    });
  });

  it('refuse une réponse qui ne suit pas le contrat', async () => {
    await expect(
      lireBce(reseau({ [BCE]: { base: 'USD', rates: {} } }))
    ).rejects.toThrow();
  });
});

describe('lireSeriesBce : les séries de plusieurs devises en une requête', () => {
  it('trie les points et ignore les dates sans la devise', async () => {
    const url =
      'https://api.frankfurter.dev/v1/2025-10-01..2026-09-30?base=EUR&symbols=USD';
    const series = await lireSeriesBce(
      ['USD'],
      '2025-10-01',
      '2026-09-30',
      reseau({
        [url]: {
          base: 'EUR',
          start_date: '2025-10-01',
          end_date: '2026-09-30',
          rates: {
            '2026-09-30': { USD: 1.08 },
            '2025-10-01': { USD: 1.17 },
            '2026-01-02': {},
          },
        },
      })
    );
    expect(series).toEqual({
      USD: [
        { date: '2025-10-01', taux: 1.17 },
        { date: '2026-09-30', taux: 1.08 },
      ],
    });
  });

  it('deux devises, une requête : chacune sa série', async () => {
    const url =
      'https://api.frankfurter.dev/v1/2025-10-01..2026-09-30?base=EUR&symbols=CHF,USD';
    const series = await lireSeriesBce(
      ['CHF', 'USD'],
      '2025-10-01',
      '2026-09-30',
      reseau({
        [url]: {
          base: 'EUR',
          start_date: '2025-10-01',
          end_date: '2026-09-30',
          rates: {
            '2025-10-01': { CHF: 0.94, USD: 1.17 },
            '2026-09-30': { CHF: 0.93 },
          },
        },
      })
    );
    expect(series).toEqual({
      CHF: [
        { date: '2025-10-01', taux: 0.94 },
        { date: '2026-09-30', taux: 0.93 },
      ],
      USD: [{ date: '2025-10-01', taux: 1.17 }],
    });
  });
});

describe('lireMarche : la source de marché et son repli', () => {
  const reponse = {
    date: '2026-10-01',
    eur: { egp: 58.83286362, usd: 1.0812, btc: 0.0001, xau: 0.0003, bad: -1 },
  };

  it('met les codes en majuscules et ne garde que ceux de R9', async () => {
    const instantane = await lireMarche(
      'latest',
      reseau({ [JSDELIVR]: reponse })
    );
    expect(instantane).toEqual({
      source: 'marche',
      date: '2026-10-01',
      taux: { EGP: 58.83286362, USD: 1.0812 },
    });
  });

  it('passe à Cloudflare Pages quand jsDelivr ne répond pas', async () => {
    const recuperer = reseau({ [PAGES]: reponse });
    const instantane = await lireMarche('latest', recuperer);
    expect(instantane.taux.EGP).toBe(58.83286362);
    expect(recuperer).toHaveBeenCalledTimes(2);
  });

  it('échoue quand aucune des deux ne répond', async () => {
    await expect(lireMarche('latest', reseau({}))).rejects.toThrow();
  });

  it('lit un jour donné', async () => {
    const url =
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2025-10-06/v1/currencies/eur.json';
    const instantane = await lireMarche(
      '2025-10-06',
      reseau({ [url]: { date: '2025-10-06', eur: { egp: 56.2 } } })
    );
    expect(instantane.date).toBe('2025-10-06');
  });
});

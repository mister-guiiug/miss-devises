import { describe, expect, it, vi } from 'vitest';
import {
  bornesBce,
  createServiceTaux,
  fraicheur,
  grilleMarche,
  tauxDuJour,
  type CacheTaux,
} from './service.ts';
import type { Instantane, Recuperer } from './sources.ts';

const MAINTENANT = new Date('2026-10-01T12:00:00Z');

const bce: Instantane = {
  source: 'bce',
  date: '2026-10-01',
  taux: { USD: 1.0812, JPY: 162.4, CHF: 0.9381 },
};
const marche: Instantane = {
  source: 'marche',
  date: '2026-10-01',
  taux: { EUR: 1, USD: 1.0815, EGP: 58.83, CHF: 0.9384 },
};

function cacheEnMemoire(): CacheTaux & { valeurs: Map<string, unknown> } {
  const valeurs = new Map<string, unknown>();
  return {
    valeurs,
    get: async <T>(cle: string) => valeurs.get(cle) as T | undefined,
    set: async (cle: string, valeur: unknown) => {
      valeurs.set(cle, valeur);
      return true;
    },
  };
}

describe('fraicheur : plus de 3 jours, le taux est ancien (R8)', () => {
  it.each([
    ['2026-10-01', 'frais'],
    ['2026-09-28', 'frais'],
    ['2026-09-27', 'ancien'],
  ] as const)('%s → %s', (date, attendu) => {
    expect(fraicheur(date, MAINTENANT)).toBe(attendu);
  });
});

describe('tauxDuJour : le taux d’une paire, avec sa source et sa date', () => {
  it('avec l’euro pour référence, le taux publié par la source de la devise', () => {
    expect(tauxDuJour('EUR', 'USD', { bce, marche }, MAINTENANT)).toEqual({
      reference: 'EUR',
      code: 'USD',
      taux: 1.0812,
      source: 'bce',
      date: '2026-10-01',
      fraicheur: 'frais',
    });
    expect(tauxDuJour('EUR', 'EGP', { bce, marche }, MAINTENANT)?.source).toBe(
      'marche'
    );
  });

  it('entre deux devises de la BCE, le taux croisé de la BCE', () => {
    const jour = tauxDuJour('CHF', 'USD', { bce, marche }, MAINTENANT);
    expect(jour?.source).toBe('bce');
    expect(jour?.taux).toBeCloseTo(1.0812 / 0.9381, 12);
  });

  it('dès qu’une des deux manque à la BCE, les deux au taux de marché', () => {
    const jour = tauxDuJour('CHF', 'EGP', { bce, marche }, MAINTENANT);
    expect(jour?.source).toBe('marche');
    expect(jour?.taux).toBeCloseTo(58.83 / 0.9384, 12);
  });

  it('ne rend rien pour une devise inconnue ; jamais un taux inventé', () => {
    expect(
      tauxDuJour('EUR', 'XOF', { bce, marche }, MAINTENANT)
    ).toBeUndefined();
    expect(
      tauxDuJour('XOF', 'EGP', { bce, marche }, MAINTENANT)
    ).toBeUndefined();
  });
});

describe('les dates à lire (R2)', () => {
  it('un mois : un point tous les deux jours, 16 points', () => {
    const dates = grilleMarche('1M', MAINTENANT);
    expect(dates).toHaveLength(16);
    expect(dates[0]).toBe('2026-09-01');
    expect(dates.at(-1)).toBe('2026-10-01');
  });

  it('six mois et un an : chaque lundi, plus le jour même', () => {
    const six = grilleMarche('6M', MAINTENANT);
    const an = grilleMarche('1A', MAINTENANT);
    expect(six).toHaveLength(27);
    expect(an).toHaveLength(53);
    // Les lundis de six mois sont aussi ceux d'un an : le cache sert deux fois.
    expect(an.slice(-27)).toEqual(six);
    for (const date of an.slice(0, -1)) {
      expect(new Date(`${date}T00:00:00Z`).getUTCDay()).toBe(1);
    }
  });

  it('les bornes d’une série de la BCE', () => {
    expect(bornesBce('1A', MAINTENANT)).toEqual({
      debut: '2025-10-01',
      fin: '2026-10-01',
    });
  });
});

describe('le service : cache d’abord, réseau ensuite', () => {
  it('hydrate depuis le cache, sans réseau', async () => {
    const cache = cacheEnMemoire();
    cache.valeurs.set('taux:bce', bce);
    cache.valeurs.set('taux:marche', marche);
    const recuperer = vi.fn<Recuperer>();
    const service = createServiceTaux({
      cache,
      recuperer,
      maintenant: () => MAINTENANT,
    });
    expect(await service.hydrater()).toEqual({ bce, marche });
    expect(recuperer).not.toHaveBeenCalled();
  });

  it('une série de la BCE coûte une requête, puis rien', async () => {
    const cache = cacheEnMemoire();
    const recuperer = vi.fn<Recuperer>(async () => ({
      base: 'EUR',
      start_date: '2025-10-01',
      end_date: '2026-10-01',
      rates: { '2025-10-01': { USD: 1.17 }, '2026-10-01': { USD: 1.08 } },
    }));
    const service = createServiceTaux({
      cache,
      recuperer,
      maintenant: () => MAINTENANT,
    });
    const premiere = await service.serie('EUR', 'USD', '1A', { bce, marche });
    const seconde = await service.serie('EUR', 'USD', '1A', { bce, marche });
    expect(premiere.points).toHaveLength(2);
    expect(seconde).toEqual(premiere);
    expect(recuperer).toHaveBeenCalledTimes(1);
  });

  // La BCE publie vers 16 h. Une série lue le matin s'arrête à la veille, et
  // sa clé (datée du jour) la sert telle quelle jusqu'au soir : sans ce
  // raccord, l'historique dirait « aujourd'hui » avec le taux d'hier, pendant
  // que l'écran Convertir montre celui du jour.
  it('une série de la BCE finit sur le taux du jour, même gardée avant sa publication', async () => {
    const cache = cacheEnMemoire();
    const recuperer = vi.fn<Recuperer>(async () => ({
      base: 'EUR',
      start_date: '2025-10-01',
      end_date: '2026-09-30',
      rates: { '2025-10-01': { USD: 1.17 }, '2026-09-30': { USD: 1.07 } },
    }));
    const service = createServiceTaux({
      cache,
      recuperer,
      maintenant: () => MAINTENANT,
    });
    const hier = { ...bce, date: '2026-09-30', taux: { USD: 1.07 } };
    const matin = await service.serie('EUR', 'USD', '1A', {
      bce: hier,
      marche,
    });
    expect(matin.points.at(-1)).toEqual({ date: '2026-09-30', taux: 1.07 });

    const soir = await service.serie('EUR', 'USD', '1A', { bce, marche });
    expect(soir.points.at(-1)).toEqual({ date: '2026-10-01', taux: 1.0812 });
    expect(soir.points).toHaveLength(3);
    expect(recuperer).toHaveBeenCalledTimes(1);
  });

  it('une série de marché lit chaque date une fois, et dit si elle est complète', async () => {
    const cache = cacheEnMemoire();
    const recuperer = vi.fn<Recuperer>(async (url: string) => {
      const date = /@(\d{4}-\d{2}-\d{2})\//.exec(url)?.[1];
      // Le 2026-09-03 est introuvable des deux côtés : la série reste
      // utilisable, mais incomplète.
      if (!date || date === '2026-09-03') throw new Error('absent');
      return { date, eur: { egp: 58 } };
    });
    const service = createServiceTaux({
      cache,
      recuperer,
      maintenant: () => MAINTENANT,
    });
    const serie = await service.serie('EUR', 'EGP', '1M', { bce, marche });
    // 16 dates de la grille, dont la dernière est le taux du jour, déjà connu.
    expect(serie.points).toHaveLength(15);
    expect(serie.complete).toBe(false);
    const appels = recuperer.mock.calls.length;
    await service.serie('EUR', 'EGP', '1M', { bce, marche });
    // Seule la date manquante est redemandée (deux sources).
    expect(recuperer.mock.calls.length - appels).toBe(2);
  });

  it('une paire de la BCE : une requête pour les deux codes, gardés chacun sous sa clé', async () => {
    const cache = cacheEnMemoire();
    const recuperer = vi.fn<Recuperer>(async (url: string) => {
      expect(new URL(url).searchParams.get('symbols')).toBe('CHF,USD');
      return {
        base: 'EUR',
        start_date: '2025-10-01',
        end_date: '2026-10-01',
        rates: {
          '2025-10-01': { CHF: 0.94, USD: 1.17 },
          '2026-02-02': { CHF: 0.93 },
          '2026-10-01': { CHF: 0.9381, USD: 1.0812 },
        },
      };
    });
    const service = createServiceTaux({
      cache,
      recuperer,
      maintenant: () => MAINTENANT,
    });
    const serie = await service.serie('CHF', 'USD', '1A', { bce, marche });
    expect(serie.source).toBe('bce');
    // Le 2026-02-02 n'a que le franc : la date est sautée, rien n'est inventé.
    expect(serie.points.map(p => p.date)).toEqual(['2025-10-01', '2026-10-01']);
    expect(serie.points[0]?.taux).toBeCloseTo(1.17 / 0.94, 12);
    expect([...cache.valeurs.keys()].sort()).toEqual([
      'serie:bce:CHF:2025-10-01:2026-10-01',
      'serie:bce:USD:2025-10-01:2026-10-01',
    ]);

    // L'autre sens de la paire, et l'euro face au dollar : déjà gardés.
    await service.serie('USD', 'CHF', '1A', { bce, marche });
    await service.serie('EUR', 'USD', '1A', { bce, marche });
    expect(recuperer).toHaveBeenCalledTimes(1);
  });

  it('une paire de marché : le taux croisé de chaque date', async () => {
    const cache = cacheEnMemoire();
    const recuperer = vi.fn<Recuperer>(async (url: string) => {
      const date = /@(\d{4}-\d{2}-\d{2})\//.exec(url)?.[1];
      if (!date) throw new Error('absent');
      return { date, eur: { egp: 58, chf: 0.94 } };
    });
    const service = createServiceTaux({
      cache,
      recuperer,
      maintenant: () => MAINTENANT,
    });
    const serie = await service.serie('CHF', 'EGP', '1M', { bce, marche });
    expect(serie.source).toBe('marche');
    expect(serie.complete).toBe(true);
    expect(serie.points).toHaveLength(16);
    expect(serie.points[0]?.taux).toBeCloseTo(58 / 0.94, 12);
    // Le dernier point est le taux du jour, croisé lui aussi.
    expect(serie.points.at(-1)?.taux).toBeCloseTo(58.83 / 0.9384, 12);
  });
});

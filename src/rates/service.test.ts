import { describe, expect, it, vi } from 'vitest';
import {
  bornesBce,
  createServiceTaux,
  fraicheur,
  grilleMarche,
  sourceDe,
  tauxDuJour,
  type CacheTaux,
} from './service.ts';
import type { Instantane, Recuperer } from './sources.ts';

const MAINTENANT = new Date('2026-10-01T12:00:00Z');

const bce: Instantane = {
  source: 'bce',
  date: '2026-10-01',
  taux: { USD: 1.0812, JPY: 162.4 },
};
const marche: Instantane = {
  source: 'marche',
  date: '2026-10-01',
  taux: { USD: 1.0815, EGP: 58.83 },
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

describe('sourceDe : une source par devise (recherche R1)', () => {
  it('la BCE pour une devise qu’elle publie, même si le marché l’a aussi', () => {
    expect(sourceDe('USD', bce)).toBe('bce');
  });

  it('le marché pour une devise que la BCE ne publie pas', () => {
    expect(sourceDe('EGP', bce)).toBe('marche');
  });

  it('le marché tant que la BCE n’est pas connue', () => {
    expect(sourceDe('USD', undefined)).toBe('marche');
  });
});

describe('fraicheur : plus de 3 jours, le taux est ancien (R8)', () => {
  it.each([
    ['2026-10-01', 'frais'],
    ['2026-09-28', 'frais'],
    ['2026-09-27', 'ancien'],
  ] as const)('%s → %s', (date, attendu) => {
    expect(fraicheur(date, MAINTENANT)).toBe(attendu);
  });
});

describe('tauxDuJour', () => {
  it('prend le taux de la source de la devise, avec sa date', () => {
    expect(tauxDuJour('USD', { bce, marche }, MAINTENANT)).toEqual({
      code: 'USD',
      taux: 1.0812,
      source: 'bce',
      date: '2026-10-01',
      fraicheur: 'frais',
    });
    expect(tauxDuJour('EGP', { bce, marche }, MAINTENANT)?.source).toBe(
      'marche'
    );
  });

  it('ne rend rien pour une devise inconnue ; jamais un taux inventé', () => {
    expect(tauxDuJour('XOF', { bce, marche }, MAINTENANT)).toBeUndefined();
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
    const premiere = await service.serie('USD', '1A', { bce, marche });
    const seconde = await service.serie('USD', '1A', { bce, marche });
    expect(premiere.points).toHaveLength(2);
    expect(seconde).toEqual(premiere);
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
    const serie = await service.serie('EGP', '1M', { bce, marche });
    // 16 dates de la grille, dont la dernière est le taux du jour, déjà connu.
    expect(serie.points).toHaveLength(15);
    expect(serie.complete).toBe(false);
    const appels = recuperer.mock.calls.length;
    await service.serie('EGP', '1M', { bce, marche });
    // Seule la date manquante est redemandée (deux sources).
    expect(recuperer.mock.calls.length - appels).toBe(2);
  });
});

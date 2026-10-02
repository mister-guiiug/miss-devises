import { beforeEach, describe, expect, it, vi } from 'vitest';
import { creerStoreTaux, UNE_HEURE } from './store.ts';
import type { EtatTaux, ServiceTaux } from './service.ts';
import type { Instantane } from './sources.ts';

const marche: Instantane = {
  source: 'marche',
  date: '2026-10-01',
  taux: { EGP: 58.83 },
};

function faux(gardes: EtatTaux, lus: EtatTaux) {
  return {
    hydrater: vi.fn(async () => gardes),
    rafraichir: vi.fn(async () => lus),
    serie: vi.fn(),
    menage: vi.fn(async () => 0),
  } as unknown as ServiceTaux & {
    hydrater: ReturnType<typeof vi.fn>;
    rafraichir: ReturnType<typeof vi.fn>;
  };
}

describe('le magasin des taux', () => {
  beforeEach(() => localStorage.clear());

  it('affiche d’abord ce qui est gardé, puis ce que le réseau rend', async () => {
    const service = faux(
      { marche: { ...marche, date: '2026-09-30' } },
      { marche }
    );
    const store = creerStoreTaux(service, () => 1_000_000);
    await store.getState().demarrer();
    expect(store.getState().pret).toBe(true);
    expect(service.hydrater).toHaveBeenCalledTimes(1);
    expect(service.rafraichir).toHaveBeenCalledTimes(1);
    expect(store.getState().etat.marche?.date).toBe('2026-10-01');
  });

  it('garde la source qui a répondu quand l’autre échoue', async () => {
    const bce: Instantane = {
      source: 'bce',
      date: '2026-10-01',
      taux: { USD: 1.08 },
    };
    const service = faux(
      { bce, marche },
      { marche: { ...marche, date: '2026-10-02' } }
    );
    const store = creerStoreTaux(service, () => 1_000_000);
    await store.getState().demarrer();
    expect(store.getState().etat.bce).toEqual(bce);
    expect(store.getState().etat.marche?.date).toBe('2026-10-02');
  });

  it('ne relit pas le réseau plus d’une fois par heure, sauf demande', async () => {
    let maintenant = 1_000_000;
    const service = faux({}, { marche });
    const store = creerStoreTaux(service, () => maintenant);
    await store.getState().demarrer();
    maintenant += UNE_HEURE - 1;
    await store.getState().rafraichir();
    expect(service.rafraichir).toHaveBeenCalledTimes(1);
    await store.getState().rafraichir({ force: true });
    expect(service.rafraichir).toHaveBeenCalledTimes(2);
    maintenant += UNE_HEURE + 1;
    await store.getState().rafraichir();
    expect(service.rafraichir).toHaveBeenCalledTimes(3);
  });

  it('dit quand rien n’a pu être lu', async () => {
    const store = creerStoreTaux(faux({}, {}), () => 1_000_000);
    await store.getState().demarrer();
    expect(store.getState().etat).toEqual({});
    expect(store.getState().echec).toBe(true);
  });
});

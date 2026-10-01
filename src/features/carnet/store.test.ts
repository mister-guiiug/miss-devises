import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UNDO_MS, useCarnet } from './store.ts';
import { carnetStore } from '../../backend/local.ts';
import { backend } from '../../backend/index.ts';

const musee = {
  libelle: 'Visite du musée',
  de: { code: 'EGP', montant: 200 },
  vers: { code: 'EUR', montant: 3.39963 },
  taux: 58.83,
  source: 'marche' as const,
  dateTaux: '2026-10-01',
};

describe('le magasin du carnet (récit 4)', () => {
  beforeEach(() => {
    localStorage.clear();
    carnetStore.clear();
    useCarnet.setState({
      conversions: [],
      ready: false,
      error: null,
      pending: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enregistre une conversion avec son libellé, la plus récente en tête', async () => {
    await useCarnet.getState().add(musee);
    await useCarnet.getState().add({ ...musee, libelle: 'Taxi' });
    expect(useCarnet.getState().conversions.map(c => c.libelle)).toEqual([
      'Taxi',
      'Visite du musée',
    ]);
    // Persisté : un rechargement relit la même chose.
    const { conversions } = await backend.carnet.load();
    expect(conversions).toHaveLength(2);
    expect(conversions[0]?.id).toBeTruthy();
  });

  it('donne un libellé par défaut à une conversion sans libellé (scénario 5)', async () => {
    await useCarnet.getState().add({ ...musee, libelle: '   ' });
    expect(useCarnet.getState().conversions[0]?.libelle).toBe('200 EGP → EUR');
  });

  it('renomme, et le nom persiste', async () => {
    await useCarnet.getState().add(musee);
    const id = useCarnet.getState().conversions[0]!.id;
    await useCarnet.getState().rename(id, 'Musée égyptien');
    expect((await backend.carnet.load()).conversions[0]?.libelle).toBe(
      'Musée égyptien'
    );
  });

  it('supprime, annule pendant le sursis, et ne supprime qu’après', async () => {
    vi.useFakeTimers();
    await useCarnet.getState().add(musee);
    await useCarnet.getState().add({ ...musee, libelle: 'Taxi' });
    const id = useCarnet.getState().conversions[1]!.id;

    useCarnet.getState().remove(id);
    expect(useCarnet.getState().conversions).toHaveLength(1);
    useCarnet.getState().undoRemove(id);
    expect(useCarnet.getState().conversions.map(c => c.libelle)).toEqual([
      'Taxi',
      'Visite du musée',
    ]);

    useCarnet.getState().remove(id);
    await vi.advanceTimersByTimeAsync(UNDO_MS);
    expect(
      (await backend.carnet.load()).conversions.map(c => c.libelle)
    ).toEqual(['Taxi']);
  });

  it('importe un fichier valide et refuse un fichier illisible', async () => {
    await useCarnet.getState().add(musee);
    const json = await backend.carnet.export();
    await useCarnet.getState().clear();
    expect(await useCarnet.getState().importJson(json ?? '')).toBe(1);
    expect(await useCarnet.getState().importJson('pas du json')).toBeNull();
    expect(useCarnet.getState().error).toBeTruthy();
    expect(useCarnet.getState().conversions).toHaveLength(1);
  });
});

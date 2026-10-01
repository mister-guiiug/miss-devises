import { beforeEach, describe, expect, it } from 'vitest';
import { carnetStore, createLocalBackend } from './local.ts';
import type { ConversionEnregistree } from './ports.ts';

const musee: ConversionEnregistree = {
  id: 'conv-1',
  libelle: 'Visite du musée',
  de: { code: 'EGP', montant: 200 },
  vers: { code: 'EUR', montant: 3.39963 },
  taux: 58.83,
  source: 'marche',
  dateTaux: '2026-10-01',
  creeeLe: '2026-10-01T10:00:00.000Z',
};

describe('le carnet local', () => {
  beforeEach(() => {
    localStorage.clear();
    carnetStore.clear();
  });

  it('garde une conversion, la plus récente en tête', async () => {
    const { carnet } = createLocalBackend();
    await carnet.add(musee);
    await carnet.add({ ...musee, id: 'conv-2', libelle: 'Taxi' });
    const { conversions } = await carnet.load();
    expect(conversions.map(c => c.libelle)).toEqual([
      'Taxi',
      'Visite du musée',
    ]);
  });

  it('survit à un nouveau port, comme à un rechargement', async () => {
    await createLocalBackend().carnet.add(musee);
    const { conversions } = await createLocalBackend().carnet.load();
    expect(conversions).toEqual([musee]);
  });

  it('renomme et supprime', async () => {
    const { carnet } = createLocalBackend();
    await carnet.add(musee);
    await carnet.rename('conv-1', 'Musée égyptien');
    expect((await carnet.load()).conversions[0]?.libelle).toBe(
      'Musée égyptien'
    );
    await carnet.remove('conv-1');
    expect((await carnet.load()).conversions).toEqual([]);
  });

  it('exporte une enveloppe versionnée et la réimporte', async () => {
    const { carnet } = createLocalBackend();
    await carnet.add(musee);
    const json = await carnet.export();
    expect(JSON.parse(json ?? '')).toMatchObject({ v: 1 });
    await carnet.clear();
    expect((await carnet.import(json ?? '')).conversions).toEqual([musee]);
  });

  it('refuse un fichier illisible, et ne touche à rien', async () => {
    const { carnet } = createLocalBackend();
    await carnet.add(musee);
    await expect(
      carnet.import('{"v":1,"data":{"conversions":"x"}}')
    ).rejects.toThrow();
    expect((await carnet.load()).conversions).toEqual([musee]);
  });

  it('refuse une conversion où l’euro n’est d’aucun côté', async () => {
    const { carnet } = createLocalBackend();
    const sansEuro = {
      ...musee,
      vers: { code: 'USD', montant: 3.6 },
    };
    const json = JSON.stringify({ v: 1, data: { conversions: [sansEuro] } });
    await expect(carnet.import(json)).rejects.toThrow();
  });
});

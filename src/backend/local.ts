import { createVersionedStore } from '@mister-guiiug/dev-pwa-config/versioned-store';
import { carnetSchema, type Backend, type CarnetInstantane } from './ports.ts';

/**
 * Le carnet sur l'appareil : `versioned-store` du socle (ADR 0002), sous la
 * clé `miss-devises:carnet`. L'enveloppe `{ v, data }` est aussi celle de
 * l'export, et l'import la valide par le même schéma que la lecture.
 *
 * VERSION 2 (spécification 002) : chaque conversion porte sa référence. En
 * version 1, l'euro était toujours l'un des deux côtés et `taux` s'y lisait
 * déjà en unités de la devise pour un euro : la migration pose
 * `reference: 'EUR'`, rien d'autre. Elle sert aussi à l'import d'un fichier
 * exporté avant. Une conversion de version 1 où l'euro n'est d'aucun côté
 * reste refusée : le schéma veut la référence d'un côté.
 */
export const carnetStore = createVersionedStore<CarnetInstantane>({
  store: 'miss-devises',
  key: 'carnet',
  version: 2,
  validate: (data: unknown) => carnetSchema.parse(data),
  seed: (): CarnetInstantane => ({ conversions: [] }),
  migrations: {
    1: (data: unknown) => {
      const v1 = data as { conversions?: unknown } | null;
      if (!Array.isArray(v1?.conversions)) return data;
      return {
        ...v1,
        conversions: v1.conversions.map((c: unknown) =>
          typeof c === 'object' && c !== null ? { ...c, reference: 'EUR' } : c
        ),
      };
    },
  },
});

export function createLocalBackend(): Backend {
  return {
    carnet: {
      load: async () => carnetStore.load(),
      add: async conversion => {
        const { conversions } = carnetStore.load();
        carnetStore.save({ conversions: [conversion, ...conversions] });
      },
      rename: async (id, libelle) => {
        const { conversions } = carnetStore.load();
        carnetStore.save({
          conversions: conversions.map(c =>
            c.id === id ? { ...c, libelle } : c
          ),
        });
      },
      remove: async id => {
        const { conversions } = carnetStore.load();
        carnetStore.save({ conversions: conversions.filter(c => c.id !== id) });
      },
      clear: async () => {
        carnetStore.clear();
      },
      export: async () => carnetStore.export(),
      import: async json => carnetStore.import(json),
    },
  };
}

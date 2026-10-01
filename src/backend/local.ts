import { createVersionedStore } from '@mister-guiiug/dev-pwa-config/versioned-store';
import { carnetSchema, type Backend, type CarnetInstantane } from './ports.ts';

/**
 * Le carnet sur l'appareil : `versioned-store` du socle (ADR 0002), sous la
 * clé `miss-devises:carnet`. L'enveloppe `{ v, data }` est aussi celle de
 * l'export, et l'import la valide par le même schéma que la lecture.
 */
export const carnetStore = createVersionedStore<CarnetInstantane>({
  store: 'miss-devises',
  key: 'carnet',
  version: 1,
  validate: (data: unknown) => carnetSchema.parse(data),
  seed: (): CarnetInstantane => ({ conversions: [] }),
  migrations: {},
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

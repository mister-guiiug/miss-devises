import { create } from 'zustand';
import { createId } from '@mister-guiiug/dev-pwa-config/id';
import { createLogger } from '@mister-guiiug/dev-pwa-config/logger';
import { backend } from '../../backend/index.ts';
import type { ConversionEnregistree } from '../../backend/ports.ts';

const log = createLogger('carnet');

/** Le sursis d'une suppression : on annule plutôt qu'on confirme (ADR 0008). */
export const UNDO_MS = 8_000;

export type NouvelleConversion = Omit<ConversionEnregistree, 'id' | 'creeeLe'>;

interface Suppression {
  conversion: ConversionEnregistree;
  index: number;
}

interface EtatCarnet {
  conversions: ConversionEnregistree[];
  ready: boolean;
  error: string | null;
  pending: Suppression | null;
  load: () => Promise<void>;
  add: (conversion: NouvelleConversion) => Promise<void>;
  rename: (id: string, libelle: string) => Promise<void>;
  remove: (id: string) => void;
  undoRemove: (id: string) => void;
  commitRemove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  importJson: (json: string) => Promise<number | null>;
}

let sursis: ReturnType<typeof setTimeout> | null = null;
function annulerSursis() {
  if (sursis !== null) clearTimeout(sursis);
  sursis = null;
}

const message = (cause: unknown) =>
  cause instanceof Error ? cause.message : String(cause);

/**
 * Le carnet vivant, sur le modèle du magasin de notes du squelette : l'écran
 * change d'abord, le port écrit ensuite, et un échec d'écriture rétablit
 * l'état d'avant avec l'erreur à dire.
 */
export const useCarnet = create<EtatCarnet>((set, get) => {
  async function persister(
    ecriture: () => Promise<void>,
    avant: ConversionEnregistree[]
  ) {
    try {
      await ecriture();
      set({ error: null });
    } catch (cause) {
      log.error('écriture du carnet', { cause });
      set({ conversions: avant, error: message(cause) });
    }
  }

  return {
    conversions: [],
    ready: false,
    error: null,
    pending: null,

    async load() {
      try {
        const { conversions } = await backend.carnet.load();
        set({ conversions, ready: true, error: null });
      } catch (cause) {
        log.error('lecture du carnet', { cause });
        set({ ready: true, error: message(cause) });
      }
    },

    async add(nouvelle) {
      const libelle =
        nouvelle.libelle.trim() ||
        `${nouvelle.de.montant} ${nouvelle.de.code} → ${nouvelle.vers.code}`;
      const conversion: ConversionEnregistree = {
        ...nouvelle,
        libelle,
        id: createId('conv'),
        creeeLe: new Date().toISOString(),
      };
      const avant = get().conversions;
      set({ conversions: [conversion, ...avant] });
      await persister(() => backend.carnet.add(conversion), avant);
    },

    async rename(id, libelle) {
      const propre = libelle.trim();
      if (!propre) return;
      const avant = get().conversions;
      set({
        conversions: avant.map(c =>
          c.id === id ? { ...c, libelle: propre } : c
        ),
      });
      await persister(() => backend.carnet.rename(id, propre), avant);
    },

    remove(id) {
      // Une seule suppression en sursis : la précédente devient définitive.
      const encours = get().pending;
      if (encours) void get().commitRemove(encours.conversion.id);
      const conversions = get().conversions;
      const index = conversions.findIndex(c => c.id === id);
      if (index < 0) return;
      set({
        conversions: conversions.filter(c => c.id !== id),
        pending: { conversion: conversions[index]!, index },
      });
      annulerSursis();
      sursis = setTimeout(() => void get().commitRemove(id), UNDO_MS);
    },

    undoRemove(id) {
      const encours = get().pending;
      if (!encours || encours.conversion.id !== id) return;
      annulerSursis();
      const conversions = [...get().conversions];
      conversions.splice(encours.index, 0, encours.conversion);
      set({ conversions, pending: null });
    },

    async commitRemove(id) {
      const encours = get().pending;
      if (!encours || encours.conversion.id !== id) return;
      annulerSursis();
      set({ pending: null });
      try {
        await backend.carnet.remove(id);
      } catch (cause) {
        log.error('suppression au carnet', { cause });
        set({ error: message(cause) });
      }
    },

    async clear() {
      annulerSursis();
      set({ conversions: [], pending: null });
      await backend.carnet.clear();
    },

    async importJson(json) {
      try {
        const { conversions } = await backend.carnet.import(json);
        set({ conversions, ready: true, error: null, pending: null });
        return conversions.length;
      } catch (cause) {
        set({ error: message(cause) });
        return null;
      }
    },
  };
});

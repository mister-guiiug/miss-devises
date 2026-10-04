import { create } from 'zustand';
import { createIdb } from '@mister-guiiug/dev-pwa-config/idb';
import {
  createServiceTaux,
  type EtatTaux,
  type ServiceTaux,
} from './service.ts';
import { recupererJson } from './sources.ts';

export const UNE_HEURE = 3_600_000;
const CLE_LECTURE = 'miss-devises:taux-lus-le';

interface EtatStoreTaux {
  /** Ce que l'appareil sait des deux sources. */
  etat: EtatTaux;
  /** `true` une fois le cache lu : l'écran peut afficher sans attendre le réseau. */
  pret: boolean;
  chargement: boolean;
  /** `true` si la dernière lecture n'a rien rendu (hors ligne, sources muettes). */
  echec: boolean;
  demarrer: () => Promise<void>;
  rafraichir: (options?: { force?: boolean }) => Promise<void>;
}

/**
 * Factory de test (et de référence) : hydrate IndexedDB, puis le réseau, au
 * plus une fois par heure via `CLE_LECTURE`. En production, le miroir
 * `useTaux` est alimenté par TanStack Query (`shared/queries/taux.ts`) —
 * même ordre R8, le throttle passant par `staleTime`.
 */
export function creerStoreTaux(
  service: ServiceTaux,
  maintenant: () => number = () => Date.now()
) {
  return create<EtatStoreTaux>((set, get) => ({
    etat: {},
    pret: false,
    chargement: false,
    echec: false,

    async demarrer() {
      const gardes = await service.hydrater();
      set(etat => ({ etat: { ...etat.etat, ...gardes }, pret: true }));
      // Le ménage ne retarde rien : l'écran a déjà ses taux.
      void service.menage();
      await get().rafraichir();
    },

    async rafraichir(options) {
      // Jamais lu : on lit. Un zéro par défaut aurait fait d'une première
      // ouverture une lecture « récente » pour qui compte depuis l'époque Unix.
      const derniere = localStorage.getItem(CLE_LECTURE);
      const recente =
        derniere !== null && maintenant() - Number(derniere) < UNE_HEURE;
      if (!options?.force && recente) return;
      if (get().chargement) return;
      set({ chargement: true });
      const lus = await service.rafraichir();
      const rien = !lus.bce && !lus.marche;
      if (!rien) localStorage.setItem(CLE_LECTURE, String(maintenant()));
      set(etat => ({
        etat: { ...etat.etat, ...lus },
        chargement: false,
        echec: rien,
        pret: true,
      }));
    },
  }));
}

/** Le service de l'application : IndexedDB du socle et `fetch` avec délai. */
export const serviceTaux = createServiceTaux({
  cache: createIdb('miss-devises'),
  recuperer: recupererJson,
});

/**
 * Miroir UI des taux : `etat`, `pret`, `chargement`, `echec`. Le réseau et
 * l'hydratation sont portés par `useTauxBootstrap` (TanStack Query).
 */
export const useTaux = create<{
  etat: EtatTaux;
  pret: boolean;
  chargement: boolean;
  echec: boolean;
}>(() => ({
  etat: {},
  pret: false,
  chargement: false,
  echec: false,
}));

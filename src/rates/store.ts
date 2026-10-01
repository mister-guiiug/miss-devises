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
 * Le dernier taux gardé s'affiche aussitôt, puis l'application le rafraîchit
 * en arrière-plan, au plus une fois par heure (recherche R8). Une source qui
 * répond remplace la sienne ; une source muette laisse la sienne en place.
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

export const useTaux = creerStoreTaux(serviceTaux);

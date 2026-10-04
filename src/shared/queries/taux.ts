import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { serviceTaux, useTaux, UNE_HEURE } from '../../rates/store.ts';
import type { EtatTaux } from '../../rates/service.ts';
import { getQueryClient } from './client.ts';
import { queryKeys } from './keys.ts';

function syncReseauVersMiroir(lus: EtatTaux): void {
  const rien = !lus.bce && !lus.marche;
  useTaux.setState(etat => ({
    etat: { ...etat.etat, ...lus },
    echec: rien,
    pret: true,
  }));
}

/**
 * Bootstrap des taux du jour : IndexedDB d'abord (`pret`), puis le réseau
 * via Query (recherche R8). Une source qui répond remplace la sienne ; une
 * source muette laisse la sienne en place. Au retour en ligne, on force.
 */
export function useTauxBootstrap(): void {
  const [hydrate, setHydrate] = useState(false);

  useEffect(() => {
    let annule = false;
    void (async () => {
      const gardes = await serviceTaux.hydrater();
      if (annule) return;
      useTaux.setState(etat => ({
        etat: { ...etat.etat, ...gardes },
        pret: true,
      }));
      // Le ménage ne retarde rien : l'écran a déjà ses taux.
      void serviceTaux.menage();
      setHydrate(true);
    })();
    return () => {
      annule = true;
    };
  }, []);

  const query = useQuery({
    queryKey: queryKeys.tauxJour(),
    queryFn: ({ signal }) => serviceTaux.rafraichir(signal),
    enabled: hydrate,
    staleTime: UNE_HEURE,
    gcTime: UNE_HEURE,
  });

  useEffect(() => {
    if (query.data !== undefined) syncReseauVersMiroir(query.data);
  }, [query.data]);

  useEffect(() => {
    useTaux.setState({ chargement: query.isFetching });
  }, [query.isFetching]);

  useEffect(() => {
    const enLigne = () => {
      void rafraichirTaux({ force: true });
    };
    window.addEventListener('online', enLigne);
    return () => window.removeEventListener('online', enLigne);
  }, []);
}

/**
 * Relit les taux du jour. `force` ignore le staleTime d'une heure
 * (bouton « Réessayer », événement `online`).
 */
export async function rafraichirTaux(options?: {
  force?: boolean;
}): Promise<void> {
  const client = getQueryClient();
  if (options?.force) {
    await client.invalidateQueries({ queryKey: queryKeys.tauxJour() });
  }
  await client.refetchQueries({ queryKey: queryKeys.tauxJour() });
}

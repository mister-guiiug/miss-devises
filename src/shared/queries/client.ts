import { getQueryClient as getFamilyQueryClient } from '@mister-guiiug/dev-pwa-config/react/query-client';
import { UNE_HEURE } from '../../rates/store.ts';

/**
 * Client Query de l'app — defaults famille + staleTime / gcTime d'une heure
 * (recherche R8 : au plus une lecture réseau par heure).
 */
export function getQueryClient() {
  return getFamilyQueryClient({
    queries: {
      staleTime: UNE_HEURE,
      gcTime: UNE_HEURE,
    },
  });
}

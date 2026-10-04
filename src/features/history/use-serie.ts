import { useQuery } from '@tanstack/react-query';
import { serviceTaux, useTaux } from '../../rates/store.ts';
import type { Periode, Serie } from '../../rates/service.ts';
import { queryKeys } from '../../shared/queries/keys.ts';

export type EtatSerie =
  | { statut: 'chargement' }
  | { statut: 'pret'; serie: Serie }
  | { statut: 'indisponible' };

/**
 * La série d'une paire sur une période, par Query : le cache d'abord,
 * le réseau ensuite. Une période jamais lue, hors ligne, est `indisponible`
 * (récit 3, scénario 4).
 *
 * ON ATTEND LE TAUX DU JOUR. Tant que sa relecture est en cours, la grille de
 * marché ne part pas : un an, c'est jusqu'à 53 lectures (CR-004), et elles ne
 * doivent pas concurrencer le taux affiché. On attend aussi de connaître la
 * BCE : sans elle, une devise qu'elle publie passerait pour du marché.
 */
export function useSerie(
  reference: string,
  code: string,
  periode: Periode
): EtatSerie {
  const pret = useTaux(s => s.pret);
  const chargement = useTaux(s => s.chargement);
  const sourceConnue = pret && !chargement;

  const query = useQuery({
    queryKey: queryKeys.serie(reference, code, periode),
    queryFn: ({ signal }) =>
      serviceTaux.serie(
        reference,
        code,
        periode,
        useTaux.getState().etat,
        signal
      ),
    enabled: sourceConnue,
    // Une série manquante (hors ligne) se dit tout de suite — pas de seconde
    // tentative qui retarderait le message « jamais consultée ».
    retry: false,
  });

  // `isLoading` : en attente sans donnée encore (pas un refetch en arrière-plan).
  if (!sourceConnue || query.isLoading) {
    return { statut: 'chargement' };
  }
  if (query.isError || !query.data || query.data.points.length === 0) {
    return { statut: 'indisponible' };
  }
  return { statut: 'pret', serie: query.data };
}

import { useEffect, useState } from 'react';
import { serviceTaux, useTaux } from '../../rates/store.ts';
import type { Periode, Serie } from '../../rates/service.ts';

export type EtatSerie =
  | { statut: 'chargement' }
  | { statut: 'pret'; serie: Serie }
  | { statut: 'indisponible' };

/**
 * La série d'une paire sur une période, par le service : le cache d'abord,
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
  const etat = useTaux(s => s.etat);
  const pret = useTaux(s => s.pret);
  const chargement = useTaux(s => s.chargement);
  const sourceConnue = pret && !chargement;
  const cle = `${reference}:${code}:${periode}`;
  const [lu, setLu] = useState<{ cle: string; etat: EtatSerie }>();

  useEffect(() => {
    if (!sourceConnue) return undefined;
    const controle = new AbortController();
    serviceTaux
      .serie(reference, code, periode, etat, controle.signal)
      .then(serie => {
        if (controle.signal.aborted) return;
        setLu({
          cle,
          etat:
            serie.points.length > 0
              ? { statut: 'pret', serie }
              : { statut: 'indisponible' },
        });
      })
      .catch(() => {
        if (!controle.signal.aborted)
          setLu({ cle, etat: { statut: 'indisponible' } });
      });
    return () => controle.abort();
  }, [reference, code, periode, etat, sourceConnue, cle]);

  return lu?.cle === cle ? lu.etat : { statut: 'chargement' };
}

/**
 * LES DÉPENSES NOTÉES, L'ÉTAT PARTAGÉ (spécification 007, récit 4). L'agent
 * les écrit dans son état par un correctif JSON ; l'application les lit, les
 * convertit au taux du jour de chaque paire et fait le total — l'agent, lui,
 * ne fait aucun calcul (principe I) : il lit ce total dans le contexte.
 */
import { z } from 'zod';
import { convertir } from '../domain/convert.ts';
import { formaterMontant, type Langue } from '../domain/money.ts';
import { tauxDuJour, type EtatTaux } from '../rates/service.ts';

const Depense = z.object({
  id: z.string(),
  libelle: z.string(),
  montant: z.number().positive(),
  devise: z.string().regex(/^[A-Z]{3}$/),
});
export type Depense = z.infer<typeof Depense>;

/** Les dépenses valides de l'état de l'agent ; le reste est ignoré, pas fatal. */
export function lireDepenses(etat: unknown): Depense[] {
  const liste = (etat as { depenses?: unknown } | null | undefined)?.depenses;
  if (!Array.isArray(liste)) return [];
  return liste.flatMap(d => {
    const lu = Depense.safeParse(d);
    return lu.success ? [lu.data] : [];
  });
}

export interface LigneDepense extends Depense {
  texte: string;
  /** En référence, ou `null` sans taux pour sa devise : jamais un taux inventé. */
  enReference: number | null;
  texteReference: string | null;
}

export interface DepensesConverties {
  lignes: LigneDepense[];
  total: number;
  totalTexte: string;
  /** Les lignes sans taux, que le total ne compte pas. */
  sansTaux: number;
}

export function convertirDepenses(
  depenses: readonly Depense[],
  reference: string,
  etat: EtatTaux,
  langue: Langue,
  maintenant = new Date()
): DepensesConverties {
  const lignes = depenses.map((d): LigneDepense => {
    const taux =
      d.devise === reference
        ? 1
        : tauxDuJour(reference, d.devise, etat, maintenant)?.taux;
    const enReference =
      taux === undefined ? null : convertir(d.montant, taux, 'versReference');
    return {
      ...d,
      texte: formaterMontant(d.montant, d.devise, langue),
      enReference,
      texteReference:
        enReference === null
          ? null
          : formaterMontant(enReference, reference, langue),
    };
  });
  const total = lignes.reduce((somme, l) => somme + (l.enReference ?? 0), 0);
  return {
    lignes,
    total,
    totalTexte: formaterMontant(total, reference, langue),
    sansTaux: lignes.filter(l => l.enReference === null).length,
  };
}

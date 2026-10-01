import { z } from 'zod';

/**
 * Le modèle, décrit par un schéma dont le type est DÉRIVÉ (ADR 0002).
 *
 * Le schéma sert deux fois : il type le code, et il valide ce qui remonte du
 * stockage — une donnée écrite par une version antérieure, ou un fichier
 * importé.
 */
const CODE = z.string().regex(/^[A-Z]{3}$/);
const MONTANT = z.object({ code: CODE, montant: z.number().positive() });

export const conversionSchema = z
  .object({
    id: z.string().min(1),
    libelle: z.string().trim().min(1).max(120),
    de: MONTANT,
    vers: MONTANT,
    /** Unités de la devise étrangère pour un euro. */
    taux: z.number().positive(),
    source: z.enum(['bce', 'marche']),
    dateTaux: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    creeeLe: z.string(),
  })
  // « Des monnaies d'euros » : l'euro est toujours l'une des deux devises
  // (spécification 001, clarifications).
  .refine(c => c.de.code === 'EUR' || c.vers.code === 'EUR', {
    message: 'l’euro doit être l’une des deux devises',
  });

export type ConversionEnregistree = z.infer<typeof conversionSchema>;

export const carnetSchema = z.object({
  conversions: z.array(conversionSchema),
});

export type CarnetInstantane = z.infer<typeof carnetSchema>;

/**
 * LE PORT DU CARNET (contrat `ports.md`). Même forme que le port `notes` du
 * squelette, dont il prend la place : des mutations, pas un instantané, et
 * tout asynchrone, même en local — un adaptateur distant doit pouvoir
 * l'implémenter sans que les écrans changent.
 */
export interface CarnetRepository {
  load(): Promise<CarnetInstantane>;
  add(conversion: ConversionEnregistree): Promise<void>;
  rename(id: string, libelle: string): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  /** L'état courant en JSON (`{ v, data }`), pour l'export des réglages. */
  export(): Promise<string | null>;
  /** Remplace tout par un export valide ; rejette un fichier illisible. */
  import(json: string): Promise<CarnetInstantane>;
}

export interface Backend {
  carnet: CarnetRepository;
}

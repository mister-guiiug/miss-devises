import { z } from 'zod';

/**
 * Les mots utiles du pays (spécification 004) : seize phrases par langue,
 * rédigées ici et relues contre les guides de conversation de Wikivoyage
 * (`specs/004-mots-utiles/phrases.md`). Le sens de chaque phrase vit dans les
 * messages de l'application (`phrases.sens.<id>`), pas ici : il suit la
 * langue de l'application (recherche R3).
 *
 * Le jeu (`phrases.json`) n'est lu que par la feuille, chargée à part : ce
 * module ne l'importe pas.
 */

export const GROUPES = ['bases', 'marchander', 'monnaie', 'addition'] as const;
export type Groupe = (typeof GROUPES)[number];

export const IDS = [
  'bonjour',
  'merci',
  'sVousPlait',
  'nonMerci',
  'combien',
  'tropCher',
  'baisser',
  'dernierPrix',
  'daccord',
  'casser',
  'petiteMonnaie',
  'pasDeMonnaie',
  'addition',
  'carte',
  'garderMonnaie',
  'erreur',
] as const;
export type IdPhrase = (typeof IDS)[number];

const phraseSchema = z.object({
  texte: z.string().min(1),
  /** Transcription latine, pour une écriture qui ne l'est pas. */
  latin: z.string().min(1).optional(),
});

const langueSchema = z.object({
  direction: z.literal('rtl').optional(),
  phrases: z.record(z.enum(IDS), phraseSchema),
});

export const phrasesSchema = z.object({
  releveLe: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categories: z.record(z.enum(GROUPES), z.array(z.enum(IDS))),
  langues: z.record(z.string(), langueSchema),
});

export type JeuPhrases = z.infer<typeof phrasesSchema>;
export type Phrase = z.infer<typeof phraseSchema>;

import { z } from 'zod';

/** La couleur visible d'une pièce ; bimétal : le CENTRE, puis l'ANNEAU. */
export const METAUX = [
  'cuivre',
  'laiton',
  'argent',
  'bimetal-or-argent',
  'bimetal-argent-or',
  'autre',
] as const;
export type Metal = (typeof METAUX)[number];

const billetSchema = z.object({
  valeur: z.number().positive(),
  couleur: z.string().regex(/^#[0-9a-f]{6}$/),
  largeurMm: z.number().positive().optional(),
  hauteurMm: z.number().positive().optional(),
  plusEmis: z.literal(true).optional(),
});

const pieceSchema = z.object({
  valeur: z.number().positive(),
  metal: z.enum(METAUX),
  diametreMm: z.number().positive().optional(),
  plusEmis: z.literal(true).optional(),
});

const deviseSchema = z.object({
  decimales: z.number().int().min(0),
  billets: z.array(billetSchema),
  pieces: z.array(pieceSchema),
  sources: z.array(z.url()).min(1),
});

/**
 * Les billets et pièces de 41 devises, relevés le 01/10/2026 (voir
 * `specs/001-convertisseur-visuel/coupures.md` : sources, conventions, doutes).
 */
export const coupuresSchema = z.object({
  releveLe: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  devises: z.record(z.string().regex(/^[A-Z]{3}$/), deviseSchema),
});

export type Coupures = z.infer<typeof coupuresSchema>;
export type DeviseCoupures = z.infer<typeof deviseSchema>;
export type Billet = z.infer<typeof billetSchema>;
export type Piece = z.infer<typeof pieceSchema>;

let chargement: Promise<Coupures> | undefined;

/**
 * Le jeu de données, chargé à la première ouverture du volet : un morceau à
 * part, précaché par le service worker, qui ne pèse pas sur l'accueil. Le
 * schéma le valide et le type (un JSON importé ne connaît que des chaînes).
 */
export function chargerCoupures(): Promise<Coupures> {
  chargement ??= import('./coupures.json').then(module =>
    coupuresSchema.parse(module.default)
  );
  return chargement;
}

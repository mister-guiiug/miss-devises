import { z } from 'zod';

/**
 * LES PHOTOS DES COUPURES (spécification 002, récit 3, recherche R5).
 *
 * Une photo par coupure, au plus : le recto, hébergé sur Wikimedia Commons,
 * sous licence libre ou avec la permission de son émetteur. Le jeu est relevé
 * et vérifié par l'API de Commons avant d'entrer ici (voir
 * `specs/002-reference-drapeaux-photos/photos.md`) : l'application n'en
 * cherche aucune à l'exécution, et n'en héberge aucune.
 */
const photoSchema = z.object({
  /** La valeur de la coupure, comme dans `coupures.json`. */
  valeur: z.number().positive(),
  /** Le nom du fichier sur Commons, sans le préfixe « File: ». */
  fichier: z.string().min(1),
  /**
   * La vignette telle que l'API de Commons la rend, à un palier de largeur
   * (120, 250 ou 330 px), sur l'hôte des vignettes ; un original plus étroit
   * que le palier est servi tel quel, par l'hôte des originaux.
   */
  vignette: z
    .url()
    .regex(/^https:\/\/(thumb|upload)\.wikimedia\.org\/wikipedia\/commons\//),
  /** Les dimensions de l'original : son sens et ses proportions. */
  largeur: z.number().int().positive(),
  hauteur: z.number().int().positive(),
  /** À créditer : le champ « Artist » de Commons, en texte. */
  auteur: z.string().min(1),
  /** Le nom court de la licence ou de la permission (« CC BY-SA 4.0 »). */
  licence: z.string().min(1),
  /**
   * Le texte de la licence, quand elle en a un : les licences Creative
   * Commons veulent un lien vers lui, pas seulement son nom.
   */
  licenceUrl: z.url().startsWith('https://').optional(),
});

const devisePhotosSchema = z.object({
  billets: z.array(photoSchema),
  pieces: z.array(photoSchema),
});

export const photosSchema = z.object({
  releveLe: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  devises: z.record(z.string().regex(/^[A-Z]{3}$/), devisePhotosSchema),
});

export type Photos = z.infer<typeof photosSchema>;
export type DevisePhotos = z.infer<typeof devisePhotosSchema>;
export type Photo = z.infer<typeof photoSchema>;

/** Les largeurs que Commons sert ; toute autre est refusée (HTTP 400). */
export const PALIERS = [120, 250, 330] as const;

/** La largeur d'une vignette, lue dans son adresse (`…/330px-…`). */
export function largeurDeVignette(vignette: string): number | undefined {
  const largeur = /\/(\d+)px-[^/]+$/.exec(new URL(vignette).pathname)?.[1];
  return largeur === undefined ? undefined : Number(largeur);
}

/** La page du fichier sur Commons : sa source, son auteur, sa licence. */
export function pageCommons(fichier: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(
    fichier.replaceAll(' ', '_')
  )}`;
}

let chargement: Promise<Photos> | undefined;

/**
 * Le jeu des photos, chargé au premier passage en mode photos : un morceau à
 * part, qui ne pèse ni sur l'accueil ni sur le volet en mode dessins.
 */
export function chargerPhotos(): Promise<Photos> {
  chargement ??= import('./photos.json').then(module =>
    photosSchema.parse(module.default)
  );
  return chargement;
}

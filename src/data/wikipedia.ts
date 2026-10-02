import { z } from 'zod';

/**
 * L'ARTICLE WIKIPÉDIA DE CHAQUE DEVISE : là où l'on voit les vraies coupures
 * que l'application garde dessinées (spécification 002, récit 3).
 *
 * UN LIEN, PAS UNE IMAGE. Les billets égyptiens restent dessinés parce que le
 * Code pénal égyptien (art. 204 bis A) soumet leur image à une licence ; un
 * lien n'en publie aucune, c'est Wikipédia qui l'héberge et en répond. Rien ne
 * part chez Wikimedia avant le clic.
 *
 * L'édition anglaise, même pour l'interface française : elle admet les images
 * non libres, l'édition française non. Relevé par
 * `scripts/wikipedia-devises.mjs` sur Wikidata, qui dit pourquoi en chiffres.
 */
const wikipediaSchema = z.object({
  releveLe: z.string(),
  source: z.string(),
  /** Code ISO 4217 → article de en.wikipedia.org. */
  devises: z.record(
    z.string().regex(/^[A-Z]{3}$/),
    z.string().regex(/^https:\/\/en\.wikipedia\.org\/wiki\/\S+$/)
  ),
});

export type Wikipedia = z.infer<typeof wikipediaSchema>;

let chargement: Promise<Wikipedia> | undefined;

/** Les articles, chargés à l'ouverture du volet, comme le jeu des photos. */
export function chargerWikipedia(): Promise<Wikipedia> {
  chargement ??= import('./wikipedia.json').then(module =>
    wikipediaSchema.parse(module.default)
  );
  return chargement;
}

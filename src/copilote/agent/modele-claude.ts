/**
 * CLAUDE, AVEC LA CLÉ DU VISITEUR (spécification 007, R5 et R10). Le site est
 * statique : aucun serveur ne garde de clé ni ne relaie les appels. Le
 * navigateur parle donc DIRECTEMENT à l'API d'Anthropic, avec la clé que le
 * visiteur a saisie (BYOK). `dangerouslyAllowBrowser` le permet, et le SDK
 * pose l'en-tête `anthropic-dangerous-direct-browser-access` que l'API exige
 * pour répondre à une autre origine. Le danger que le nom désigne — exposer
 * une clé de l'exploitant — n'existe pas ici : la clé est celle du visiteur,
 * dans son propre onglet.
 *
 * Le flux du SDK passe tel quel à la traduction ; le tour complet vient de
 * `finalMessage()`, qui gère seul la fin, l'erreur et l'abandon.
 */
import Anthropic from '@anthropic-ai/sdk';
import {
  ErreurModele,
  type Modele,
  type Requete,
  type Tour,
} from './modele.ts';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface OptionsClaude {
  modele: string;
  effort: Effort;
  cle: string;
  /** Pour les tests : un faux réseau, au lieu de l'API. */
  fetch?: typeof globalThis.fetch;
}

/**
 * Le repli côté serveur (`fallbacks: 'default'`) rejoue une demande refusée
 * par un classifieur de sécurité sur le modèle que l'API recommande, dans le
 * même flux. Claude Haiku 5.5 n'en a pas : la demande refusée resterait
 * refusée, le paramètre ne sert à rien.
 */
const avecRepli = (modele: string) => !modele.startsWith('claude-haiku');

export function creerModeleClaude(options: OptionsClaude): Modele {
  const client = new Anthropic({
    apiKey: options.cle,
    dangerouslyAllowBrowser: true,
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  return {
    nom: options.modele,
    fournisseur: 'anthropic',
    tour(requete: Requete): Tour {
      const flux = client.beta.messages.stream(
        {
          model: options.modele,
          max_tokens: 64000,
          ...(avecRepli(options.modele)
            ? {
                betas: ['server-side-fallback-2026-07-01'],
                fallbacks: 'default' as const,
              }
            : {}),
          // Raisonnement adaptatif, résumé affiché : sans `summarized`, les
          // blocs de raisonnement arrivent vides et l'inspecteur n'a rien à
          // montrer de `REASONING_*`.
          thinking: { type: 'adaptive', display: 'summarized' },
          output_config: { effort: options.effort },
          system: [
            {
              type: 'text',
              text: requete.systeme,
              cache_control: { type: 'ephemeral' },
            },
            { type: 'text', text: requete.contexte },
          ],
          messages: requete.messages,
          tools: requete.outils,
        },
        { signal: requete.signal }
      );
      return {
        flux: (async function* () {
          try {
            yield* flux;
          } catch (erreur) {
            throw traduireErreur(erreur);
          }
        })(),
        fin: async () => {
          try {
            const message = await flux.finalMessage();
            return {
              contenu: message.content,
              arret: message.stop_reason,
              modele: message.model,
              jetons: {
                entree: message.usage.input_tokens,
                sortie: message.usage.output_tokens,
                lusEnCache: message.usage.cache_read_input_tokens ?? 0,
                ecritsEnCache: message.usage.cache_creation_input_tokens ?? 0,
              },
            };
          } catch (erreur) {
            throw traduireErreur(erreur);
          }
        },
      };
    },
  };
}

/** Les pannes qu'on sait nommer, de la plus précise à la plus générale. */
function traduireErreur(erreur: unknown): unknown {
  if (erreur instanceof Anthropic.AuthenticationError) {
    return new ErreurModele(
      'Clé Anthropic refusée : vérifiez la clé saisie dans l’onglet « Modèle ».',
      'cle'
    );
  }
  if (erreur instanceof Anthropic.PermissionDeniedError) {
    return new ErreurModele(
      'Cette clé n’a pas accès à ce modèle : choisissez-en un autre dans l’onglet « Modèle ».',
      'acces'
    );
  }
  if (erreur instanceof Anthropic.RateLimitError) {
    return new ErreurModele(
      'Trop de demandes pour cette clé : réessayez dans un instant.',
      'limite'
    );
  }
  if (erreur instanceof Anthropic.BadRequestError) {
    return new ErreurModele(
      `Demande refusée par l’API : ${erreur.message}`,
      'demande'
    );
  }
  if (erreur instanceof Anthropic.APIConnectionError) {
    return new ErreurModele(
      'L’API d’Anthropic ne répond pas : êtes-vous hors ligne ?',
      'reseau'
    );
  }
  if (erreur instanceof Anthropic.APIError) {
    return new ErreurModele(
      `Erreur de l’API (${String(erreur.status)}) : ${erreur.message}`,
      'api'
    );
  }
  return erreur;
}

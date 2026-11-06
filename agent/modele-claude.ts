/**
 * CLAUDE (spécification 007, R5). Le flux du SDK passe tel quel à la
 * traduction ; le tour complet vient de `finalMessage()`, qui gère seul la
 * fin, l'erreur et l'abandon.
 *
 * Le repli côté serveur est activé (`fallbacks: 'default'`) : si un
 * classifieur de sécurité refuse la demande, l'API la rejoue sur le modèle
 * qu'elle recommande pour ce motif, dans le même flux, au lieu d'arrêter la
 * démonstration. Le message final nomme alors le modèle qui a répondu.
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
  /** Lue dans `.env.local` par le greffon ; sinon le SDK cherche lui-même. */
  cle?: string;
}

export function creerModeleClaude(options: OptionsClaude): Modele {
  const client = new Anthropic(options.cle ? { apiKey: options.cle } : {});
  return {
    nom: options.modele,
    fournisseur: 'anthropic',
    tour(requete: Requete): Tour {
      const flux = client.beta.messages.stream(
        {
          model: options.modele,
          max_tokens: 64000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
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
      'Clé Anthropic absente ou refusée : posez ANTHROPIC_API_KEY dans l’environnement ou dans .env.local, ou lancez npm run dev:copilote:simule.',
      'cle'
    );
  }
  if (erreur instanceof Anthropic.RateLimitError) {
    return new ErreurModele(
      'Trop de demandes : réessayez dans un instant.',
      'limite'
    );
  }
  if (erreur instanceof Anthropic.BadRequestError) {
    return new ErreurModele(
      `Demande refusée par l’API : ${erreur.message}`,
      'demande'
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

/**
 * LE MODÈLE SIMULÉ (spécification 007, R6). Un script qui lit le dernier
 * message et répond comme Claude répondrait — texte, raisonnement, appels
 * d'outils — en émettant les MÊMES événements de flux que le SDK, morceau par
 * morceau. La démonstration, l'inspecteur et les tests tournent ainsi sans
 * clé. Il ne comprend que quelques tournures ; il n'en a pas besoin de plus.
 */
import type Anthropic from '@anthropic-ai/sdk';
import type { Modele, Requete, Tour } from './modele.ts';
import type { Bloc, Flux, MessageModele } from './protocole.ts';

export const NOM_SIMULE = 'simulé';

/** Des mots qu'un voyageur écrit, et le code de la devise. Le plus précis d'abord. */
const DEVISES: [RegExp, string][] = [
  [/livres?\s+égyptiennes?/i, 'EGP'],
  [/francs?\s+suisses?/i, 'CHF'],
  [/\byens?\b|¥/i, 'JPY'],
  [/\beuros?\b|€/i, 'EUR'],
  [/\bdollars?\b|\$/i, 'USD'],
  [/\blivres?\b|£/i, 'GBP'],
  [/\bbahts?\b|฿/i, 'THB'],
  [/\bdirhams?\b/i, 'MAD'],
];

/** `\s` couvre les espaces insécables : « 1 200 » se lit 1200. */
const MONTANT = /(\d[\d\s]*(?:[.,]\d+)?)/;

export function lireDevise(texte: string): string | null {
  const code = /\b([A-Z]{3})\b/.exec(texte);
  if (code) return code[1]!;
  return DEVISES.find(([motif]) => motif.test(texte))?.[1] ?? null;
}

export function lireMontant(texte: string): number | null {
  const lu = MONTANT.exec(texte.replace(/\d+(?:[.,]\d+)?\s*%/g, ''));
  if (!lu) return null;
  const nombre = Number(lu[1]!.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(nombre) && nombre > 0 ? nombre : null;
}

type Appel = { name: string; input: Record<string, unknown> };

let compteur = 0;
const idOutil = () =>
  `toolu_simule_${Date.now().toString(36)}_${(compteur++).toString(36)}`;

/** Ce que le script répond, en blocs complets ; le flux les découpe ensuite. */
export function repondre(requete: Requete): Bloc[] {
  const dernier = requete.messages.at(-1);
  if (!dernier || dernier.role !== 'user')
    return [texte('Je n’ai rien reçu à lire.')];
  const blocs =
    typeof dernier.content === 'string'
      ? [{ type: 'text' as const, text: dernier.content }]
      : dernier.content;

  const resultats = blocs.filter(b => b.type === 'tool_result');
  if (resultats.length > 0)
    return [texte(lireResultats(resultats, requete.messages))];

  if (blocs.some(b => b.type === 'image')) {
    return [
      texte(
        'Mode simulé : je ne lis pas les images. Avec Claude (onglet « Modèle », votre clé Anthropic), la photo d’une étiquette donne son prix et sa devise.'
      ),
    ];
  }

  const phrase = blocs.map(b => (b.type === 'text' ? b.text : '')).join(' ');
  if (/combien.*(dépens|total)|\btotal\b|how much.*spen/i.test(phrase)) {
    // Le total, l'application l'a calculé et l'a mis dans le contexte : le
    // modèle le lit, il ne l'additionne pas (principe I).
    const total = /"totalTexte":"([^"]+)"/.exec(requete.contexte)?.[1];
    return [
      texte(
        total
          ? `D’après l’application, vos dépenses notées font ${total}.`
          : 'Aucune dépense n’est notée pour l’instant.'
      ),
    ];
  }

  const appels = lireIntentions(phrase);
  if (appels.length === 0) {
    return [
      texte(
        'Mode simulé. Essayez « 1200 JPY », « un café à 4,50 dollars avec 2 % de frais », « note un taxi à 3000 yens » ou « combien ai-je dépensé ? ».'
      ),
    ];
  }
  const disponibles = new Set(requete.outils.map(o => o.name));
  const absent = appels.find(a => !disponibles.has(a.name));
  if (absent)
    return [texte(`L’outil « ${absent.name} » n’est pas disponible.`)];
  return [
    {
      type: 'thinking',
      thinking: `Je cherche un montant, une devise et une intention. J’appelle : ${appels.map(a => a.name).join(', ')}.`,
      signature: 'simule',
    },
    texte(
      appels.length > 1 ? 'Je m’en occupe, en deux gestes.' : 'Je m’en occupe.'
    ),
    ...appels.map((a): Bloc => ({
      type: 'tool_use',
      id: idOutil(),
      name: a.name,
      input: a.input,
    })),
  ];
}

function lireIntentions(phrase: string): Appel[] {
  const montant = lireMontant(phrase);
  const devise = lireDevise(phrase);
  const note = /^\s*(?:note|ajoute|add)\b/i.test(phrase);
  if (note && montant !== null && devise) {
    const libelle =
      /^\s*(?:note|ajoute|add)\s+(?:un|une|le|la|des|a|an)?\s*(.+?)\s+(?:à|a|de|pour|for|at|:)\s+\d/i.exec(
        phrase
      )?.[1] ?? 'Dépense';
    return [{ name: 'noter_depense', input: { libelle, montant, devise } }];
  }
  const appels: Appel[] = [];
  const pourcentage = /(\d+(?:[.,]\d+)?)\s*%/.exec(phrase);
  if (pourcentage) {
    appels.push({
      name: 'appliquer_frais',
      input: {
        libelle: 'Carte',
        pourcentage: Number(pourcentage[1]!.replace(',', '.')),
      },
    });
  }
  if (montant !== null && devise)
    appels.push({ name: 'convertir', input: { montant, devise } });
  return appels;
}

function lireResultats(
  resultats: Anthropic.Beta.BetaContentBlockParam[],
  messages: MessageModele[]
): string {
  const noms = new Map<string, string>();
  for (const m of messages) {
    if (m.role !== 'assistant' || typeof m.content === 'string') continue;
    for (const b of m.content)
      if (b.type === 'tool_use') noms.set(b.id, b.name);
  }
  return resultats
    .map(r => {
      if (r.type !== 'tool_result') return '';
      const lu = lireJson(typeof r.content === 'string' ? r.content : '');
      const nom = noms.get(r.tool_use_id);
      if (r.is_error || !lu || lu.ok === false) {
        return `L’application n’a pas pu le faire (${String(lu?.raison ?? r.content ?? 'sans raison')}).`;
      }
      if (nom === 'convertir') {
        const cibles = Array.isArray(lu.resultats)
          ? (lu.resultats as { texte: string; source: string; date: string }[])
          : [];
        const premier = cibles[0];
        return premier
          ? `D’après l’application : ${String(lu.saisi)} font ${cibles.map(c => c.texte).join(' et ')} (taux ${premier.source}, ${premier.date}).`
          : 'L’application n’a rendu aucun montant.';
      }
      if (nom === 'appliquer_frais')
        return `Frais appliqués : ${String((lu.frais as { description?: string })?.description ?? '')}.`;
      if (nom === 'noter_depense')
        return `C’est noté : ${String((lu.depense as { libelle?: string })?.libelle ?? 'la dépense')}.`;
      return 'C’est fait.';
    })
    .filter(Boolean)
    .join(' ');
}

function lireJson(texte: string): Record<string, unknown> | null {
  try {
    const lu: unknown = JSON.parse(texte);
    return typeof lu === 'object' && lu !== null
      ? (lu as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function texte(contenu: string): Bloc {
  return { type: 'text', text: contenu, citations: null };
}

/** Les blocs, découpés comme le SDK les livre : un début, des morceaux, une fin. */
export function* decouper(blocs: Bloc[]): Generator<Flux> {
  for (const [index, bloc] of blocs.entries()) {
    if (bloc.type === 'text') {
      yield {
        type: 'content_block_start',
        index,
        content_block: { ...bloc, text: '' },
      };
      for (const morceau of bloc.text.match(/\S+\s*/g) ?? []) {
        yield {
          type: 'content_block_delta',
          index,
          delta: { type: 'text_delta', text: morceau },
        };
      }
    } else if (bloc.type === 'thinking') {
      yield {
        type: 'content_block_start',
        index,
        content_block: { ...bloc, thinking: '' },
      };
      for (const morceau of bloc.thinking.match(/\S+\s*/g) ?? []) {
        yield {
          type: 'content_block_delta',
          index,
          delta: {
            type: 'thinking_delta',
            thinking: morceau,
            estimated_tokens: null,
          },
        };
      }
    } else if (bloc.type === 'tool_use') {
      yield {
        type: 'content_block_start',
        index,
        content_block: { ...bloc, input: {} },
      };
      const json = JSON.stringify(bloc.input);
      for (let i = 0; i < json.length; i += 12) {
        yield {
          type: 'content_block_delta',
          index,
          delta: {
            type: 'input_json_delta',
            partial_json: json.slice(i, i + 12),
          },
        };
      }
    } else {
      yield { type: 'content_block_start', index, content_block: bloc };
    }
    yield { type: 'content_block_stop', index };
  }
}

const estimer = (texte: string) => Math.ceil(texte.length / 4);

export function creerModeleSimule(options: { pause?: number } = {}): Modele {
  const pause = options.pause ?? 25;
  return {
    nom: NOM_SIMULE,
    fournisseur: 'simulé',
    tour(requete: Requete): Tour {
      const contenu = repondre(requete);
      return {
        flux: (async function* () {
          for (const evenement of decouper(contenu)) {
            if (requete.signal?.aborted) return;
            if (pause > 0) await new Promise(r => setTimeout(r, pause));
            yield evenement;
          }
        })(),
        fin: async () => ({
          contenu,
          arret: contenu.some(b => b.type === 'tool_use')
            ? 'tool_use'
            : 'end_turn',
          modele: NOM_SIMULE,
          jetons: {
            entree: estimer(
              requete.systeme +
                requete.contexte +
                JSON.stringify(requete.messages)
            ),
            sortie: estimer(JSON.stringify(contenu)),
            lusEnCache: 0,
            ecritsEnCache: 0,
          },
        }),
      };
    },
  };
}

/**
 * L'AGENT (spécification 007). Une exécution AG-UI, du `RUN_STARTED` au
 * `RUN_FINISHED`, sans rien garder entre deux : tout ce qu'il sait arrive dans
 * l'entrée (`RunAgentInput`) — la conversation, les outils du navigateur, le
 * contexte de l'écran, l'état partagé.
 *
 * La boucle : le modèle parle ; s'il appelle son propre outil, `noter_depense`,
 * l'agent l'exécute, écrit l'état partagé par un correctif JSON
 * (`STATE_DELTA`) et rend la main au modèle ; s'il appelle un outil du
 * navigateur, l'exécution s'arrête là — c'est le client qui l'exécute, puis
 * relance une exécution avec le résultat dans la conversation.
 */
import {
  EventType,
  type BaseEvent,
  type RunAgentInput,
  type TokenUsage,
} from '@ag-ui/core';
import { z } from 'zod';
import {
  ErreurModele,
  type Jetons,
  type Modele,
  type Outil,
} from './modele.ts';
import {
  emballer,
  Traducteur,
  versModele,
  type MessageModele,
  type ResultatOutil,
} from './protocole.ts';

export const SYSTEME = `Tu es le copilote de Miss Devises, un convertisseur de devises qu'on emporte en voyage. Tu règles l'application à la place de l'utilisateur, et tu réponds avec ce qu'elle calcule.

Règles :
1. Tu ne calcules jamais un montant et tu n'inventes jamais un taux. Pour toute conversion, appelle l'outil convertir, puis donne le montant qu'il a rendu, avec la source et la date du taux. S'il n'a pas de taux, dis-le sans donner de chiffre.
2. Les devises s'écrivent en code ISO 4217 : yen JPY, livre égyptienne EGP, dollar des États-Unis USD.
3. Des frais de carte ou de banque (« 2 % de frais ») : appelle appliquer_frais avant convertir.
4. « Note », « ajoute une dépense » : appelle noter_depense, une fois par dépense, avec le montant dans la devise payée. Pour un total, lis celui que l'application a calculé dans le contexte.
5. Une photo : lis le prix et la devise qui y figurent, puis convertis. Si la devise ne se lit pas, demande-la.
6. Réponds dans la langue de l'utilisateur, en une ou deux phrases.`;

const Depense = z.object({
  libelle: z.string().trim().min(1).max(60),
  montant: z.number().positive().finite(),
  devise: z.string().regex(/^[A-Z]{3}$/),
});

/** Les outils que l'agent exécute lui-même. Ceux du navigateur arrivent dans l'entrée. */
export const OUTILS_SERVEUR: Outil[] = [
  {
    name: 'noter_depense',
    description:
      "Note une dépense du voyage dans la liste partagée avec l'application. Une dépense par appel. Le montant est celui payé, dans la devise payée : l'application le convertit elle-même.",
    input_schema: {
      type: 'object',
      properties: {
        libelle: {
          type: 'string',
          description:
            'Ce qui a été payé, en quelques mots : « taxi », « ramen ».',
        },
        montant: {
          type: 'number',
          description: 'Le montant payé, dans la devise payée.',
        },
        devise: {
          type: 'string',
          description: 'Code ISO 4217 de la devise payée, ex. JPY.',
        },
      },
      required: ['libelle', 'montant', 'devise'],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
];
const SERVEUR = new Set(OUTILS_SERVEUR.map(o => o.name));

/** Au-delà, une boucle sur l'outil de l'agent tourne en rond : on l'arrête. */
const TOURS_MAX = 6;

export interface OptionsExecution {
  signal?: AbortSignal;
  nouvelId?: () => string;
}

export async function* executer(
  entree: RunAgentInput,
  modele: Modele,
  options: OptionsExecution = {}
): AsyncGenerator<BaseEvent> {
  const nouvelId = options.nouvelId ?? (() => crypto.randomUUID());
  const { threadId, runId } = entree;
  yield {
    type: EventType.RUN_STARTED,
    threadId,
    runId,
    // AG-UI 1.0 : des métadonnées libres, de l'agent vers l'interface. Le
    // client affiche le modèle qui répond ; l'inspecteur le montre aussi.
    metadata: { modele: modele.nom, fournisseur: modele.fournisseur },
  };

  const etat = structuredClone(lireEtat(entree.state));
  const messages: MessageModele[] = versModele(entree.messages, modele.nom);
  const outils: Outil[] = [...entree.tools.map(versOutil), ...OUTILS_SERVEUR];
  const jetons = new Map<string, Jetons>();
  let traducteur: Traducteur | null = null;

  try {
    for (let tour = 1; tour <= TOURS_MAX; tour++) {
      const messageId = nouvelId();
      const etape = `${modele.nom}, tour ${tour}`;
      yield { type: EventType.STEP_STARTED, stepName: etape };

      const appel = modele.tour({
        systeme: SYSTEME,
        contexte: decrireContexte(entree.context, etat),
        messages,
        outils,
        signal: options.signal,
      });
      traducteur = new Traducteur(messageId, nouvelId);
      for await (const evenement of appel.flux) {
        yield* traducteur.traduire(evenement);
      }
      yield* traducteur.fermer();
      const fin = await appel.fin();
      cumuler(jetons, fin.modele, fin.jetons);

      // Le tour brut part chez le client, accroché au message de l'assistant ;
      // il reviendra dans l'entrée de la prochaine exécution (R4).
      if (traducteur.visible) {
        yield {
          type: EventType.REASONING_ENCRYPTED_VALUE,
          subtype: 'message',
          entityId: messageId,
          encryptedValue: emballer(fin.contenu, modele.nom),
        };
      }
      traducteur = null;
      yield { type: EventType.STEP_FINISHED, stepName: etape };

      if (fin.arret === 'refusal') {
        throw new ErreurModele(
          'Le modèle a refusé de répondre à cette demande.',
          'refus'
        );
      }
      const appels = fin.contenu.filter(b => b.type === 'tool_use');
      if (appels.length === 0) break;
      if (fin.arret === 'max_tokens') {
        throw new ErreurModele(
          'La réponse a été coupée avant la fin d’un appel d’outil.',
          'tronque'
        );
      }

      messages.push({ role: 'assistant', content: fin.contenu });
      const resultats: ResultatOutil[] = [];
      for (const outil of appels.filter(a => SERVEUR.has(a.name))) {
        const { contenu, correctif, erreur } = noterDepense(
          outil.input,
          etat,
          nouvelId
        );
        if (correctif) yield { type: EventType.STATE_DELTA, delta: correctif };
        yield {
          type: EventType.TOOL_CALL_RESULT,
          messageId: nouvelId(),
          toolCallId: outil.id,
          content: contenu,
          role: 'tool',
        };
        resultats.push({
          type: 'tool_result',
          tool_use_id: outil.id,
          content: contenu,
          ...(erreur ? { is_error: true } : {}),
        });
      }
      // Un outil du navigateur attend : le client l'exécutera, puis relancera.
      if (appels.some(a => !SERVEUR.has(a.name))) break;
      messages.push({ role: 'user', content: resultats });
    }
    yield {
      type: EventType.RUN_FINISHED,
      threadId,
      runId,
      usage: versUsage(jetons, modele.fournisseur),
    };
  } catch (erreur) {
    if (traducteur) yield* traducteur.fermer();
    if (options.signal?.aborted) return;
    yield {
      type: EventType.RUN_ERROR,
      message: erreur instanceof Error ? erreur.message : String(erreur),
      code: erreur instanceof ErreurModele ? erreur.code : 'erreur',
      usage: versUsage(jetons, modele.fournisseur),
    };
  }
}

interface EtatPartage {
  depenses: (z.infer<typeof Depense> & { id: string })[];
}

/** L'état reçu, réduit à ce que l'agent comprend : une liste de dépenses valides. */
function lireEtat(etat: unknown): EtatPartage {
  const lu = z
    .object({ depenses: z.array(Depense.extend({ id: z.string() })) })
    .safeParse(etat);
  return lu.success ? lu.data : { depenses: [] };
}

/**
 * L'outil de l'agent : il n'agit pas sur l'écran, il écrit l'état partagé. Le
 * correctif est un JSON Patch (RFC 6902) : `add /depenses/-` ajoute en fin de
 * liste, et le client applique le même correctif à sa copie.
 */
function noterDepense(
  entree: unknown,
  etat: EtatPartage,
  nouvelId: () => string
): {
  contenu: string;
  correctif?: { op: 'add'; path: string; value: unknown }[];
  erreur?: boolean;
} {
  const lu = Depense.safeParse(entree);
  if (!lu.success) {
    return {
      contenu: JSON.stringify({
        ok: false,
        raison: lu.error.issues
          .map(i => `${i.path.join('.')} : ${i.message}`)
          .join(' ; '),
      }),
      erreur: true,
    };
  }
  const depense = { id: nouvelId(), ...lu.data };
  etat.depenses.push(depense);
  return {
    contenu: JSON.stringify({ ok: true, depense }),
    correctif: [{ op: 'add', path: '/depenses/-', value: depense }],
  };
}

/** Un outil du navigateur, tel que le client le décrit, pour le modèle. */
function versOutil(outil: RunAgentInput['tools'][number]): Outil {
  const parametres =
    typeof outil.parameters === 'object' && outil.parameters !== null
      ? { ...outil.parameters }
      : {};
  delete (parametres as Record<string, unknown>).$schema;
  return {
    name: outil.name,
    description: outil.description,
    input_schema: { type: 'object', properties: {}, ...parametres },
    eager_input_streaming: true,
  };
}

/** Le contexte de l'écran et l'état partagé, en clair : la partie variable du prompt. */
export function decrireContexte(
  contexte: RunAgentInput['context'],
  etat: EtatPartage
): string {
  const lignes = contexte.map(c => `- ${c.description} : ${c.value}`);
  lignes.push(
    `- État partagé (dépenses notées par l'agent) : ${JSON.stringify(etat.depenses)}`
  );
  return `Ce que l'application montre maintenant (cela change à chaque tour) :\n${lignes.join('\n')}`;
}

function cumuler(jetons: Map<string, Jetons>, modele: string, tour: Jetons) {
  const avant = jetons.get(modele) ?? {
    entree: 0,
    sortie: 0,
    lusEnCache: 0,
    ecritsEnCache: 0,
  };
  jetons.set(modele, {
    entree: avant.entree + tour.entree,
    sortie: avant.sortie + tour.sortie,
    lusEnCache: avant.lusEnCache + tour.lusEnCache,
    ecritsEnCache: avant.ecritsEnCache + tour.ecritsEnCache,
  });
}

/**
 * Les jetons au format AG-UI : une entrée par modèle (un repli en ajoute une).
 * Le protocole compte le cache DANS `inputTokens` ; l'API d'Anthropic le
 * compte à part, d'où la somme.
 */
function versUsage(
  jetons: Map<string, Jetons>,
  fournisseur: string
): TokenUsage[] {
  return [...jetons].map(([modele, j]) => {
    const entree = j.entree + j.lusEnCache + j.ecritsEnCache;
    return {
      provider: fournisseur,
      model: modele,
      inputTokens: entree,
      outputTokens: j.sortie,
      totalTokens: entree + j.sortie,
      cachedInputTokens: j.lusEnCache,
      cacheWriteInputTokens: j.ecritsEnCache,
    };
  });
}

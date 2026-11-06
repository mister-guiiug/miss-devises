/**
 * LA TRADUCTION, DANS LES DEUX SENS (spécification 007, R2 et R4).
 *
 * Vers le client : le flux du modèle (celui du SDK Anthropic, ou celui que le
 * modèle simulé imite) devient une suite d'événements AG-UI. Un bloc de texte
 * donne `TEXT_MESSAGE_START`, `…_CONTENT`, `…_END` ; un `tool_use` donne
 * `TOOL_CALL_START`, `…_ARGS`, `…_END` ; un bloc de raisonnement donne
 * `REASONING_*`. C'est tout le protocole côté texte, et il tient ici.
 *
 * Vers le modèle : la conversation que le client renvoie à chaque exécution
 * (l'agent ne garde rien) redevient des messages du modèle. Le texte
 * reconstruit ne suffit pas à Claude : un tour qui appelait un outil doit lui
 * revenir tel qu'il l'a écrit, raisonnement signé compris. Ce tour brut voyage
 * donc chez le client, opaque, par `REASONING_ENCRYPTED_VALUE` (R4).
 */
import { EventType, type BaseEvent, type Message } from '@ag-ui/core';
import type Anthropic from '@anthropic-ai/sdk';

export type Flux = Anthropic.Beta.BetaRawMessageStreamEvent;
export type Bloc = Anthropic.Beta.BetaContentBlock;
export type BlocEnvoye = Anthropic.Beta.BetaContentBlockParam;
export type MessageModele = Anthropic.Beta.BetaMessageParam;
export type ResultatOutil = Anthropic.Beta.BetaToolResultBlockParam;
type BlocUtilisateur =
  Anthropic.Beta.BetaTextBlockParam | Anthropic.Beta.BetaImageBlockParam;

type Ouvert =
  | { genre: 'texte' }
  | { genre: 'pensee'; id: string; commence: boolean }
  | { genre: 'outil'; id: string }
  | { genre: 'autre' };

/**
 * Traduit UN tour du modèle. Tous les blocs visibles d'un tour appartiennent
 * au même message de l'assistant (`messageId`) : le texte, et les appels
 * d'outils par `parentMessageId`. Chaque bloc de raisonnement est un message
 * à part, de rôle `reasoning`, ouvert au premier morceau non vide : un
 * raisonnement masqué (`display: 'omitted'`) n'affiche pas de bulle vide.
 */
export class Traducteur {
  /** Le message de l'assistant existe chez le client : texte ou appel d'outil. */
  visible = false;
  private readonly ouverts = new Map<number, Ouvert>();

  constructor(
    private readonly messageId: string,
    private readonly nouvelId: () => string
  ) {}

  traduire(evenement: Flux): BaseEvent[] {
    switch (evenement.type) {
      case 'content_block_start':
        return this.debut(evenement.index, evenement.content_block);
      case 'content_block_delta':
        return this.morceau(evenement.index, evenement.delta);
      case 'content_block_stop':
        return this.fin(evenement.index);
      default:
        // `message_start`, `message_delta`, `message_stop` : la fin du tour et
        // les jetons se lisent dans le message final, pas dans le flux.
        return [];
    }
  }

  /** Ferme ce qui reste ouvert : un flux coupé ne laisse pas le client attendre. */
  fermer(): BaseEvent[] {
    return [...this.ouverts.keys()].flatMap(index => this.fin(index));
  }

  private debut(index: number, bloc: Bloc): BaseEvent[] {
    if (bloc.type === 'text') {
      this.visible = true;
      this.ouverts.set(index, { genre: 'texte' });
      return [
        {
          type: EventType.TEXT_MESSAGE_START,
          messageId: this.messageId,
          role: 'assistant',
        },
        ...this.morceau(index, { type: 'text_delta', text: bloc.text }),
      ];
    }
    if (bloc.type === 'thinking') {
      this.ouverts.set(index, {
        genre: 'pensee',
        id: this.nouvelId(),
        commence: false,
      });
      return this.morceau(index, {
        type: 'thinking_delta',
        thinking: bloc.thinking,
        estimated_tokens: null,
      });
    }
    if (bloc.type === 'tool_use') {
      this.visible = true;
      this.ouverts.set(index, { genre: 'outil', id: bloc.id });
      return [
        {
          type: EventType.TOOL_CALL_START,
          toolCallId: bloc.id,
          toolCallName: bloc.name,
          parentMessageId: this.messageId,
        },
      ];
    }
    // Raisonnement caviardé, repli d'un modèle à un autre : rien à montrer,
    // mais le bloc reste dans le tour brut que le client garde.
    this.ouverts.set(index, { genre: 'autre' });
    return [];
  }

  private morceau(
    index: number,
    delta: Anthropic.Beta.BetaRawContentBlockDelta
  ): BaseEvent[] {
    const ouvert = this.ouverts.get(index);
    if (!ouvert) return [];
    if (ouvert.genre === 'texte' && delta.type === 'text_delta' && delta.text) {
      return [
        {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: this.messageId,
          delta: delta.text,
        },
      ];
    }
    if (
      ouvert.genre === 'outil' &&
      delta.type === 'input_json_delta' &&
      delta.partial_json
    ) {
      return [
        {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: ouvert.id,
          delta: delta.partial_json,
        },
      ];
    }
    if (
      ouvert.genre === 'pensee' &&
      delta.type === 'thinking_delta' &&
      delta.thinking
    ) {
      const debut: BaseEvent[] = ouvert.commence
        ? []
        : [
            { type: EventType.REASONING_START, messageId: ouvert.id },
            {
              type: EventType.REASONING_MESSAGE_START,
              messageId: ouvert.id,
              role: 'reasoning',
            },
          ];
      ouvert.commence = true;
      return [
        ...debut,
        {
          type: EventType.REASONING_MESSAGE_CONTENT,
          messageId: ouvert.id,
          delta: delta.thinking,
        },
      ];
    }
    return [];
  }

  private fin(index: number): BaseEvent[] {
    const ouvert = this.ouverts.get(index);
    this.ouverts.delete(index);
    if (!ouvert) return [];
    switch (ouvert.genre) {
      case 'texte':
        return [
          { type: EventType.TEXT_MESSAGE_END, messageId: this.messageId },
        ];
      case 'outil':
        return [{ type: EventType.TOOL_CALL_END, toolCallId: ouvert.id }];
      case 'pensee':
        return ouvert.commence
          ? [
              { type: EventType.REASONING_MESSAGE_END, messageId: ouvert.id },
              { type: EventType.REASONING_END, messageId: ouvert.id },
            ]
          : [];
      default:
        return [];
    }
  }
}

const VERSION = 1;

/**
 * Le tour brut, pour le client. Il porte le modèle qui l'a écrit : un
 * raisonnement signé ne se rend qu'à lui (le modèle simulé signe « simule »,
 * Claude refuserait cette signature).
 */
export function emballer(contenu: readonly Bloc[], modele: string): string {
  return versBase64(JSON.stringify({ v: VERSION, modele, contenu }));
}

/** Base64 d'un texte UTF-8, sans `Buffer` : l'agent tourne dans le navigateur. */
function versBase64(texte: string): string {
  let binaire = '';
  for (const octet of new TextEncoder().encode(texte)) {
    binaire += String.fromCharCode(octet);
  }
  return btoa(binaire);
}

function depuisBase64(valeur: string): string {
  const binaire = atob(valeur);
  return new TextDecoder().decode(
    Uint8Array.from(binaire, caractere => caractere.charCodeAt(0))
  );
}

/**
 * Le tour brut rendu par le client, ou `null` s'il manque, s'il est illisible
 * ou s'il vient d'un autre modèle : on reconstruit alors depuis le texte et les
 * appels d'outils, sans raisonnement.
 */
export function deballer(
  valeur: string | undefined,
  modele: string
): BlocEnvoye[] | null {
  if (!valeur) return null;
  try {
    const lu: unknown = JSON.parse(depuisBase64(valeur));
    if (typeof lu !== 'object' || lu === null) return null;
    const { v, modele: auteur, contenu } = lu as Record<string, unknown>;
    if (v !== VERSION || auteur !== modele || !Array.isArray(contenu))
      return null;
    if (
      !contenu.every(
        b => typeof b === 'object' && b !== null && typeof b.type === 'string'
      )
    ) {
      return null;
    }
    return sansCeQuiPrecedeLeRepli(contenu as BlocEnvoye[]);
  } catch {
    return null;
  }
}

/**
 * Après un repli en cours de réponse (le classifieur a refusé, un autre modèle
 * a continué), le raisonnement et les appels d'outils d'AVANT le dernier bloc
 * `fallback` ne se renvoient pas ; le texte, si.
 */
function sansCeQuiPrecedeLeRepli(contenu: BlocEnvoye[]): BlocEnvoye[] {
  const repli = contenu.map(b => b.type).lastIndexOf('fallback');
  if (repli < 0) return contenu;
  const internes = new Set(['thinking', 'redacted_thinking', 'tool_use']);
  return contenu.filter((b, i) => i > repli || !internes.has(b.type));
}

/**
 * La conversation du client, pour le modèle. Les messages système, de
 * raisonnement et d'activité restent au client : l'agent a son propre
 * préambule, et le raisonnement revient par le tour brut.
 */
export function versModele(
  messages: readonly Message[],
  modele: string
): MessageModele[] {
  const sortie: MessageModele[] = [];
  let resultats: ResultatOutil[] = [];
  const poserResultats = (suite: BlocUtilisateur[] = []) => {
    if (resultats.length === 0) return false;
    sortie.push({ role: 'user', content: [...resultats, ...suite] });
    resultats = [];
    return true;
  };

  for (const message of messages) {
    if (message.role === 'tool') {
      // Tous les résultats d'un tour dans UN message : les répartir apprendrait
      // au modèle à ne plus appeler ses outils en parallèle.
      resultats.push({
        type: 'tool_result',
        tool_use_id: message.toolCallId,
        content: message.error ?? texteDe(message.content),
        ...(message.error ? { is_error: true } : {}),
      });
    } else if (message.role === 'user') {
      const contenu = contenuUtilisateur(message.content);
      if (!poserResultats(contenu))
        sortie.push({ role: 'user', content: contenu });
    } else if (message.role === 'assistant') {
      poserResultats();
      const contenu =
        deballer(message.encryptedValue, modele) ?? reconstruire(message);
      if (contenu.length > 0)
        sortie.push({ role: 'assistant', content: contenu });
    }
  }
  poserResultats();
  return reparer(sortie);
}

function texteDe(
  contenu: string | readonly { type: string; text?: string }[]
): string {
  if (typeof contenu === 'string') return contenu;
  return contenu
    .map(partie => (partie.type === 'text' ? (partie.text ?? '') : ''))
    .join('');
}

const IMAGES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function contenuUtilisateur(
  contenu: Extract<Message, { role: 'user' }>['content']
): BlocUtilisateur[] {
  if (typeof contenu === 'string')
    return [{ type: 'text', text: contenu || '…' }];
  const blocs = contenu.map((partie): BlocUtilisateur => {
    if (partie.type === 'text')
      return { type: 'text', text: partie.text || '…' };
    if (
      partie.type === 'image' &&
      partie.source.type === 'data' &&
      IMAGES.has(partie.source.mimeType)
    ) {
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: partie.source.mimeType as
            'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: partie.source.value,
        },
      };
    }
    if (
      partie.type === 'image' &&
      partie.source.type === 'url' &&
      /^https:\/\//.test(partie.source.value)
    ) {
      return {
        type: 'image',
        source: { type: 'url', url: partie.source.value },
      };
    }
    // Le modèle ne reçoit pas ce qu'il ne lit pas, mais il sait qu'il manque
    // quelque chose : il peut le dire au lieu de répondre à côté.
    return {
      type: 'text',
      text: `[pièce jointe « ${partie.type} » non transmise]`,
    };
  });
  return blocs.length > 0 ? blocs : [{ type: 'text', text: '…' }];
}

function reconstruire(
  message: Extract<Message, { role: 'assistant' }>
): BlocEnvoye[] {
  const blocs: BlocEnvoye[] = [];
  if (message.content) blocs.push({ type: 'text', text: message.content });
  for (const appel of message.toolCalls ?? []) {
    blocs.push({
      type: 'tool_use',
      id: appel.id,
      name: appel.function.name,
      input: lireArguments(appel.function.arguments),
    });
  }
  return blocs;
}

function lireArguments(texte: string): Record<string, unknown> {
  try {
    const lu: unknown = JSON.parse(texte || '{}');
    return typeof lu === 'object' && lu !== null && !Array.isArray(lu)
      ? (lu as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Ce que l'API refuserait, rendu acceptable : une conversation qui ne commence
 * pas par l'utilisateur, un appel d'outil resté sans résultat (une exécution
 * interrompue), un résultat dont l'appel a disparu.
 */
function reparer(messages: MessageModele[]): MessageModele[] {
  const debut = messages.findIndex(m => m.role === 'user');
  if (debut < 0) return [];
  const sortie: MessageModele[] = [];
  let attendus: string[] = [];
  for (const message of messages.slice(debut)) {
    if (message.role === 'assistant') {
      if (attendus.length > 0)
        sortie.push({ role: 'user', content: sansResultat(attendus) });
      attendus = idsDesAppels(message);
      sortie.push(message);
      continue;
    }
    const blocs =
      typeof message.content === 'string'
        ? [{ type: 'text' as const, text: message.content }]
        : (message.content ?? []);
    const resultats = blocs.filter(
      (b): b is ResultatOutil =>
        b.type === 'tool_result' && attendus.includes(b.tool_use_id)
    );
    const autres = blocs.filter(b => b.type !== 'tool_result');
    const recus = new Set(resultats.map(r => r.tool_use_id));
    const manquants = sansResultat(attendus.filter(id => !recus.has(id)));
    attendus = [];
    const contenu = [...resultats, ...manquants, ...autres];
    if (contenu.length > 0) sortie.push({ role: 'user', content: contenu });
  }
  return sortie;
}

function idsDesAppels(message: MessageModele): string[] {
  if (typeof message.content === 'string') return [];
  return (message.content ?? []).flatMap(b =>
    b.type === 'tool_use' ? [b.id] : []
  );
}

function sansResultat(ids: string[]): ResultatOutil[] {
  return ids.map(id => ({
    type: 'tool_result',
    tool_use_id: id,
    is_error: true,
    content: 'Aucun résultat reçu : l’exécution a été interrompue.',
  }));
}

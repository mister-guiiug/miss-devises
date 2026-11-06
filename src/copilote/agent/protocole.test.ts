import { describe, expect, it } from 'vitest';
import { EventType, type Message } from '@ag-ui/core';
import { EventSchema } from '@ag-ui/core/schemas';
import {
  deballer,
  emballer,
  Traducteur,
  versModele,
  type Bloc,
  type Flux,
} from './protocole.ts';

const ids = () => {
  let n = 0;
  return () => `id-${String(++n)}`;
};

function traduire(flux: Flux[]) {
  const traducteur = new Traducteur('msg-1', ids());
  const evenements = flux.flatMap(e => traducteur.traduire(e));
  return { evenements, traducteur };
}

const debut = (index: number, content_block: Bloc): Flux => ({
  type: 'content_block_start',
  index,
  content_block,
});
const fin = (index: number): Flux => ({ type: 'content_block_stop', index });
const texte = (index: number, text: string): Flux => ({
  type: 'content_block_delta',
  index,
  delta: { type: 'text_delta', text },
});

describe('le flux du modèle devient des événements AG-UI', () => {
  it('raisonnement, texte puis appel d’outil : chaque bloc s’ouvre, coule et se ferme', () => {
    const { evenements, traducteur } = traduire([
      debut(0, { type: 'thinking', thinking: '', signature: '' }),
      {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'thinking_delta',
          thinking: 'Un montant.',
          estimated_tokens: null,
        },
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'signature_delta', signature: 'sig' },
      },
      fin(0),
      debut(1, { type: 'text', text: '', citations: null }),
      texte(1, 'Je '),
      texte(1, 'convertis.'),
      fin(1),
      debut(2, {
        type: 'tool_use',
        id: 'toolu_1',
        name: 'convertir',
        input: {},
      }),
      {
        type: 'content_block_delta',
        index: 2,
        delta: { type: 'input_json_delta', partial_json: '{"montant":' },
      },
      {
        type: 'content_block_delta',
        index: 2,
        delta: { type: 'input_json_delta', partial_json: '1200}' },
      },
      fin(2),
    ]);

    expect(evenements.map(e => e.type)).toEqual([
      EventType.REASONING_START,
      EventType.REASONING_MESSAGE_START,
      EventType.REASONING_MESSAGE_CONTENT,
      EventType.REASONING_MESSAGE_END,
      EventType.REASONING_END,
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
    ]);
    // Le texte et l'appel appartiennent au même message ; le raisonnement est à part.
    expect(evenements[5]).toMatchObject({
      messageId: 'msg-1',
      role: 'assistant',
    });
    expect(evenements[9]).toMatchObject({
      toolCallId: 'toolu_1',
      toolCallName: 'convertir',
      parentMessageId: 'msg-1',
    });
    expect(evenements[0]).toMatchObject({ messageId: 'id-1' });
    expect(traducteur.visible).toBe(true);
    // Chaque événement respecte le schéma du protocole.
    for (const evenement of evenements)
      expect(EventSchema.safeParse(evenement).success).toBe(true);
  });

  it('un raisonnement masqué (sans texte) n’ouvre aucune bulle', () => {
    const { evenements, traducteur } = traduire([
      debut(0, { type: 'thinking', thinking: '', signature: '' }),
      {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'signature_delta', signature: 'sig' },
      },
      fin(0),
    ]);
    expect(evenements).toEqual([]);
    expect(traducteur.visible).toBe(false);
  });

  it('un flux coupé se ferme : le client n’attend pas une fin qui ne viendra pas', () => {
    const traducteur = new Traducteur('msg-1', ids());
    traducteur.traduire(debut(0, { type: 'text', text: '', citations: null }));
    traducteur.traduire(texte(0, 'Je'));
    expect(traducteur.fermer()).toEqual([
      { type: EventType.TEXT_MESSAGE_END, messageId: 'msg-1' },
    ]);
    expect(traducteur.fermer()).toEqual([]);
  });
});

describe('le tour brut voyage chez le client (R4)', () => {
  const contenu: Bloc[] = [
    { type: 'thinking', thinking: 'Un montant.', signature: 'sig' },
    {
      type: 'tool_use',
      id: 'toolu_1',
      name: 'convertir',
      input: { montant: 1200 },
    },
  ];

  it('revient tel quel au même modèle', () => {
    expect(
      deballer(emballer(contenu, 'claude-opus-5-5'), 'claude-opus-5-5')
    ).toEqual(contenu);
  });

  it('ne revient pas à un autre modèle : sa signature ne vaudrait rien', () => {
    expect(deballer(emballer(contenu, 'simulé'), 'claude-opus-5-5')).toBeNull();
  });

  it('illisible ou absent, il laisse reconstruire', () => {
    expect(deballer(undefined, 'simulé')).toBeNull();
    expect(deballer('pas du base64 json', 'simulé')).toBeNull();
  });

  it('après un repli, le raisonnement et les appels d’avant le repli ne reviennent pas', () => {
    const replie = [
      { type: 'thinking', thinking: '', signature: 'a' },
      { type: 'text', text: 'Début. ', citations: null },
      { type: 'fallback', from: { model: 'a' }, to: { model: 'b' } },
      { type: 'text', text: 'Suite.', citations: null },
    ] as unknown as Bloc[];
    expect(deballer(emballer(replie, 'm'), 'm')?.map(b => b.type)).toEqual([
      'text',
      'fallback',
      'text',
    ]);
  });
});

describe('la conversation du client redevient celle du modèle', () => {
  it('reconstruit un tour sans tour brut, et regroupe les résultats d’outils', () => {
    const messages: Message[] = [
      { id: 'u1', role: 'user', content: '1200 JPY et 2 % de frais' },
      {
        id: 'a1',
        role: 'assistant',
        content: 'Je m’en occupe.',
        toolCalls: [
          {
            id: 't1',
            type: 'function',
            function: {
              name: 'appliquer_frais',
              arguments: '{"pourcentage":2}',
            },
          },
          {
            id: 't2',
            type: 'function',
            function: {
              name: 'convertir',
              arguments: '{"montant":1200,"devise":"JPY"}',
            },
          },
        ],
      },
      { id: 'r1', role: 'tool', toolCallId: 't1', content: '{"ok":true}' },
      { id: 'r2', role: 'tool', toolCallId: 't2', content: '{"ok":true}' },
    ];
    expect(versModele(messages, 'simulé')).toEqual([
      {
        role: 'user',
        content: [{ type: 'text', text: '1200 JPY et 2 % de frais' }],
      },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Je m’en occupe.' },
          {
            type: 'tool_use',
            id: 't1',
            name: 'appliquer_frais',
            input: { pourcentage: 2 },
          },
          {
            type: 'tool_use',
            id: 't2',
            name: 'convertir',
            input: { montant: 1200, devise: 'JPY' },
          },
        ],
      },
      {
        role: 'user',
        content: [
          { type: 'tool_result', tool_use_id: 't1', content: '{"ok":true}' },
          { type: 'tool_result', tool_use_id: 't2', content: '{"ok":true}' },
        ],
      },
    ]);
  });

  it('rejoue le tour brut à la place du texte reconstruit', () => {
    const brut: Bloc[] = [
      { type: 'thinking', thinking: 'x', signature: 'sig' },
      { type: 'tool_use', id: 't1', name: 'convertir', input: {} },
    ];
    const messages: Message[] = [
      { id: 'u1', role: 'user', content: '1200 JPY' },
      {
        id: 'a1',
        role: 'assistant',
        encryptedValue: emballer(brut, 'claude-opus-5-5'),
        toolCalls: [
          {
            id: 't1',
            type: 'function',
            function: { name: 'convertir', arguments: '{}' },
          },
        ],
      },
      { id: 'r1', role: 'tool', toolCallId: 't1', content: 'ok' },
    ];
    expect(versModele(messages, 'claude-opus-5-5')[1]).toEqual({
      role: 'assistant',
      content: brut,
    });
  });

  it('un appel sans résultat en reçoit un, en erreur ; un résultat orphelin disparaît', () => {
    const messages: Message[] = [
      { id: 'u1', role: 'user', content: '1200 JPY' },
      {
        id: 'a1',
        role: 'assistant',
        toolCalls: [
          {
            id: 't1',
            type: 'function',
            function: { name: 'convertir', arguments: '{}' },
          },
        ],
      },
      { id: 'u2', role: 'user', content: 'Laisse tomber.' },
      { id: 'r9', role: 'tool', toolCallId: 'inconnu', content: 'ok' },
    ];
    const sortie = versModele(messages, 'simulé');
    expect(sortie[2]).toEqual({
      role: 'user',
      content: [
        expect.objectContaining({
          type: 'tool_result',
          tool_use_id: 't1',
          is_error: true,
        }),
        { type: 'text', text: 'Laisse tomber.' },
      ],
    });
    expect(sortie).toHaveLength(3);
  });

  it('une image jointe devient un bloc image ; ce qu’il ne lit pas, il le sait absent', () => {
    const messages: Message[] = [
      {
        id: 'u1',
        role: 'user',
        content: [
          { type: 'text', text: 'Combien ?' },
          {
            type: 'image',
            source: { type: 'data', value: 'AAAA', mimeType: 'image/png' },
          },
          {
            type: 'audio',
            source: { type: 'data', value: 'BBBB', mimeType: 'audio/wav' },
          },
        ],
      },
    ];
    expect(versModele(messages, 'simulé')).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Combien ?' },
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: 'AAAA' },
          },
          { type: 'text', text: '[pièce jointe « audio » non transmise]' },
        ],
      },
    ]);
  });

  it('les messages système et de raisonnement restent au client ; un assistant en tête tombe', () => {
    const messages: Message[] = [
      { id: 'a0', role: 'assistant', content: 'Bonjour !' },
      { id: 's1', role: 'system', content: 'Autre consigne' },
      { id: 'u1', role: 'user', content: 'Salut' },
      { id: 'g1', role: 'reasoning', content: 'je pense' },
    ];
    expect(versModele(messages, 'simulé')).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'Salut' }] },
    ]);
  });
});

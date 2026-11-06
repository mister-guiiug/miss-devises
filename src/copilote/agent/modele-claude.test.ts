/**
 * Claude avec la clé du visiteur, éprouvé SANS réseau : un faux `fetch` reçoit
 * la requête que le navigateur enverrait à l'API d'Anthropic, et répond par un
 * flux SSE écrit à la main. On vérifie ce qui part (adresse, clé, en-têtes,
 * corps) et que la réponse revient en événements AG-UI.
 */
import { describe, expect, it } from 'vitest';
import { EventType, type BaseEvent } from '@ag-ui/core';
import { executer } from './agent.ts';
import { creerModeleClaude } from './modele-claude.ts';

const CLE = 'sk-ant-test-cle-de-demonstration-0000000000';

function sse(evenements: Record<string, unknown>[]): string {
  return evenements
    .map(e => `event: ${String(e.type)}\ndata: ${JSON.stringify(e)}\n\n`)
    .join('');
}

const REPONSE = sse([
  {
    type: 'message_start',
    message: {
      id: 'msg_1',
      type: 'message',
      role: 'assistant',
      model: 'claude-opus-5-5',
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: {
        input_tokens: 120,
        output_tokens: 1,
        cache_read_input_tokens: 80,
      },
    },
  },
  {
    type: 'content_block_start',
    index: 0,
    content_block: { type: 'text', text: '', citations: null },
  },
  {
    type: 'content_block_delta',
    index: 0,
    delta: { type: 'text_delta', text: 'Bonjour.' },
  },
  { type: 'content_block_stop', index: 0 },
  {
    type: 'message_delta',
    delta: { stop_reason: 'end_turn', stop_sequence: null },
    usage: { output_tokens: 4 },
  },
  { type: 'message_stop' },
]);

function fauxReseau(statut = 200, corps = REPONSE) {
  const appels: {
    url: string;
    entetes: Headers;
    corps: Record<string, unknown>;
  }[] = [];
  const fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    appels.push({
      url: String(url),
      entetes: new Headers(init?.headers),
      corps: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    return new Response(corps, {
      status: statut,
      headers: {
        'content-type':
          statut === 200 ? 'text/event-stream' : 'application/json',
      },
    });
  }) as typeof globalThis.fetch;
  return { fetch, appels };
}

async function tout(modele: ReturnType<typeof creerModeleClaude>) {
  const evenements: BaseEvent[] = [];
  for await (const e of executer(
    {
      threadId: 't',
      runId: 'r',
      messages: [{ id: 'u1', role: 'user', content: 'Bonjour' }],
      tools: [
        {
          name: 'convertir',
          description: 'Convertit.',
          parameters: { type: 'object', properties: {} },
        },
      ],
      context: [],
    },
    modele
  )) {
    evenements.push(e);
  }
  return evenements;
}

describe('Claude avec la clé du visiteur (BYOK)', () => {
  it('appelle l’API d’Anthropic depuis le navigateur, avec la clé et le repli', async () => {
    const { fetch, appels } = fauxReseau();
    const evenements = await tout(
      creerModeleClaude({
        modele: 'claude-opus-5-5',
        effort: 'low',
        cle: CLE,
        fetch,
      })
    );

    expect(appels).toHaveLength(1);
    const [appel] = appels;
    expect(appel?.url).toMatch(/^https:\/\/api\.anthropic\.com\/v1\/messages/);
    // Le SDK 1.6 (version d'API 2026-10-21) passe la clé en `Authorization`.
    expect(appel?.entetes.get('authorization')).toBe(`Bearer ${CLE}`);
    expect(
      appel?.entetes.get('anthropic-dangerous-direct-browser-access')
    ).toBe('true');
    expect(appel?.entetes.get('anthropic-beta')).toContain(
      'server-side-fallback-2026-07-01'
    );
    expect(appel?.corps).toMatchObject({
      model: 'claude-opus-5-5',
      stream: true,
      fallbacks: 'default',
      thinking: { type: 'adaptive', display: 'summarized' },
      output_config: { effort: 'low' },
      tools: [
        expect.objectContaining({
          name: 'convertir',
          eager_input_streaming: true,
        }),
        expect.objectContaining({ name: 'noter_depense' }),
      ],
    });
    // La clé ne part QUE dans l'en-tête : ni dans le corps, ni dans les événements.
    expect(JSON.stringify(appel?.corps)).not.toContain(CLE);
    expect(JSON.stringify(evenements)).not.toContain(CLE);

    expect(evenements.map(e => e.type)).toContain(
      EventType.TEXT_MESSAGE_CONTENT
    );
    expect(evenements.at(-1)).toMatchObject({
      type: EventType.RUN_FINISHED,
      usage: [
        {
          provider: 'anthropic',
          model: 'claude-opus-5-5',
          inputTokens: 200,
          outputTokens: 4,
          cachedInputTokens: 80,
        },
      ],
    });
  });

  it('sans repli pour Claude Haiku 5.5, qui n’en a pas', async () => {
    const { fetch, appels } = fauxReseau();
    await tout(
      creerModeleClaude({
        modele: 'claude-haiku-5-5',
        effort: 'low',
        cle: CLE,
        fetch,
      })
    );
    expect(appels[0]?.corps).not.toHaveProperty('fallbacks');
    expect(appels[0]?.entetes.get('anthropic-beta') ?? '').not.toContain(
      'server-side-fallback'
    );
  });

  it('une clé refusée devient RUN_ERROR « cle », qui dit où la corriger', async () => {
    const { fetch } = fauxReseau(
      401,
      JSON.stringify({
        type: 'error',
        error: { type: 'authentication_error', message: 'invalid x-api-key' },
      })
    );
    const evenements = await tout(
      creerModeleClaude({
        modele: 'claude-opus-5-5',
        effort: 'low',
        cle: CLE,
        fetch,
      })
    );
    expect(evenements.at(-1)).toMatchObject({
      type: EventType.RUN_ERROR,
      code: 'cle',
      message: expect.stringContaining('onglet « Modèle »'),
    });
  });

  it('une demande refusée garde le détail de l’API, sans préfixe : la conversation l’encadre', async () => {
    const { fetch } = fauxReseau(
      400,
      JSON.stringify({
        type: 'error',
        error: { type: 'invalid_request_error', message: 'prompt is too long' },
      })
    );
    const evenements = await tout(
      creerModeleClaude({
        modele: 'claude-opus-5-5',
        effort: 'low',
        cle: CLE,
        fetch,
      })
    );
    const erreur = evenements.at(-1) as { code?: string; message?: string };
    expect(erreur.code).toBe('demande');
    // Le statut et le texte de l'API, et rien de français autour.
    expect(erreur.message).toMatch(/^400 .*prompt is too long/);
  });
});

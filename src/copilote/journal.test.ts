import { describe, expect, it } from 'vitest';
import { EventType, type BaseEvent, type RunAgentInput } from '@ag-ui/core';
import {
  alleger,
  demarrer,
  echouer,
  famille,
  journalVide,
  recevoir,
  resumer,
} from './journal.ts';

const entree = (runId: string): RunAgentInput => ({
  threadId: 't',
  runId,
  messages: [{ id: 'u1', role: 'user', content: '1200 JPY' }],
  tools: [{ name: 'convertir', description: '' }],
  context: [{ description: 'Écran', value: '{}' }],
  state: { depenses: [] },
});

describe('le journal de l’inspecteur', () => {
  it('range les événements par exécution, avec leur instant relatif et un compte par type', () => {
    let j = demarrer(journalVide(), entree('r1'), 1000);
    const flux: [BaseEvent, number][] = [
      [
        {
          type: EventType.RUN_STARTED,
          threadId: 't',
          runId: 'r1',
          metadata: { modele: 'simulé' },
        },
        1005,
      ],
      [
        {
          type: EventType.TEXT_MESSAGE_START,
          messageId: 'm1',
          role: 'assistant',
        },
        1010,
      ],
      [
        {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: 'm1',
          delta: 'Bonjour',
        },
        1012,
      ],
      [
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'm1', delta: ' !' },
        1013,
      ],
      [{ type: EventType.TEXT_MESSAGE_END, messageId: 'm1' }, 1014],
      [
        {
          type: EventType.RUN_FINISHED,
          threadId: 't',
          runId: 'r1',
          usage: [{ model: 'simulé', inputTokens: 40, outputTokens: 5 }],
        },
        1020,
      ],
    ];
    for (const [e, t] of flux) j = recevoir(j, e, t);

    expect(j.executions).toHaveLength(1);
    const [execution] = j.executions;
    expect(execution).toMatchObject({
      runId: 'r1',
      modele: 'simulé',
      issue: 'fini',
    });
    expect(execution?.entree).toMatchObject({
      messages: 1,
      roles: ['user'],
      outils: ['convertir'],
      contexte: 1,
    });
    expect(execution?.lignes.map(l => [l.type, l.ecart])).toEqual([
      ['RUN_STARTED', 5],
      ['TEXT_MESSAGE_START', 10],
      ['TEXT_MESSAGE_CONTENT', 12],
      ['TEXT_MESSAGE_CONTENT', 13],
      ['TEXT_MESSAGE_END', 14],
      ['RUN_FINISHED', 20],
    ]);
    expect(execution?.usage).toEqual([
      { model: 'simulé', inputTokens: 40, outputTokens: 5 },
    ]);
    expect(j.compte).toMatchObject({ TEXT_MESSAGE_CONTENT: 2, RUN_STARTED: 1 });
    expect(j.total).toBe(6);
  });

  it('une seconde exécution ouvre un second groupe', () => {
    let j = demarrer(journalVide(), entree('r1'), 0);
    j = recevoir(
      j,
      { type: EventType.RUN_FINISHED, threadId: 't', runId: 'r1' },
      1
    );
    j = demarrer(j, entree('r2'), 2);
    j = recevoir(
      j,
      { type: EventType.RUN_STARTED, threadId: 't', runId: 'r2' },
      3
    );
    expect(j.executions.map(e => [e.runId, e.lignes.length, e.issue])).toEqual([
      ['r1', 1, 'fini'],
      ['r2', 1, 'en-cours'],
    ]);
  });

  it('un échec du client clôt l’exécution en erreur', () => {
    let j = demarrer(journalVide(), entree('r1'), 0);
    j = echouer(j, 'Failed to fetch', 50);
    expect(j.executions[0]).toMatchObject({ issue: 'erreur' });
    expect(j.executions[0]?.lignes[0]).toMatchObject({
      type: 'ECHEC_DU_CLIENT',
      famille: 'erreur',
      resume: 'Failed to fetch',
    });
  });

  it('résume chaque famille d’événements en une ligne', () => {
    expect(
      resumer({
        type: EventType.TOOL_CALL_START,
        toolCallId: 'toolu_1',
        toolCallName: 'convertir',
      })
    ).toBe('convertir (toolu_1)');
    expect(
      resumer({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: 'toolu_1',
        delta: '{"montant":',
      })
    ).toBe('"{\\"montant\\":"');
    expect(
      resumer({
        type: EventType.STATE_DELTA,
        delta: [{ op: 'add', path: '/depenses/-', value: {} }],
      })
    ).toBe('add /depenses/-');
    expect(
      resumer({ type: EventType.RUN_ERROR, message: 'Clé absente.' })
    ).toBe('Clé absente.');
    expect(famille('REASONING_MESSAGE_CONTENT')).toBe('raisonnement');
    expect(famille('STEP_STARTED')).toBe('execution');
  });

  it('raccourcit une longue chaîne (une photo, un tour brut) en disant sa longueur', () => {
    const allege = alleger({
      source: { value: 'A'.repeat(1000) },
      court: 'ok',
    }) as { source: { value: string }; court: string };
    expect(allege.court).toBe('ok');
    expect(allege.source.value).toMatch(/^A{120}… \(1000 caractères\)$/);
  });
});

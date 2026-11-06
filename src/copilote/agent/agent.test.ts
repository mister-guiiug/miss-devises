/**
 * L'agent, éprouvé par le VRAI client AG-UI : un `AbstractAgent` dont `run`
 * renvoie les événements de `executer`. Le client les vérifie (ordre, ouvertures
 * et fermetures) et les applique (messages, état) exactement comme dans le
 * navigateur. Ce que ces tests voient est donc ce que CopilotKit verra.
 */
import { describe, expect, it } from 'vitest';
import { from, type Observable } from 'rxjs';
import {
  AbstractAgent,
  EventType,
  type BaseEvent,
  type Message,
  type RunAgentInput,
  type Tool,
} from '@ag-ui/client';
import { EventSchema } from '@ag-ui/core/schemas';
import { executer } from './agent.ts';
import { creerModeleSimule, decouper } from './modele-simule.ts';
import { ErreurModele, type Modele, type Requete } from './modele.ts';
import type { Bloc } from './protocole.ts';

class AgentLocal extends AbstractAgent {
  readonly recus: BaseEvent[] = [];
  readonly requetes: Requete[] = [];
  constructor(private readonly modele: Modele) {
    super({ initialState: { depenses: [] } });
  }
  run(input: RunAgentInput): Observable<BaseEvent> {
    const espion: Modele = {
      ...this.modele,
      tour: requete => {
        this.requetes.push(requete);
        return this.modele.tour(requete);
      },
    };
    const recus = this.recus;
    return from(
      (async function* () {
        for await (const evenement of executer(input, espion)) {
          recus.push(evenement);
          yield evenement;
        }
      })()
    );
  }
}

const CONVERTIR: Tool = {
  name: 'convertir',
  description: 'Convertit un montant.',
  parameters: {
    type: 'object',
    properties: { montant: { type: 'number' }, devise: { type: 'string' } },
  },
};

const utilisateur = (content: string): Message => ({
  id: crypto.randomUUID(),
  role: 'user',
  content,
});

describe('une exécution AG-UI de bout en bout', () => {
  it('« note un taxi » : outil de l’agent, correctif d’état, puis la réponse', async () => {
    const agent = new AgentLocal(creerModeleSimule({ pause: 0 }));
    agent.addMessage(utilisateur('note un taxi à 3000 yens'));
    await agent.runAgent();

    // L'état partagé, appliqué par le client à partir du STATE_DELTA.
    expect(agent.state).toEqual({
      depenses: [
        expect.objectContaining({
          libelle: 'taxi',
          montant: 3000,
          devise: 'JPY',
        }),
      ],
    });
    expect(
      agent.recus.find(e => e.type === EventType.STATE_DELTA)
    ).toMatchObject({
      delta: [{ op: 'add', path: '/depenses/-' }],
    });
    // La conversation : l'appel, son résultat (rendu par l'agent), puis le texte.
    expect(agent.messages.map(m => m.role)).toEqual([
      'user',
      'reasoning',
      'assistant',
      'tool',
      'assistant',
    ]);
    const appel = agent.messages[2] as Extract<Message, { role: 'assistant' }>;
    expect(appel.toolCalls?.[0]?.function.name).toBe('noter_depense');
    expect(appel.encryptedValue).toEqual(expect.any(String));
    expect(agent.messages.at(-1)).toMatchObject({
      content: 'C’est noté : taxi.',
    });
    // Le protocole : un début, une fin, et des métadonnées et des jetons.
    expect(agent.recus[0]).toMatchObject({
      type: EventType.RUN_STARTED,
      metadata: { modele: 'simulé' },
    });
    expect(agent.recus.at(-1)).toMatchObject({
      type: EventType.RUN_FINISHED,
      usage: [{ model: 'simulé' }],
    });
    for (const evenement of agent.recus)
      expect(EventSchema.safeParse(evenement).success).toBe(true);
  });

  it('un outil du navigateur : l’exécution s’arrête sur l’appel, la suivante lit le résultat', async () => {
    const agent = new AgentLocal(creerModeleSimule({ pause: 0 }));
    agent.addMessage(utilisateur('un ramen à 1 200 yens'));
    await agent.runAgent({ tools: [CONVERTIR] });

    expect(agent.recus.some(e => e.type === EventType.TOOL_CALL_RESULT)).toBe(
      false
    );
    const appel = agent.messages.at(-1) as Extract<
      Message,
      { role: 'assistant' }
    >;
    const outil = appel.toolCalls?.[0];
    expect(outil?.function.name).toBe('convertir');
    expect(JSON.parse(outil?.function.arguments ?? '')).toEqual({
      montant: 1200,
      devise: 'JPY',
    });

    // Le client exécute l'outil, ajoute le résultat, et relance.
    agent.addMessage({
      id: 'r1',
      role: 'tool',
      toolCallId: outil?.id ?? '',
      content: JSON.stringify({
        ok: true,
        saisi: '1 200 JPY',
        resultats: [{ texte: '7,39 €', source: 'BCE', date: '06/11/2026' }],
      }),
    });
    await agent.runAgent({ tools: [CONVERTIR] });
    expect(agent.messages.at(-1)).toMatchObject({
      content:
        'D’après l’application : 1 200 JPY font 7,39 € (taux BCE, 06/11/2026).',
    });

    // Le tour brut est revenu par le client : le modèle a revu son raisonnement signé.
    const revu = agent.requetes.at(-1)?.messages[1];
    expect(revu).toMatchObject({
      role: 'assistant',
      content: expect.arrayContaining([
        expect.objectContaining({ type: 'thinking', signature: 'simule' }),
      ]),
    });
  });

  it('un tour sans texte (raisonnement puis appel) garde son message, et son tour brut revient', async () => {
    // Claude répond souvent ainsi : un raisonnement signé, puis l'appel, sans
    // une phrase avant. Le modèle simulé, lui, écrit toujours une phrase.
    const muet: Modele = {
      nom: 'muet',
      fournisseur: 'test',
      tour: requete => {
        const relance = requete.messages.length > 1;
        const contenu: Bloc[] = relance
          ? [{ type: 'text', text: 'Fait.', citations: null }]
          : [
              { type: 'thinking', thinking: 'Je convertis.', signature: 'sig' },
              {
                type: 'tool_use',
                id: 'toolu_muet',
                name: 'convertir',
                input: { montant: 1200, devise: 'JPY' },
              },
            ];
        return {
          flux: (async function* () {
            yield* decouper(contenu);
          })(),
          fin: async () => ({
            contenu,
            arret: relance ? 'end_turn' : 'tool_use',
            modele: 'muet',
            jetons: { entree: 1, sortie: 1, lusEnCache: 0, ecritsEnCache: 0 },
          }),
        };
      },
    };
    const agent = new AgentLocal(muet);
    agent.addMessage(utilisateur('1200 JPY'));
    await agent.runAgent({ tools: [CONVERTIR] });

    // Aucun `TEXT_MESSAGE_START` : c'est `TOOL_CALL_START` qui, par son
    // `parentMessageId`, fait créer au client le message de l'assistant (AG-UI
    // le prévoit). Le message existe donc, porte l'appel ET le tour brut.
    expect(agent.recus.some(e => e.type === EventType.TEXT_MESSAGE_START)).toBe(
      false
    );
    expect(agent.messages.map(m => m.role)).toEqual([
      'user',
      'reasoning',
      'assistant',
    ]);
    const appel = agent.messages[2] as Extract<Message, { role: 'assistant' }>;
    expect(
      agent.recus.find(e => e.type === EventType.TOOL_CALL_START)
    ).toMatchObject({ parentMessageId: appel.id });
    expect(appel.toolCalls?.[0]?.id).toBe('toolu_muet');
    expect(appel.encryptedValue).toEqual(expect.any(String));

    agent.addMessage({
      id: 'r1',
      role: 'tool',
      toolCallId: 'toolu_muet',
      content: '{"ok":true}',
    });
    await agent.runAgent({ tools: [CONVERTIR] });
    // Le raisonnement signé est revenu au modèle, tel qu'il l'avait écrit.
    expect(agent.requetes.at(-1)?.messages[1]).toMatchObject({
      role: 'assistant',
      content: [
        { type: 'thinking', signature: 'sig' },
        { type: 'tool_use', id: 'toolu_muet' },
      ],
    });
    for (const evenement of agent.recus)
      expect(EventSchema.safeParse(evenement).success).toBe(true);
  });

  it('le contexte de l’écran et l’état partagé arrivent au modèle, hors du préambule fixe', async () => {
    const agent = new AgentLocal(creerModeleSimule({ pause: 0 }));
    agent.addMessage(utilisateur('combien ai-je dépensé ?'));
    await agent.runAgent({
      context: [
        {
          description: 'Dépenses converties',
          value: '{"totalTexte":"25,10 €"}',
        },
      ],
    });
    const requete = agent.requetes[0];
    expect(requete?.contexte).toContain(
      'Dépenses converties : {"totalTexte":"25,10 €"}'
    );
    expect(requete?.systeme).not.toContain('25,10');
    expect(agent.messages.at(-1)).toMatchObject({
      content: 'D’après l’application, vos dépenses notées font 25,10 €.',
    });
  });

  it('une panne du modèle devient RUN_ERROR, avec son code', async () => {
    const enPanne: Modele = {
      nom: 'en-panne',
      fournisseur: 'test',
      tour: () => ({
        flux: (async function* () {})(),
        fin: () => Promise.reject(new ErreurModele('Clé absente.', 'cle')),
      }),
    };
    const evenements: BaseEvent[] = [];
    for await (const e of executer(
      {
        threadId: 't',
        runId: 'r',
        messages: [utilisateur('1200 JPY')],
        tools: [],
        context: [],
      },
      enPanne
    )) {
      evenements.push(e);
    }
    expect(evenements.at(-1)).toMatchObject({
      type: EventType.RUN_ERROR,
      message: 'Clé absente.',
      code: 'cle',
    });
  });

  it('un refus du modèle arrête l’exécution sur RUN_ERROR « refus »', async () => {
    const refuse: Modele = {
      nom: 'refuse',
      fournisseur: 'test',
      tour: () => ({
        flux: (async function* () {})(),
        fin: async () => ({
          contenu: [],
          arret: 'refusal',
          modele: 'refuse',
          jetons: { entree: 1, sortie: 0, lusEnCache: 0, ecritsEnCache: 0 },
        }),
      }),
    };
    const evenements: BaseEvent[] = [];
    for await (const e of executer(
      {
        threadId: 't',
        runId: 'r',
        messages: [utilisateur('?')],
        tools: [],
        context: [],
      },
      refuse
    )) {
      evenements.push(e);
    }
    expect(evenements.at(-1)).toMatchObject({
      type: EventType.RUN_ERROR,
      code: 'refus',
    });
  });
});

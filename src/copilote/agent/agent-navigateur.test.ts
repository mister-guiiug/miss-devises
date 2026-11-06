import { describe, expect, it } from 'vitest';
import { AgentNavigateur } from './agent-navigateur.ts';
import { creerModeleSimule } from './modele-simule.ts';

describe('l’agent qui tourne dans la page', () => {
  it('exécute la boucle de l’agent sans serveur, et le client applique l’état', async () => {
    const agent = new AgentNavigateur(() => creerModeleSimule({ pause: 0 }), {
      initialState: { depenses: [] },
    });
    agent.addMessage({
      id: 'u1',
      role: 'user',
      content: 'note un taxi à 3000 yens',
    });
    await agent.runAgent();
    expect(agent.state).toEqual({
      depenses: [
        expect.objectContaining({
          libelle: 'taxi',
          montant: 3000,
          devise: 'JPY',
        }),
      ],
    });
    expect(agent.messages.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'C’est noté : taxi.',
    });
  });

  it('lit le modèle à chaque exécution, et un clone le garde', async () => {
    let appels = 0;
    const agent = new AgentNavigateur(() => {
      appels++;
      return creerModeleSimule({ pause: 0 });
    });
    const copie = agent.clone();
    copie.addMessage({ id: 'u1', role: 'user', content: 'bonjour' });
    await copie.runAgent();
    await copie.runAgent();
    expect(appels).toBe(2);
  });
});

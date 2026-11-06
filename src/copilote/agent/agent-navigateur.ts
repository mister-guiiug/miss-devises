/**
 * L'AGENT DANS LE NAVIGATEUR (spécification 007, R1). Un agent AG-UI n'a pas
 * besoin d'un serveur : c'est un `AbstractAgent` dont `run` rend un flux
 * d'événements. Celui-ci les tire de `executer`, la même boucle que les tests
 * éprouvent, et choisit son modèle à CHAQUE exécution — changer de clé ou
 * passer au modèle simulé ne demande pas de recréer l'agent.
 *
 * Le transport disparaît (pas de requête HTTP vers un agent), le protocole
 * reste : CopilotKit et l'inspecteur reçoivent les mêmes événements, vérifiés
 * et appliqués par le client AG-UI.
 */
import { Observable } from 'rxjs';
import {
  AbstractAgent,
  type AgentConfig,
  type BaseEvent,
  type RunAgentInput,
} from '@ag-ui/client';
import { executer } from './agent.ts';
import type { Modele } from './modele.ts';

export class AgentNavigateur extends AbstractAgent {
  constructor(
    private choisirModele: () => Modele,
    config: AgentConfig = {}
  ) {
    super(config);
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>(abonne => {
      // « Arrêter » dans la conversation désabonne : le modèle est coupé aussi.
      const abandon = new AbortController();
      void (async () => {
        try {
          for await (const evenement of executer(input, this.choisirModele(), {
            signal: abandon.signal,
          })) {
            abonne.next({ ...evenement, timestamp: Date.now() });
          }
          abonne.complete();
        } catch (erreur) {
          abonne.error(erreur);
        }
      })();
      return () => abandon.abort();
    });
  }

  /**
   * `AbstractAgent.clone` ne recopie que ses propres champs : sans cette
   * surcharge, un clone (CopilotKit en fait par conversation) perdrait le
   * choix du modèle.
   */
  override clone(): AgentNavigateur {
    const copie = super.clone() as AgentNavigateur;
    copie.choisirModele = this.choisirModele;
    return copie;
  }
}

/**
 * L'AGENT DANS LE SERVEUR DE DÉVELOPPEMENT (spécification 007, R3).
 *
 * Un greffon Vite monte l'agent à `/agent`, à la même origine que
 * l'application : la CSP (`connect-src 'self'`) le laisse passer sans rien
 * élargir, et aucun CORS n'est à régler. `apply: 'serve'` : le greffon
 * n'existe pas au build, et `vite.config.ts` ne l'importe qu'avec
 * `VITE_COPILOTE`.
 *
 * Le protocole, côté transport : le client poste une `RunAgentInput` en JSON,
 * l'agent répond par un flux d'événements (Server-Sent Events) que
 * `EventEncoder` met en forme.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { RunAgentInputSchema } from '@ag-ui/core/schemas';
import { EventType, type BaseEvent, type RunAgentInput } from '@ag-ui/core';
import { EventEncoder } from '@ag-ui/encoder';
import { executer } from './agent.ts';
import type { Modele } from './modele.ts';

/** Une photo de téléphone en base64 tient largement dessous. */
const CORPS_MAX = 15 * 1024 * 1024;

export function greffonAgent(creerModele: () => Promise<Modele>): Plugin {
  let modele: Promise<Modele> | null = null;
  return {
    name: 'miss-devises:agent',
    apply: 'serve',
    configureServer(serveur) {
      serveur.middlewares.use('/agent', (requete, reponse, suite) => {
        if (requete.method !== 'POST') {
          suite();
          return;
        }
        modele ??= creerModele();
        void traiter(requete, reponse, modele, message =>
          serveur.config.logger.info(message, { timestamp: true })
        );
      });
    },
  };
}

async function traiter(
  requete: IncomingMessage,
  reponse: ServerResponse,
  modelePromis: Promise<Modele>,
  journal: (message: string) => void
): Promise<void> {
  let entree: RunAgentInput;
  try {
    const lu = RunAgentInputSchema.safeParse(
      JSON.parse(await lireCorps(requete))
    );
    if (!lu.success) {
      repondreErreur(
        reponse,
        400,
        `RunAgentInput invalide : ${lu.error.issues[0]?.message ?? ''}`
      );
      return;
    }
    entree = lu.data as RunAgentInput;
  } catch (erreur) {
    repondreErreur(
      reponse,
      400,
      erreur instanceof Error ? erreur.message : String(erreur)
    );
    return;
  }

  const encodeur = new EventEncoder({ accept: requete.headers.accept });
  reponse.writeHead(200, {
    'Content-Type': encodeur.getContentType(),
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  // Le client part (onglet fermé, « Arrêter ») : on coupe aussi le modèle.
  const abandon = new AbortController();
  reponse.on('close', () => {
    if (!reponse.writableFinished) abandon.abort();
  });

  const modele = await modelePromis;
  let compte = 0;
  let derniere: BaseEvent | null = null;
  for await (const evenement of executer(entree, modele, {
    signal: abandon.signal,
  })) {
    reponse.write(encodeur.encode({ ...evenement, timestamp: Date.now() }));
    compte++;
    derniere = evenement;
  }
  reponse.end();
  journal(
    `[agent] ${modele.nom} · exécution ${entree.runId.slice(0, 8)} · ${String(entree.messages.length)} messages reçus · ${String(compte)} événements · ${
      derniere?.type === EventType.RUN_ERROR
        ? `ERREUR ${String(derniere.message)}`
        : 'fini'
    }`
  );
}

function lireCorps(requete: IncomingMessage): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const morceaux: Buffer[] = [];
    let taille = 0;
    requete.on('data', (morceau: Buffer) => {
      taille += morceau.length;
      if (taille > CORPS_MAX) {
        rejeter(new Error('Corps trop gros.'));
        requete.destroy();
        return;
      }
      morceaux.push(morceau);
    });
    requete.on('end', () => resoudre(Buffer.concat(morceaux).toString('utf8')));
    requete.on('error', rejeter);
  });
}

function repondreErreur(
  reponse: ServerResponse,
  statut: number,
  message: string
) {
  reponse.writeHead(statut, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  reponse.end(JSON.stringify({ erreur: message }));
}

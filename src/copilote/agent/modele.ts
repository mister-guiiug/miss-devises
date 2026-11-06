/**
 * CE QUE L'AGENT ATTEND D'UN MODÈLE (spécification 007, R6) : un flux
 * d'événements au format du SDK Anthropic, puis le tour complet. Claude le
 * donne ; le modèle simulé l'imite. La traduction vers AG-UI ne sait pas
 * lequel des deux parle.
 */
import type Anthropic from '@anthropic-ai/sdk';
import type { Bloc, Flux, MessageModele } from './protocole.ts';

export type Outil = Anthropic.Beta.BetaTool;

export interface Requete {
  /** Le préambule fixe : il porte seul le marqueur de cache. */
  systeme: string;
  /** Ce que l'application décrit de son écran : il change à chaque tour. */
  contexte: string;
  messages: MessageModele[];
  outils: Outil[];
  signal?: AbortSignal;
}

export interface Jetons {
  entree: number;
  sortie: number;
  lusEnCache: number;
  ecritsEnCache: number;
}

export interface FinDeTour {
  contenu: Bloc[];
  arret: Anthropic.Beta.BetaStopReason | null;
  jetons: Jetons;
  /** Le modèle qui a répondu : un repli côté serveur peut en avoir changé. */
  modele: string;
}

export interface Tour {
  flux: AsyncIterable<Flux>;
  fin(): Promise<FinDeTour>;
}

export interface Modele {
  /** Le nom annoncé au client, dans les métadonnées de `RUN_STARTED`. */
  nom: string;
  fournisseur: string;
  tour(requete: Requete): Tour;
}

/** Une panne que l'agent sait dire : clé absente, refus, réponse tronquée. */
export class ErreurModele extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = 'ErreurModele';
  }
}

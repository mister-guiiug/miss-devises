/**
 * LE JOURNAL DE L'INSPECTEUR (spécification 007, R9). Ce que le client AG-UI
 * reçoit, rangé par exécution : l'entrée qu'il a envoyée, puis chaque
 * événement, avec son instant relatif au début de l'exécution et un résumé
 * d'une ligne. Un réducteur pur : l'inspecteur l'affiche, les tests le
 * vérifient sans React.
 */
import type { BaseEvent, RunAgentInput, TokenUsage } from '@ag-ui/core';

export type Famille =
  | 'execution'
  | 'texte'
  | 'outil'
  | 'etat'
  | 'raisonnement'
  | 'erreur'
  | 'autre';

export interface Ligne {
  n: number;
  type: string;
  famille: Famille;
  /** Millisecondes depuis le début de l'exécution. */
  ecart: number;
  resume: string;
  corps: unknown;
}

export interface Entree {
  messages: number;
  /** Les rôles des derniers messages, du plus ancien au plus récent. */
  roles: string[];
  outils: string[];
  contexte: number;
  corps: unknown;
}

export interface Execution {
  runId: string;
  debut: number;
  entree: Entree | null;
  lignes: Ligne[];
  modele: string | null;
  usage: TokenUsage[] | null;
  issue: 'en-cours' | 'fini' | 'erreur';
}

export interface Journal {
  executions: Execution[];
  compte: Record<string, number>;
  total: number;
}

/** Au-delà, les plus anciennes exécutions s'effacent : l'inspecteur reste léger. */
const EXECUTIONS_MAX = 30;

export const journalVide = (): Journal => ({
  executions: [],
  compte: {},
  total: 0,
});

export function demarrer(
  journal: Journal,
  entree: RunAgentInput,
  maintenant: number
): Journal {
  const execution: Execution = {
    runId: entree.runId,
    debut: maintenant,
    entree: {
      messages: entree.messages.length,
      roles: entree.messages.slice(-4).map(m => m.role),
      outils: entree.tools.map(t => t.name),
      contexte: entree.context.length,
      corps: alleger(entree),
    },
    lignes: [],
    modele: null,
    usage: null,
    issue: 'en-cours',
  };
  return {
    ...journal,
    executions: [...journal.executions, execution].slice(-EXECUTIONS_MAX),
  };
}

export function recevoir(
  journal: Journal,
  evenement: BaseEvent,
  maintenant: number
): Journal {
  const executions = [...journal.executions];
  let index = executions.findLastIndex(e => e.issue === 'en-cours');
  if (index < 0) {
    // Un événement hors exécution connue (inspecteur ouvert en cours de route).
    executions.push({
      runId: typeof evenement.runId === 'string' ? evenement.runId : '?',
      debut: maintenant,
      entree: null,
      lignes: [],
      modele: null,
      usage: null,
      issue: 'en-cours',
    });
    index = executions.length - 1;
  }
  const courante = executions[index]!;
  const ligne: Ligne = {
    n: journal.total + 1,
    type: evenement.type,
    famille: famille(evenement.type),
    ecart: Math.max(0, Math.round(maintenant - courante.debut)),
    resume: resumer(evenement),
    corps: alleger(evenement),
  };
  const metadonnees = evenement.metadata as { modele?: unknown } | undefined;
  executions[index] = {
    ...courante,
    lignes: [...courante.lignes, ligne],
    modele:
      typeof metadonnees?.modele === 'string'
        ? metadonnees.modele
        : courante.modele,
    usage: Array.isArray(evenement.usage)
      ? (evenement.usage as TokenUsage[])
      : courante.usage,
    issue:
      evenement.type === 'RUN_FINISHED'
        ? 'fini'
        : evenement.type === 'RUN_ERROR'
          ? 'erreur'
          : courante.issue,
  };
  return {
    executions,
    compte: {
      ...journal.compte,
      [evenement.type]: (journal.compte[evenement.type] ?? 0) + 1,
    },
    total: journal.total + 1,
  };
}

/** Un échec du client lui-même (réseau coupé, événement refusé) : une ligne, et l'exécution close. */
export function echouer(
  journal: Journal,
  message: string,
  maintenant: number
): Journal {
  const avec = recevoir(
    journal,
    { type: 'ECHEC_DU_CLIENT', message } as unknown as BaseEvent,
    maintenant
  );
  const executions = [...avec.executions];
  const derniere = executions.at(-1);
  if (derniere)
    executions[executions.length - 1] = { ...derniere, issue: 'erreur' };
  return { ...avec, executions };
}

export function famille(type: string): Famille {
  if (type.startsWith('RUN_ERROR') || type === 'ECHEC_DU_CLIENT')
    return 'erreur';
  if (type.startsWith('RUN_') || type.startsWith('STEP_')) return 'execution';
  if (type.startsWith('TEXT_MESSAGE')) return 'texte';
  if (type.startsWith('TOOL_CALL')) return 'outil';
  if (type.startsWith('STATE_') || type === 'MESSAGES_SNAPSHOT') return 'etat';
  if (type.startsWith('REASONING')) return 'raisonnement';
  return 'autre';
}

const court = (texte: string, max = 60) =>
  texte.length > max ? `${texte.slice(0, max)}…` : texte;

/** Une ligne pour dire l'essentiel d'un événement. */
export function resumer(evenement: BaseEvent): string {
  const e = evenement as Record<string, unknown>;
  // `as string` : le journal porte aussi ses propres lignes (`ECHEC_DU_CLIENT`).
  switch (evenement.type as string) {
    case 'RUN_STARTED':
      return `modèle : ${String((e.metadata as { modele?: string } | undefined)?.modele ?? '?')}`;
    case 'RUN_FINISHED': {
      const usage = (e.usage as TokenUsage[] | undefined) ?? [];
      const entree = usage.reduce((s, u) => s + (u.inputTokens ?? 0), 0);
      const sortie = usage.reduce((s, u) => s + (u.outputTokens ?? 0), 0);
      return usage.length
        ? `jetons : ${String(entree)} en entrée, ${String(sortie)} en sortie`
        : 'fini';
    }
    case 'RUN_ERROR':
    case 'ECHEC_DU_CLIENT':
      return String(e.message ?? '');
    case 'STEP_STARTED':
    case 'STEP_FINISHED':
      return String(e.stepName ?? '');
    case 'TEXT_MESSAGE_CONTENT':
    case 'REASONING_MESSAGE_CONTENT':
    case 'TOOL_CALL_ARGS':
      return JSON.stringify(e.delta ?? '');
    case 'TOOL_CALL_START':
      return `${String(e.toolCallName)} (${court(String(e.toolCallId), 24)})`;
    case 'TOOL_CALL_RESULT':
      return court(
        typeof e.content === 'string' ? e.content : JSON.stringify(e.content)
      );
    case 'STATE_DELTA':
      return ((e.delta as { op: string; path: string }[] | undefined) ?? [])
        .map(o => `${o.op} ${o.path}`)
        .join(', ');
    case 'STATE_SNAPSHOT':
      return court(JSON.stringify(e.snapshot));
    case 'REASONING_ENCRYPTED_VALUE':
      return `${String(e.subtype)} ${court(String(e.entityId), 12)} · ${String(String(e.encryptedValue ?? '').length)} caractères`;
    default:
      return typeof e.messageId === 'string' ? court(e.messageId, 24) : '';
  }
}

/**
 * Le corps à afficher : une longue chaîne (une photo en base64, un tour brut)
 * est raccourcie, en disant sa longueur. Rien d'autre ne change.
 */
export function alleger(valeur: unknown): unknown {
  if (typeof valeur === 'string') {
    return valeur.length > 240
      ? `${valeur.slice(0, 120)}… (${String(valeur.length)} caractères)`
      : valeur;
  }
  if (Array.isArray(valeur)) return valeur.map(alleger);
  if (typeof valeur === 'object' && valeur !== null) {
    return Object.fromEntries(
      Object.entries(valeur).map(([cle, v]) => [cle, alleger(v)])
    );
  }
  return valeur;
}

/**
 * LE COPILOTE DE DÉMONSTRATION (spécification 007). Monté par `App.tsx`
 * quand le visiteur l'active dans les réglages : ce module et tout ce qu'il
 * importe (CopilotKit, le client AG-UI, le SDK d'Anthropic) forment des
 * morceaux à part, chargés à ce moment-là et jamais précachés.
 *
 * CopilotKit se branche DIRECTEMENT sur l'agent (R1), qui tourne dans la page
 * (`AgentNavigateur`). `agents__unsafe_dev_only` est l'option qui accepte un
 * agent local ; son « unsafe » désigne un point d'accès d'agent exposé sans
 * l'authentification du serveur de CopilotKit — il n'y en a aucun ici, l'agent
 * ne quitte pas la page, et seule l'API d'Anthropic est appelée, avec la clé
 * du visiteur.
 */
// LA FEUILLE DE COPILOTKIT EN FICHIER, PAS EN BALISE. Depuis la 2.0, le
// fournisseur injecte sa CSS dans un `<style>` ; `injectStyles={false}`
// l'en empêche, et la feuille importée ici part avec les morceaux du copilote
// (`assets/copilote/`, hors précache), comme avant. La 1.x la rangeait sous
// `@copilotkit/react-core/v2/styles.css`.
import '@copilotkit/core/styles.css';
import './copilote.css';
import {
  Component,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Bot, X } from 'lucide-react';
import type { BaseEvent, RunAgentInput } from '@ag-ui/client';
import {
  CopilotChat,
  CopilotKit,
  useAgent,
  UseAgentUpdate,
} from '@copilotkit/react-core';
import { AGENT, Branchements } from './Branchements.tsx';
import { ListeDepenses } from './ListeDepenses.tsx';
import { Inspecteur } from './Inspecteur.tsx';
import {
  demarrer,
  echouer,
  journalVide,
  recevoir,
  type Journal,
} from './journal.ts';
import { libelleErreur, useLibelles } from './libelles.ts';
import { lireDepenses } from './depenses.ts';
import { AgentNavigateur } from './agent/agent-navigateur.ts';
import { OngletModele } from './OngletModele.tsx';
import { MODELES, modeleCourant, useReglage } from './reglage.ts';

/**
 * UNE PANNE DU COPILOTE RESTE DANS LE COPILOTE. Sans cette frontière, une
 * erreur de CopilotKit remontait jusqu'à celle de l'application, qui
 * remplaçait tout l'écran par « Une erreur est survenue ».
 */
class Frontiere extends Component<
  { children: ReactNode },
  { erreur: string | null }
> {
  override state = { erreur: null as string | null };
  static getDerivedStateFromError(erreur: unknown) {
    return {
      erreur: erreur instanceof Error ? erreur.message : String(erreur),
    };
  }
  override render() {
    return this.state.erreur === null ? (
      this.props.children
    ) : (
      <p role="alert" className="copilote-bouton copilote-panne">
        Copilote en panne : {this.state.erreur}
      </p>
    );
  }
}

export default function Copilote() {
  return (
    <Frontiere>
      <CopiloteBranche />
    </Frontiere>
  );
}

function CopiloteBranche() {
  const agent = useMemo(
    () =>
      new AgentNavigateur(() => modeleCourant(), {
        agentId: AGENT,
        initialState: { depenses: [] },
      }),
    []
  );
  return (
    // L'inspecteur de CopilotKit est coupé : celui de la démonstration montre
    // le protocole nu, et deux inspecteurs se disputeraient l'écran (R9).
    <CopilotKit
      agents__unsafe_dev_only={{ [AGENT]: agent }}
      agentId={AGENT}
      injectStyles={false}
      enableInspector={false}
      showIntelligenceIndicator={false}
    >
      <Branchements />
      <Panneau />
    </CopilotKit>
  );
}

type Action =
  | { type: 'demarrer'; entree: RunAgentInput }
  | { type: 'recevoir'; evenement: BaseEvent }
  | { type: 'echouer'; message: string }
  | { type: 'effacer' };

function reduire(journal: Journal, action: Action): Journal {
  const maintenant = performance.now();
  switch (action.type) {
    case 'demarrer':
      return demarrer(journal, action.entree, maintenant);
    case 'recevoir':
      return recevoir(journal, action.evenement, maintenant);
    case 'echouer':
      return echouer(journal, action.message, maintenant);
    case 'effacer':
      return journalVide();
  }
}

const ONGLETS = ['conversation', 'evenements', 'depenses', 'modele'] as const;
type Onglet = (typeof ONGLETS)[number];

function Panneau() {
  const { t } = useLibelles();
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>('conversation');
  const [journal, envoyer] = useReducer(reduire, undefined, journalVide);
  const { agent } = useAgent({
    agentId: AGENT,
    updates: [UseAgentUpdate.OnStateChanged],
  });
  const onglets = useRef<Record<Onglet, HTMLButtonElement | null>>({
    conversation: null,
    evenements: null,
    depenses: null,
    modele: null,
  });

  // L'inspecteur s'abonne à l'agent que CopilotKit fait tourner : il voit ce
  // que le client reçoit, après sa vérification, et l'entrée de chaque
  // exécution.
  useEffect(() => {
    const { unsubscribe } = agent.subscribe({
      onRunInitialized: ({ input }) => {
        envoyer({ type: 'demarrer', entree: input });
      },
      onEvent: ({ event }) => {
        envoyer({ type: 'recevoir', evenement: event });
      },
      onRunFailed: ({ error }) => {
        envoyer({ type: 'echouer', message: error.message });
      },
    });
    return unsubscribe;
  }, [agent]);

  // Qui répondra au prochain message : le réglage, pas la dernière exécution.
  const mode = useReglage(s => s.mode);
  const idModele = useReglage(s => s.modele);
  const cle = useReglage(s => s.cle);
  const repondant =
    mode === 'simule'
      ? t('modeSimule')
      : `${MODELES.find(m => m.id === idModele)?.nom ?? idModele}${cle ? '' : ` · ${t('sansCle')}`}`;
  const depenses = lireDepenses(agent.state).length;
  // La dernière exécution a échoué (clé absente ou refusée, réseau) : la
  // conversation le dit, sans obliger à ouvrir l'inspecteur, et dans la langue
  // de l'interface — par le code de l'erreur (`libelleErreur`).
  const derniere = journal.executions.at(-1);
  const ligneErreur =
    derniere?.issue === 'erreur'
      ? derniere.lignes.findLast(l => l.famille === 'erreur')
      : undefined;
  const erreur =
    ligneErreur &&
    libelleErreur(
      t,
      (ligneErreur.corps as { code?: unknown } | null)?.code,
      ligneErreur.resume
    );
  const libelles: Record<Onglet, string> = {
    conversation: t('ongletConversation'),
    evenements: `${t('ongletEvenements')} (${String(journal.total)})`,
    depenses: `${t('ongletDepenses')} (${String(depenses)})`,
    modele: t('ongletModele'),
  };

  /** Les flèches passent d'un onglet à l'autre (motif ARIA des onglets). */
  const auClavier = (e: KeyboardEvent) => {
    const pas = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (pas === 0) return;
    const suivant =
      ONGLETS[
        (ONGLETS.indexOf(onglet) + pas + ONGLETS.length) % ONGLETS.length
      ]!;
    setOnglet(suivant);
    onglets.current[suivant]?.focus();
  };

  return (
    <>
      <button
        type="button"
        className="copilote-bouton"
        aria-expanded={ouvert}
        aria-controls="copilote-panneau"
        onClick={() => setOuvert(o => !o)}
      >
        <Bot aria-hidden="true" size={18} />
        {t('ouvrir')}
      </button>
      <aside
        id="copilote-panneau"
        className="copilote"
        aria-label={t('titre')}
        hidden={!ouvert}
      >
        <header className="copilote-entete">
          <div>
            <h2>{t('titre')}</h2>
            <p>
              {t('sousTitre')} ·{' '}
              <button
                type="button"
                className="copilote-lien"
                onClick={() => setOnglet('modele')}
              >
                {repondant}
              </button>
            </p>
          </div>
          <button
            type="button"
            className="copilote-icone"
            aria-label={t('fermer')}
            onClick={() => setOuvert(false)}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>
        <div
          role="tablist"
          aria-label={t('onglets')}
          className="copilote-onglets"
        >
          {ONGLETS.map(o => (
            <button
              key={o}
              ref={el => {
                onglets.current[o] = el;
              }}
              type="button"
              role="tab"
              id={`copilote-onglet-${o}`}
              aria-selected={onglet === o}
              aria-controls={`copilote-vue-${o}`}
              tabIndex={onglet === o ? 0 : -1}
              onClick={() => setOnglet(o)}
              onKeyDown={auClavier}
            >
              {libelles[o]}
            </button>
          ))}
        </div>
        <section
          role="tabpanel"
          id="copilote-vue-conversation"
          aria-labelledby="copilote-onglet-conversation"
          className="copilote-vue copilote-vue-conversation"
          hidden={onglet !== 'conversation'}
        >
          {erreur && (
            <div role="alert" className="copilote-erreur">
              <span>{erreur}</span>
              <button
                type="button"
                className="copilote-lien"
                onClick={() => setOnglet('modele')}
              >
                {t('ongletModele')}
              </button>
            </div>
          )}
          <CopilotChat
            agentId={AGENT}
            labels={{
              chatInputPlaceholder: t('placeholder'),
              welcomeMessageText: t('bienvenue'),
              chatDisclaimerText: t('avertissement'),
              chatInputToolbarSendButtonLabel: t('envoyer'),
              chatInputToolbarStopButtonLabel: t('arreter'),
              chatInputToolbarAddButtonLabel: t('joindre'),
              reasoningMessageThinkingLabel: t('reflexion'),
              attachmentRemoveButtonLabel: t('retirerPiece'),
            }}
            attachments={{
              enabled: true,
              accept: 'image/*',
              maxSize: 5 * 1024 * 1024,
            }}
          />
        </section>
        <section
          role="tabpanel"
          id="copilote-vue-evenements"
          aria-labelledby="copilote-onglet-evenements"
          className="copilote-vue"
          hidden={onglet !== 'evenements'}
        >
          <Inspecteur
            journal={journal}
            onEffacer={() => envoyer({ type: 'effacer' })}
          />
        </section>
        <section
          role="tabpanel"
          id="copilote-vue-depenses"
          aria-labelledby="copilote-onglet-depenses"
          className="copilote-vue"
          hidden={onglet !== 'depenses'}
        >
          <ListeDepenses />
        </section>
        <section
          role="tabpanel"
          id="copilote-vue-modele"
          aria-labelledby="copilote-onglet-modele"
          className="copilote-vue"
          hidden={onglet !== 'modele'}
        >
          <OngletModele />
        </section>
      </aside>
    </>
  );
}

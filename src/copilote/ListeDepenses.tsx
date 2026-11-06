/**
 * LA LISTE DES DÉPENSES : l'état partagé, vu et modifié par l'interface
 * (spécification 007, récit 4). L'agent l'écrit par `STATE_DELTA` ; retirer
 * une ligne passe par `agent.setState`, et l'agent reçoit la liste à jour dans
 * l'entrée de l'exécution suivante.
 */
import { X } from 'lucide-react';
import { useAgent, UseAgentUpdate } from '@copilotkit/react-core/v2';
import { usePreferences } from '../app/preferences.ts';
import { useTaux } from '../rates/store.ts';
import { Drapeau } from '../ui/Drapeau.tsx';
import { AGENT } from './Branchements.tsx';
import { convertirDepenses, lireDepenses } from './depenses.ts';
import { useLibelles } from './libelles.ts';

export function ListeDepenses() {
  const { t, locale } = useLibelles();
  const { agent } = useAgent({
    agentId: AGENT,
    updates: [UseAgentUpdate.OnStateChanged],
  });
  const reference = usePreferences(s => s.reference);
  const etat = useTaux(s => s.etat);
  const depenses = lireDepenses(agent.state);
  const { lignes, totalTexte, sansTaux } = convertirDepenses(
    depenses,
    reference,
    etat,
    locale
  );

  const retirer = (id: string) =>
    agent.setState({
      ...agent.state,
      depenses: depenses.filter(d => d.id !== id),
    });

  return (
    <div className="copilote-depenses">
      <h3>{t('depensesTitre')}</h3>
      <p className="copilote-aide">{t('depensesAide')}</p>
      {lignes.length === 0 ? (
        <p className="copilote-vide">{t('depensesVides')}</p>
      ) : (
        <>
          <ul>
            {lignes.map(l => (
              <li key={l.id}>
                <Drapeau code={l.devise} />
                <span className="copilote-depense-libelle">{l.libelle}</span>
                <span>{l.texte}</span>
                <strong>{l.texteReference ?? t('sansTaux')}</strong>
                <button
                  type="button"
                  className="copilote-icone"
                  aria-label={t('retirer', { libelle: l.libelle })}
                  onClick={() => retirer(l.id)}
                >
                  <X aria-hidden="true" size={14} />
                </button>
              </li>
            ))}
          </ul>
          <p className="copilote-total">
            {t('total')} : <strong>{totalTexte}</strong>
            {sansTaux > 0 ? ` (${String(sansTaux)} ${t('sansTaux')})` : ''}
          </p>
        </>
      )}
    </div>
  );
}

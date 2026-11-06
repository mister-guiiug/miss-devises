/**
 * L'INSPECTEUR AG-UI (spécification 007, récit 2). Chaque événement que le
 * client reçoit, dans l'ordre, rangé par exécution : l'entrée envoyée en
 * tête, le modèle et les jetons à la fin. Une ligne se déplie sur son corps
 * JSON. La plus récente exécution vient en premier.
 */
import { useState } from 'react';
import type { Journal } from './journal.ts';
import { useLibelles } from './libelles.ts';

export function Inspecteur({
  journal,
  onEffacer,
}: {
  journal: Journal;
  onEffacer: () => void;
}) {
  const { t } = useLibelles();
  const [filtre, setFiltre] = useState<string | null>(null);
  const types = Object.entries(journal.compte);

  return (
    <div className="inspecteur">
      <div className="inspecteur-outils">
        <div
          role="group"
          aria-label={t('filtrer')}
          className="inspecteur-filtres"
        >
          <button
            type="button"
            aria-pressed={filtre === null}
            onClick={() => setFiltre(null)}
          >
            {t('tous')} <span>{journal.total}</span>
          </button>
          {types.map(([type, n]) => (
            <button
              key={type}
              type="button"
              aria-pressed={filtre === type}
              onClick={() => setFiltre(filtre === type ? null : type)}
            >
              {type} <span>{n}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="inspecteur-effacer"
          onClick={onEffacer}
          disabled={journal.total === 0}
        >
          {t('effacer')}
        </button>
      </div>

      {journal.executions.length === 0 ? (
        <p className="copilote-vide">{t('inspecteurVide')}</p>
      ) : (
        [...journal.executions].reverse().map(execution => {
          const lignes = execution.lignes.filter(
            l => filtre === null || l.type === filtre
          );
          const usage = execution.usage ?? [];
          return (
            <section
              key={`${execution.runId}-${String(execution.debut)}`}
              className="inspecteur-execution"
              data-issue={execution.issue}
            >
              <h3>
                {t('execution', { id: execution.runId.slice(0, 8) })} ·{' '}
                {execution.modele ?? t('modeleInconnu')} ·{' '}
                {execution.issue === 'fini'
                  ? t('finie')
                  : execution.issue === 'erreur'
                    ? t('enErreur')
                    : t('enCours')}{' '}
                · {t('evenements', { n: execution.lignes.length })}
              </h3>
              {usage.length > 0 && (
                <p className="inspecteur-jetons">
                  {t('jetons', {
                    entree: usage.reduce((s, u) => s + (u.inputTokens ?? 0), 0),
                    cache: usage.reduce(
                      (s, u) => s + (u.cachedInputTokens ?? 0),
                      0
                    ),
                    sortie: usage.reduce(
                      (s, u) => s + (u.outputTokens ?? 0),
                      0
                    ),
                  })}
                </p>
              )}
              {execution.entree && (
                <details className="inspecteur-entree">
                  <summary>
                    {t('entree', {
                      messages: execution.entree.messages,
                      roles: execution.entree.roles.join(' → '),
                      outils: execution.entree.outils.join(', ') || '—',
                      contexte: execution.entree.contexte,
                    })}
                  </summary>
                  <pre>{JSON.stringify(execution.entree.corps, null, 2)}</pre>
                </details>
              )}
              <ol>
                {lignes.map(ligne => (
                  <li key={ligne.n} data-famille={ligne.famille}>
                    <details>
                      <summary>
                        <span className="inspecteur-ecart">
                          +{ligne.ecart} ms
                        </span>
                        <code>{ligne.type}</code>
                        <span className="inspecteur-resume">
                          {ligne.resume}
                        </span>
                      </summary>
                      <pre>{JSON.stringify(ligne.corps, null, 2)}</pre>
                    </details>
                  </li>
                ))}
              </ol>
            </section>
          );
        })
      )}
    </div>
  );
}

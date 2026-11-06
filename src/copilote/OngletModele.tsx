/**
 * L'ONGLET « MODÈLE » : choisir entre le modèle simulé et Claude, et apporter
 * sa clé (BYOK, spécification 007, récit 6). L'avis dit ce qui part, où et
 * avec quoi, AVANT la première demande qui quitterait l'appareil
 * (constitution, contraintes du parc).
 */
import { useId, useState, type FormEvent } from 'react';
import { ExternalLink, KeyRound } from 'lucide-react';
import { useLibelles } from './libelles.ts';
import { aLaFormeDUneCle, MODELES, useReglage } from './reglage.ts';

export function OngletModele() {
  const { t } = useLibelles();
  const mode = useReglage(s => s.mode);
  const modele = useReglage(s => s.modele);
  const cle = useReglage(s => s.cle);
  const { choisirMode, choisirModele, poserCle, oublierCle } =
    useReglage.getState();
  const [saisie, setSaisie] = useState('');
  const idAvis = useId();
  const idForme = useId();
  const douteuse = saisie.trim() !== '' && !aLaFormeDUneCle(saisie);

  const enregistrer = (e: FormEvent) => {
    e.preventDefault();
    poserCle(saisie);
    setSaisie('');
  };

  return (
    <div className="copilote-modele">
      <fieldset>
        <legend>{t('modeleLegende')}</legend>
        <label className="copilote-choix">
          <input
            type="radio"
            name="copilote-mode"
            checked={mode === 'simule'}
            onChange={() => choisirMode('simule')}
          />
          <strong>{t('modeSimule')}</strong>
          <small>{t('modeSimuleAide')}</small>
        </label>
        <label className="copilote-choix">
          <input
            type="radio"
            name="copilote-mode"
            checked={mode === 'claude'}
            onChange={() => choisirMode('claude')}
          />
          <strong>{t('modeClaude')}</strong>
          <small>{t('modeClaudeAide')}</small>
        </label>
      </fieldset>

      {mode === 'claude' && (
        <>
          <label className="copilote-champ">
            <span>{t('modeleChoix')}</span>
            <select
              value={modele}
              onChange={e =>
                choisirModele(e.target.value as (typeof MODELES)[number]['id'])
              }
            >
              {MODELES.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          </label>

          <div id={idAvis} className="copilote-avis" role="note">
            <p>{t('avisEnvoi')}</p>
            <p>{t('avisCle')}</p>
            <p>
              <a
                href="https://www.anthropic.com/legal/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                {t('avisPolitique')}
                <ExternalLink aria-hidden="true" size={12} />
                <span className="copilote-sr">{t('nouvelOnglet')}</span>
              </a>
            </p>
          </div>

          {cle ? (
            <div className="copilote-cle">
              <KeyRound aria-hidden="true" size={16} />
              <span>{t('cleEnregistree', { fin: cle.slice(-4) })}</span>
              <button
                type="button"
                className="copilote-lien"
                onClick={oublierCle}
              >
                {t('oublierCle')}
              </button>
            </div>
          ) : (
            <form className="copilote-champ" onSubmit={enregistrer}>
              <label htmlFor="copilote-cle">{t('cleLibelle')}</label>
              <input
                id="copilote-cle"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={saisie}
                onChange={e => setSaisie(e.target.value)}
                aria-describedby={`${idAvis}${douteuse ? ` ${idForme}` : ''}`}
                placeholder="sk-ant-…"
              />
              {douteuse && (
                <small id={idForme} role="status">
                  {t('cleDouteuse')}
                </small>
              )}
              <button
                type="submit"
                className="copilote-action"
                disabled={!saisie.trim()}
              >
                {t('cleUtiliser')}
              </button>
              <a
                href="https://platform.claude.com/settings/keys"
                target="_blank"
                rel="noreferrer noopener"
              >
                {t('cleObtenir')}
                <ExternalLink aria-hidden="true" size={12} />
                <span className="copilote-sr">{t('nouvelOnglet')}</span>
              </a>
            </form>
          )}
        </>
      )}
    </div>
  );
}

/**
 * LES FICHES DE LA CONVERSATION : l'interface générée (spécification 007,
 * récit 1). Un appel d'outil ne s'affiche pas en JSON ; il se rend en
 * composant, qui suit l'état de l'appel — arguments en cours d'écriture,
 * exécution, résultat.
 */
import {
  ArrowRight,
  Check,
  CircleAlert,
  NotebookPen,
  Percent,
} from 'lucide-react';
import { Drapeau } from '../ui/Drapeau.tsx';
import { useLibelles } from './libelles.ts';
import type { ResultatConvertir, ResultatFrais } from './outils.ts';

type Statut = 'inProgress' | 'executing' | 'complete';

function lire<T>(resultat: unknown): T | null {
  if (typeof resultat !== 'string') return null;
  try {
    return JSON.parse(resultat) as T;
  } catch {
    return null;
  }
}

export function FicheConversion({
  args,
  status,
  result,
}: {
  args: Partial<{ montant: number; devise: string; vers: string }>;
  status: Statut;
  result?: string;
}) {
  const { t } = useLibelles();
  if (status !== 'complete') {
    return (
      <div className="copilote-fiche" data-etat="attente" role="status">
        {args.montant !== undefined && args.devise
          ? t('conversionDe', { montant: args.montant, devise: args.devise })
          : t('conversionEnCours')}
      </div>
    );
  }
  const r = lire<ResultatConvertir>(result);
  if (!r?.ok) {
    return (
      <div className="copilote-fiche" data-etat="echec">
        <CircleAlert aria-hidden="true" size={16} />
        <span>
          {t('conversionImpossible')} : {r?.raison ?? '?'}
        </span>
      </div>
    );
  }
  return (
    <div className="copilote-fiche" data-etat="fait">
      <div className="copilote-fiche-montants">
        {args.devise && <Drapeau code={args.devise} />}
        <strong>{r.saisi}</strong>
        <ArrowRight aria-hidden="true" size={14} />
        <span className="copilote-fiche-resultats">
          {r.resultats.map(l => (
            <span key={l.code}>
              <Drapeau code={l.code} /> <strong>{l.texte}</strong>
            </span>
          ))}
        </span>
      </div>
      {r.resultats.map(l => (
        <p key={l.code} className="copilote-fiche-taux">
          {l.taux} · {l.source} · {l.date}
          {l.ancien ? ' ⚠' : ''}
        </p>
      ))}
      {r.avecFrais && (
        <p className="copilote-fiche-taux">{t('avecFrais', r.avecFrais)}</p>
      )}
      {r.marge && (
        <p className="copilote-fiche-taux">{t('marge', { marge: r.marge })}</p>
      )}
      <p className="copilote-fiche-source">
        <Check aria-hidden="true" size={12} /> {t('conversionFaite')}
      </p>
    </div>
  );
}

export function FicheFrais({
  status,
  result,
}: {
  status: Statut;
  result?: string;
}) {
  const { t } = useLibelles();
  const r = status === 'complete' ? lire<ResultatFrais>(result) : null;
  if (status !== 'complete')
    return (
      <div className="copilote-fiche" data-etat="attente">
        {t('fraisEnCours')}
      </div>
    );
  if (!r?.ok) {
    return (
      <div className="copilote-fiche" data-etat="echec">
        <CircleAlert aria-hidden="true" size={16} /> {r?.raison ?? '?'}
      </div>
    );
  }
  return (
    <div className="copilote-fiche" data-etat="fait">
      <Percent aria-hidden="true" size={14} />{' '}
      {t('fraisAppliques', {
        libelle: r.frais.libelle,
        description: r.frais.description,
      })}
      {r.frais.repris ? ` (${t('fraisRepris')})` : ''}
    </div>
  );
}

export function FicheDepense({
  status,
  parameters,
}: {
  status: Statut;
  parameters: Partial<{ libelle: string; montant: number; devise: string }>;
}) {
  const { t } = useLibelles();
  if (status !== 'complete')
    return (
      <div className="copilote-fiche" data-etat="attente">
        {t('depenseEnCours')}
      </div>
    );
  return (
    <div className="copilote-fiche" data-etat="fait">
      <NotebookPen aria-hidden="true" size={14} />{' '}
      {t('depenseNotee', {
        libelle: parameters.libelle ?? '?',
        montant: `${String(parameters.montant ?? '?')} ${parameters.devise ?? ''}`,
      })}
    </div>
  );
}

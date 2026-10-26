import { useI18n } from '../../i18n/index.ts';
import type { FraisEnregistres } from '../../app/preferences.ts';
import {
  coutAvecFrais,
  decrireFrais,
  fixeEnReference,
} from '../../domain/frais.ts';
import { formaterMontant } from '../../domain/money.ts';

interface Props {
  frais: readonly FraisEnregistres[];
  choisis: string | null;
  onChoisir: (id: string | null) => void;
  reference: string;
  /** Le montant indicatif en référence, sans la marge (recherche R1). */
  montantReference: number | null;
  /** Le taux de la paire (référence, devise du montant fixe) des frais choisis. */
  tauxFixe: number | undefined;
}

/**
 * Le coût frais compris (spécification 005, récit 1), sous les montants : le
 * choix des frais, puis le coût et la part des frais. Absente tant qu'aucun
 * frais n'est enregistré : rien ne change pour qui n'en a pas (CR-001).
 */
export function LigneFrais({
  frais,
  choisis,
  onChoisir,
  reference,
  montantReference,
  tauxFixe,
}: Props) {
  const { t, locale } = useI18n();
  if (frais.length === 0) return null;

  const actifs = frais.find(f => f.id === choisis) ?? null;
  const fixe = actifs ? fixeEnReference(actifs, reference, tauxFixe) : null;
  const cout =
    actifs && fixe !== null && montantReference !== null
      ? coutAvecFrais(montantReference, actifs.pourcentage, fixe)
      : null;

  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <label className="flex items-center gap-2">
        <span className="font-semibold">{t('convert.frais')}</span>
        <select
          value={actifs?.id ?? ''}
          onChange={event => onChoisir(event.target.value || null)}
          className="min-h-11 min-w-0 rounded-lg border px-2"
          style={{
            borderColor: 'var(--dwc-border-strong)',
            background: 'var(--dwc-surface)',
            color: 'var(--dwc-text)',
          }}
        >
          <option value="">{t('convert.fraisAucun')}</option>
          {frais.map(f => (
            <option key={f.id} value={f.id}>
              {f.libelle}
            </option>
          ))}
        </select>
      </label>
      {actifs && fixe === null && (
        <p role="status" className="m-0">
          {t('convert.fraisSansTaux', { code: actifs.deviseFixe })}
        </p>
      )}
      {actifs && cout && (
        <div role="status">
          <p className="m-0 font-semibold tabular-nums">
            {t('convert.coutAvecFrais', {
              total: formaterMontant(cout.total, reference, locale),
            })}
          </p>
          <p
            className="m-0 tabular-nums"
            style={{ color: 'var(--dwc-text-soft)' }}
          >
            {t('convert.dontFrais', {
              frais: formaterMontant(cout.frais, reference, locale),
              detail: decrireFrais(actifs, locale),
            })}
          </p>
        </div>
      )}
    </div>
  );
}

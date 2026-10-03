import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { useI18n } from '../../i18n/index.ts';
import {
  formaterCoupure,
  formaterDate,
  formaterTaux,
  formaterTauxEn,
} from '../../domain/money.ts';
import type { TauxDuJour } from '../../rates/service.ts';

interface Props {
  jour: TauxDuJour | undefined;
  pret: boolean;
  horsLigne: boolean;
  /** Marge en pour cent. 0 : le taux indicatif, sans phrase. */
  marge?: number;
  onReessayer: () => void;
}

/**
 * La ligne de taux : le taux, sa source et sa date — une lecture, pas un mur
 * (principe I, EF-003). Jamais un taux sans sa provenance. « 1 € = 58,83 EGP »,
 * ou « 1 CHF = 62,692 EGP » : la référence se dit comme `Intl` l'écrit.
 */
export function RateLine({
  jour,
  pret,
  horsLigne,
  marge = 0,
  onReessayer,
}: Props) {
  const { t, locale } = useI18n();

  if (!jour) {
    if (!pret) return null;
    return (
      <div role="status" className="flex flex-wrap items-center gap-2 text-sm">
        <p className="m-0 flex-1">{t('convert.absent')}</p>
        <Button variant="outline" size="sm" onClick={onReessayer}>
          {t('convert.reessayer')}
        </Button>
      </div>
    );
  }

  const date = formaterDate(jour.date, locale);
  const meta = [
    t('convert.date', {
      source: t(`convert.source.${jour.source}`),
      date,
    }),
    t('convert.indicatif'),
    marge > 0
      ? t('convert.marge', {
          marge: formatNumber(marge, locale, { maximumFractionDigits: 2 }),
        })
      : null,
    horsLigne ? t('convert.horsLigne') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div role="status" className="flex flex-col gap-0.5 text-sm">
      <p className="m-0 font-semibold tabular-nums">
        {t('convert.taux', {
          un: formaterCoupure(1, jour.reference, locale),
          taux: `${formaterTaux(jour.taux, locale)} ${jour.code}`,
        })}
        {' · '}
        {t('convert.tauxInverse', {
          code: jour.code,
          taux: formaterTauxEn(1 / jour.taux, jour.reference, locale),
        })}
      </p>
      <p className="m-0" style={{ color: 'var(--dwc-text-soft)' }}>
        {meta}
      </p>
      {jour.fraicheur === 'ancien' && (
        <p
          className="m-0 font-semibold"
          style={{ color: 'var(--dwc-warning)' }}
        >
          {t('convert.ancien', { date })}
        </p>
      )}
    </div>
  );
}

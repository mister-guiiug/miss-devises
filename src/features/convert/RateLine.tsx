import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { useI18n } from '../../i18n/index.ts';
import { formaterDate, formaterTaux } from '../../domain/money.ts';
import type { TauxDuJour } from '../../rates/service.ts';

interface Props {
  jour: TauxDuJour | undefined;
  pret: boolean;
  horsLigne: boolean;
  onReessayer: () => void;
}

/**
 * La ligne de taux : le taux dans les deux sens, sa source, sa date, et ce
 * qui doit alerter (principe I, EF-003). Jamais un taux sans sa provenance.
 */
export function RateLine({ jour, pret, horsLigne, onReessayer }: Props) {
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
  return (
    <div role="status" className="flex flex-col gap-0.5 text-sm">
      <p className="m-0 font-semibold">
        {t('convert.taux', {
          taux: `${formaterTaux(jour.taux, locale)} ${jour.code}`,
        })}
        {' · '}
        {t('convert.tauxInverse', {
          code: jour.code,
          taux: `${formaterTaux(1 / jour.taux, locale)} €`,
        })}
      </p>
      <p className="m-0" style={{ color: 'var(--dwc-text-soft)' }}>
        {t('convert.date', {
          source: t(`convert.source.${jour.source}`),
          date,
        })}
        {' · '}
        {t('convert.indicatif')}
      </p>
      {jour.fraicheur === 'ancien' && (
        <p
          className="m-0 font-semibold"
          style={{ color: 'var(--dwc-warning)' }}
        >
          {t('convert.ancien', { date })}
        </p>
      )}
      {horsLigne && (
        <p className="m-0" style={{ color: 'var(--dwc-text-soft)' }}>
          {t('convert.horsLigne')}
        </p>
      )}
    </div>
  );
}

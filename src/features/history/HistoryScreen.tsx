import { useMemo } from 'react';
import { Card } from '@mister-guiiug/dev-pwa-config/react/card';
import { SegmentedControl } from '@mister-guiiug/dev-pwa-config/react/segmented-control';
import { Stat } from '@mister-guiiug/dev-pwa-config/react/stat';
import { useI18n } from '../../i18n/index.ts';
import { useTaux } from '../../rates/store.ts';
import { codesConnus, tauxDuJour, type Periode } from '../../rates/service.ts';
import { usePreferences } from '../../app/preferences.ts';
import {
  formaterCoupure,
  formaterDate,
  formaterMontant,
  formaterPourcentage,
  formaterTaux,
} from '../../domain/money.ts';
import {
  comparer,
  statistiques,
  type Statistiques,
} from '../../domain/history.ts';
import { deriver, useConversion } from '../convert/conversion.ts';
import { CurrencyPicker } from '../convert/CurrencyPicker.tsx';
import { Courbe } from './Courbe.tsx';
import { useSerie } from './use-serie.ts';

const PERIODES: Periode[] = ['1M', '6M', '1A'];

// `SegmentedControl` est typé sans générique : il rend une chaîne.
const estPeriode = (valeur: string): valeur is Periode =>
  (PERIODES as string[]).includes(valeur);

/**
 * L'historique (récit 3) : la courbe domine ; les stats et le delta du
 * montant Convertir la suivent (EF-008, EF-009).
 */
export function HistoryScreen() {
  const { t, locale } = useI18n();
  const reference = usePreferences(s => s.reference);
  const devise = usePreferences(s => s.devise);
  const recentes = usePreferences(s => s.recentes);
  const epinglees = usePreferences(s => s.epinglees);
  const epingler = usePreferences(s => s.epingler);
  const choisirDevise = usePreferences(s => s.choisirDevise);
  const periode = usePreferences(s => s.periode);
  const choisirPeriode = usePreferences(s => s.choisirPeriode);
  const etat = useTaux(s => s.etat);
  const codes = useMemo(() => codesConnus(etat), [etat]);
  const jour = tauxDuJour(reference, devise, etat, new Date());

  const nomPeriode = (p: Periode) => t(`history.periodes.${p}`);

  return (
    <div className="flex flex-col gap-3">
      <CurrencyPicker
        code={devise}
        codes={codes}
        recentes={recentes}
        epinglees={epinglees}
        onEpingler={epingler}
        onChoisir={choisirDevise}
        exclure={reference}
      />
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-base font-semibold">
          {t('history.courbe', {
            un: formaterCoupure(1, reference, locale),
            code: devise,
            periode: nomPeriode(periode),
          })}
        </h2>
        <SegmentedControl
          value={periode}
          onChange={valeur => {
            if (estPeriode(valeur)) choisirPeriode(valeur);
          }}
          options={PERIODES.map(p => ({ value: p, label: nomPeriode(p) }))}
          ariaLabel={t('history.periode')}
          fullWidth
        />
      </div>
      {jour ? (
        <Contenu reference={reference} devise={devise} />
      ) : (
        <p className="m-0 text-sm">{t('convert.absent')}</p>
      )}
    </div>
  );
}

/** La période lue : rien n'est demandé pour une devise sans taux. */
function Contenu({ reference, devise }: { reference: string; devise: string }) {
  const { t, locale } = useI18n();
  const periode = usePreferences(s => s.periode);
  const lecture = useSerie(reference, devise, periode);

  if (lecture.statut === 'chargement') {
    return (
      <p role="status" className="m-0 text-sm">
        {t('history.chargement')}
      </p>
    );
  }
  const stats =
    lecture.statut === 'pret' ? statistiques(lecture.serie.points) : undefined;
  if (lecture.statut === 'indisponible' || !stats) {
    return <p className="m-0 text-sm">{t('history.horsLigne')}</p>;
  }

  const { serie } = lecture;
  const date = (iso: string) => formaterDate(iso, locale);
  const taux = (valeur: number) => `${formaterTaux(valeur, locale)} ${devise}`;
  const tendance =
    stats.variation > 0 ? 'up' : stats.variation < 0 ? 'down' : 'flat';

  return (
    <>
      <Card className="flex flex-col gap-3">
        {/* `key` : une autre paire ou une autre période repart du dernier
            point, celui d'aujourd'hui. */}
        <Courbe
          key={`${reference}:${devise}:${periode}`}
          points={serie.points}
          reference={reference}
          devise={devise}
          description={t('history.description', {
            nombre: serie.points.length,
            debut: date(stats.debut.date),
            fin: date(stats.fin.date),
            premier: taux(stats.debut.taux),
            dernier: taux(stats.fin.taux),
            min: taux(stats.plusBas.taux),
            max: taux(stats.plusHaut.taux),
          })}
        />
        <div className="grid grid-cols-3 gap-2 tabular-nums">
          <Stat
            label={t('history.plusHaut')}
            value={taux(stats.plusHaut.taux)}
            delta={t('history.le', { date: date(stats.plusHaut.date) })}
          />
          <Stat
            label={t('history.plusBas')}
            value={taux(stats.plusBas.taux)}
            delta={t('history.le', { date: date(stats.plusBas.date) })}
          />
          <Stat
            label={t('history.variation')}
            value={formaterPourcentage(stats.variation, locale)}
            trend={tendance}
            delta={
              tendance === 'up'
                ? t('history.hausse')
                : tendance === 'down'
                  ? t('history.baisse')
                  : t('history.stable')
            }
          />
        </div>
        <p className="m-0 text-xs" style={{ color: 'var(--dwc-text-soft)' }}>
          {t('history.sourceDates', {
            source: t(`convert.source.${serie.source}`),
            debut: date(stats.debut.date),
            fin: date(stats.fin.date),
          })}
        </p>
        {!serie.complete && (
          <p className="m-0 text-xs">{t('history.incomplete')}</p>
        )}
      </Card>
      <Comparaison reference={reference} devise={devise} stats={stats} />
    </>
  );
}

/** Le montant saisi dans Convertir, au début de la période et aujourd'hui. */
function Comparaison({
  reference,
  devise,
  stats,
}: {
  reference: string;
  devise: string;
  stats: Statistiques;
}) {
  const { t, locale } = useI18n();
  const saisie = useConversion(s => s.saisie);
  const decimales = usePreferences(s => s.decimales);
  const d = deriver(saisie, devise, reference, stats.fin.taux, locale);
  const enDevise = saisie.champ === 'devise';
  const montant = enDevise ? d.montantDevise : d.montantReference;

  if (montant === null || montant <= 0) {
    return <p className="m-0 text-sm">{t('history.sansMontant')}</p>;
  }

  const codeSaisi = enDevise ? devise : reference;
  const codeContre = enDevise ? reference : devise;
  const c = comparer(
    montant,
    enDevise ? 'versReference' : 'versDevise',
    stats.debut.taux,
    stats.fin.taux
  );
  const options = decimales === null ? {} : { decimales };
  const montantDe = (valeur: number) =>
    formaterMontant(valeur, codeContre, locale, options);

  return (
    <Card className="flex flex-col gap-1">
      <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
        {t('history.sur', {
          montant: formaterMontant(montant, codeSaisi, locale, options),
        })}
      </p>
      <p className="m-0 text-fluid-lg font-semibold tabular-nums">
        {t('history.ecart', {
          ecart: formaterMontant(c.ecart, codeContre, locale, {
            signe: true,
            ...options,
          }),
          pourcentage: formaterPourcentage(c.pourcentage, locale),
        })}
      </p>
      <p className="m-0 text-sm">
        {t('history.comparaison', {
          montant: formaterMontant(montant, codeSaisi, locale, options),
          avant: montantDe(c.avant),
          date: formaterDate(stats.debut.date, locale),
          maintenant: montantDe(c.maintenant),
        })}
      </p>
    </Card>
  );
}

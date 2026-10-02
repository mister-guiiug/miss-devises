import { useEffect, useRef, useState, type ChangeEvent, useMemo } from 'react';
import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { TextField } from '@mister-guiiug/dev-pwa-config/react/field';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { Card, CardHeader } from '@mister-guiiug/dev-pwa-config/react/card';
import { ConfirmDialog } from '@mister-guiiug/dev-pwa-config/react/confirm-dialog';
import { ConsentSection } from '@mister-guiiug/dev-pwa-config/react/consent-section';
import { SegmentedControl } from '@mister-guiiug/dev-pwa-config/react/segmented-control';
import { ChromePrefs } from '@mister-guiiug/dev-pwa-config/react/chrome-prefs';
import { dateSlug, downloadText } from '@mister-guiiug/dev-pwa-config/download';
import { useI18n } from '../../i18n/index.ts';
import { backend } from '../../backend/index.ts';
import { usePreferences } from '../../app/preferences.ts';
import { useTaux } from '../../rates/store.ts';
import { codesConnus } from '../../rates/service.ts';
import { useCarnet } from '../carnet/store.ts';
import { CurrencyPicker } from '../convert/CurrencyPicker.tsx';
import { arrondir, lireMontant } from '../../domain/money.ts';

/**
 * L'écran de réglages : le seul écran que TOUTES les apps de la famille ont, et
 * dont la COMPOSITION reste métier — c'est pourquoi le socle livre les briques
 * (`ChromePrefs`, `AppVersion`, `FamilyApps`, `ConfirmDialog`, `downloadText`)
 * et non l'écran. Onze apps en ont un, de 142 à 728 lignes.
 *
 * IMPORTER, PAS SEULEMENT EXPORTER. Quinze apps du parc savent exporter ;
 * presque aucune ne sait relire son propre fichier à l'écran — et c'est le
 * seul moyen de changer d'appareil sans compte. Le fichier passe par le port
 * (`versioned-store.import()` en local), donc par le schéma : un fichier
 * d'une autre app ou tronqué est refusé sans rien effacer. Quand le carnet
 * contient déjà des conversions, l'import demande confirmation, parce qu'il
 * REMPLACE.
 */
export function SettingsScreen() {
  const { t, m, fmt, locale, setLocale, locales } = useI18n();
  const clear = useCarnet(state => state.clear);
  const importJson = useCarnet(state => state.importJson);
  const conversions = useCarnet(state => state.conversions);
  const ready = useCarnet(state => state.ready);
  const load = useCarnet(state => state.load);
  const error = useCarnet(state => state.error);
  const [confirming, setConfirming] = useState(false);
  const reference = usePreferences(state => state.reference);
  const choisirReference = usePreferences(state => state.choisirReference);
  const marge = usePreferences(state => state.marge);
  const choisirMarge = usePreferences(state => state.choisirMarge);
  const decimales = usePreferences(state => state.decimales);
  const choisirDecimales = usePreferences(state => state.choisirDecimales);
  const etat = useTaux(state => state.etat);
  const codes = useMemo(() => codesConnus(etat), [etat]);

  // Ouvert directement (lien profond, rechargement), cet écran ne sait pas si
  // des conversions existent tant que le port n'a pas été lu : sans cette lecture,
  // l'import remplacerait sans demander. La première version le faisait.
  useEffect(() => {
    if (!ready) void load();
  }, [ready, load]);
  const fileInput = useRef<HTMLInputElement>(null);
  /** Le fichier lu, en attente de confirmation parce que le carnet n'est pas vide. */
  const [pending, setPending] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const exporter = async () => {
    const json = await backend.carnet.export();
    if (json)
      downloadText(
        json,
        `miss-devises-carnet-${dateSlug()}.json`,
        'application/json'
      );
  };

  const runImport = async (json: string) => {
    const count = await importJson(json);
    setImported(count);
    setFailed(count === null);
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Remis à zéro tout de suite : choisir DEUX fois le même fichier doit
    // relancer l'import, et un `<input type=file>` ne signale pas un choix
    // identique au précédent.
    event.target.value = '';
    if (!file) return;
    const json = await file.text();
    if (conversions.length > 0) setPending(json);
    else await runImport(json);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* LA MONNAIE DE RÉFÉRENCE (spécification 002, récit 1) : celle dans
          laquelle on compte. La liste est celle de Convertir, drapeaux
          compris ; choisir la devise affichée échange les deux. */}
      <Card>
        <CardHeader title={t('settings.reference')} />
        <p
          className="m-0 mb-3 text-sm"
          style={{ color: 'var(--dwc-text-soft)' }}
        >
          {t('settings.referenceAide')}
        </p>
        <CurrencyPicker
          code={reference}
          codes={codes}
          recentes={[]}
          onChoisir={choisirReference}
          etiquette={t('settings.referenceChoisir')}
          titre={t('settings.reference')}
        />
      </Card>

      <Card>
        <CardHeader title={t('settings.marge')} />
        <p
          className="m-0 mb-3 text-sm"
          style={{ color: 'var(--dwc-text-soft)' }}
        >
          {t('settings.margeAide')}
        </p>
        <SegmentedControl
          value={String(marge)}
          onChange={value => choisirMarge(Number(value))}
          ariaLabel={t('settings.marge')}
          options={[0, 2, 5, 10].map(valeur => ({
            value: String(valeur),
            label: t('settings.margeOption', { marge: valeur }),
          }))}
        />
        <ChampMarge marge={marge} onChoisir={choisirMarge} />
      </Card>

      <Card>
        <CardHeader title={t('settings.decimales')} />
        <p
          className="m-0 mb-3 text-sm"
          style={{ color: 'var(--dwc-text-soft)' }}
        >
          {t('settings.decimalesAide')}
        </p>
        <SegmentedControl
          value={decimales === null ? 'auto' : String(decimales)}
          onChange={value =>
            choisirDecimales(value === 'auto' ? null : Number(value))
          }
          ariaLabel={t('settings.decimales')}
          options={[
            { value: 'auto', label: t('settings.decimalesAuto') },
            ...[0, 2, 4, 6].map(valeur => ({
              value: String(valeur),
              label: String(valeur),
            })),
          ]}
        />
        <ChampDecimales decimales={decimales} onChoisir={choisirDecimales} />
      </Card>

      <Card>
        <CardHeader title={t('settings.appearance')} />
        <ChromePrefs label={t('settings.appearance')}>
          <SegmentedControl
            value={locale}
            onChange={value => setLocale(value as typeof locale)}
            ariaLabel={t('settings.language')}
            options={locales.map(code => ({
              value: code,
              label: code.toUpperCase(),
            }))}
          />
        </ChromePrefs>
      </Card>

      <Card>
        <CardHeader title={t('settings.data')} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void exporter()}>
            {t('settings.export')}
          </Button>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            {t('settings.import')}
          </Button>
          {/* Le vrai champ est masqué visuellement, pas retiré de l'arbre :
              il garde son nom accessible, et un test peut lui donner un
              fichier sans passer par la boîte de dialogue du système. */}
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label={t('settings.import')}
            onChange={event => void onFile(event)}
          />
          <Button variant="danger" onClick={() => setConfirming(true)}>
            {t('settings.reset')}
          </Button>
        </div>
        {imported !== null && (
          <p role="status" className="m-0 mt-3 text-sm">
            {fmt.plural(imported, m.settings.imported, { count: imported })}
          </p>
        )}
        {failed && error && (
          <p role="alert" className="m-0 mt-3 text-sm">
            {t('settings.importFailed', { error })}
          </p>
        )}
      </Card>

      {/* LA MESURE D’AUDIENCE SE RETIRE ICI, EN UN CLIC, comme elle s’accepte
          au bandeau (RGPD, art. 7.3). Relevé du 29/09/2026 : dix-huit apps
          mesuraient après consentement, aucune ne permettait d’y revenir.
          Mêmes clé et chargeur que le bandeau d’`App.tsx`, titre au rang des
          `CardHeader`. Sans clé, la section ne rend rien : `empty:hidden`
          retire alors la carte restée vide. */}
      <Card className="empty:hidden">
        <ConsentSection
          posthogKey={import.meta.env.VITE_POSTHOG_KEY}
          loader={() => import('posthog-js/dist/module.slim.js')}
          headingLevel={3}
          titleClassName="text-fluid-base font-semibold"
        />
      </Card>

      <ConfirmDialog
        open={confirming}
        destructive
        title={t('settings.resetConfirm')}
        message={t('settings.resetBody')}
        onConfirm={() => {
          void clear();
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      />

      <ConfirmDialog
        open={pending !== null}
        title={t('settings.importConfirm')}
        message={t('settings.importBody')}
        onConfirm={() => {
          const json = pending;
          setPending(null);
          if (json !== null) void runImport(json);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

/** La marge tapée, de 0 à 100. Les raccourcis remplissent le champ. */
function ChampMarge({
  marge,
  onChoisir,
}: {
  marge: number;
  onChoisir: (marge: number) => void;
}) {
  const { t, locale } = useI18n();
  const affiche = formatNumber(marge, locale, { maximumFractionDigits: 2 });
  const [brouillon, setBrouillon] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);

  return (
    <TextField
      className="mt-3"
      label={t('settings.margeSaisie')}
      hint={t('settings.margeUnite')}
      inputMode="decimal"
      autoComplete="off"
      value={brouillon ?? affiche}
      error={erreur ? t('settings.margeInvalide') : undefined}
      onFocus={event => {
        setBrouillon(affiche);
        event.currentTarget.select();
      }}
      onBlur={() => {
        setBrouillon(null);
        setErreur(false);
      }}
      onChange={event => {
        const suivant = event.target.value;
        setBrouillon(suivant);
        const lu = lireMontant(suivant, locale);
        if (lu === null || lu < 0 || lu > 100) {
          setErreur(suivant.trim() !== '');
          return;
        }
        setErreur(false);
        onChoisir(arrondir(lu, 2));
      }}
    />
  );
}

/** Un nombre de 0 à 8. Vide : les décimales de la devise. */
function ChampDecimales({
  decimales,
  onChoisir,
}: {
  decimales: number | null;
  onChoisir: (decimales: number | null) => void;
}) {
  const { t } = useI18n();
  const affiche = decimales === null ? '' : String(decimales);
  const [brouillon, setBrouillon] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);

  return (
    <TextField
      className="mt-3"
      label={t('settings.decimalesSaisie')}
      hint={t('settings.decimalesUnite')}
      inputMode="numeric"
      autoComplete="off"
      placeholder={t('settings.decimalesAuto')}
      value={brouillon ?? affiche}
      error={erreur ? t('settings.decimalesInvalide') : undefined}
      onFocus={event => {
        setBrouillon(affiche);
        event.currentTarget.select();
      }}
      onBlur={() => {
        setBrouillon(null);
        setErreur(false);
      }}
      onChange={event => {
        const suivant = event.target.value;
        setBrouillon(suivant);
        const lu = suivant.trim();
        if (lu === '') {
          setErreur(false);
          onChoisir(null);
          return;
        }
        if (!/^\d+$/.test(lu) || Number(lu) > 8) {
          setErreur(true);
          return;
        }
        setErreur(false);
        onChoisir(Number(lu));
      }}
    />
  );
}

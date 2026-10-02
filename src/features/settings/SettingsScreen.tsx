import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { TextField } from '@mister-guiiug/dev-pwa-config/react/field';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { Card } from '@mister-guiiug/dev-pwa-config/react/card';
import { ConfirmDialog } from '@mister-guiiug/dev-pwa-config/react/confirm-dialog';
import { ConsentSection } from '@mister-guiiug/dev-pwa-config/react/consent-section';
import { SegmentedControl } from '@mister-guiiug/dev-pwa-config/react/segmented-control';
import { ThemeToggle } from '@mister-guiiug/dev-pwa-config/react/theme-toggle';
import { useThemeContext } from '@mister-guiiug/dev-pwa-config/react/theme-provider';
import { AppVersion } from '@mister-guiiug/dev-pwa-config/react/app-version';
import { useAppUpdates } from '@mister-guiiug/dev-pwa-config/react/app-updates';
import { applyUpdate } from '@mister-guiiug/dev-pwa-config/sw-update';
import { dateSlug, downloadText } from '@mister-guiiug/dev-pwa-config/download';
import { useI18n } from '../../i18n/index.ts';
import { backend } from '../../backend/index.ts';
import { usePreferences } from '../../app/preferences.ts';
import { rechargerLaPage } from '../../app/application.ts';
import { useTaux } from '../../rates/store.ts';
import { codesConnus } from '../../rates/service.ts';
import { useCarnet } from '../carnet/store.ts';
import { CurrencyPicker } from '../convert/CurrencyPicker.tsx';
import { arrondir, decimalesDe, lireMontant } from '../../domain/money.ts';

/**
 * L'écran de réglages : le seul écran que TOUTES les apps de la famille ont, et
 * dont la COMPOSITION reste métier — c'est pourquoi le socle livre les briques
 * (`ThemeProvider`, `AppVersion`, `AppUpdates`, `ConfirmDialog`,
 * `downloadText`) et non l'écran.
 *
 * QUATRE SECTIONS, PAS SIX CARTES. Relevé du 03/10/2026 : six cartes de même
 * rang, deux écrans de téléphone, des titres qui sautaient du `h1` de
 * l'en-tête aux `h3` des cartes. Chaque section est une carte titrée au rang 2
 * — Conversion, Affichage, Carnet, Application —, ses réglages au rang 3.
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
  const nombre = conversions.length;

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
      <Card>
        <TitreSection>{t('settings.conversion')}</TitreSection>
        <Reglages>
          {/* LA MONNAIE DE RÉFÉRENCE (spécification 002, récit 1) : celle
              dans laquelle on compte. La liste est celle de Convertir,
              drapeaux compris ; choisir la devise affichée échange les deux. */}
          <Reglage
            titre={t('settings.reference')}
            aide={t('settings.referenceAide')}
          >
            <div className="w-full">
              <CurrencyPicker
                code={reference}
                codes={codes}
                recentes={[]}
                onChoisir={choisirReference}
                etiquette={t('settings.referenceChoisir')}
                titre={t('settings.reference')}
              />
            </div>
          </Reglage>
          <Reglage titre={t('settings.marge')} aide={t('settings.margeAide')}>
            <ChoixMarge reference={reference} />
          </Reglage>
          <Reglage
            titre={t('settings.decimales')}
            aide={t('settings.decimalesAide')}
          >
            <ChoixDecimales reference={reference} />
          </Reglage>
        </Reglages>
      </Card>

      <Card>
        <TitreSection>{t('settings.affichage')}</TitreSection>
        <Reglages>
          <Reglage titre={t('settings.theme')}>
            <ChoixTheme />
          </Reglage>
          <Reglage titre={t('settings.language')}>
            {/* Chaque langue se nomme dans la sienne, comme partout ailleurs :
                « FR / EN » ne dit rien à qui ne lit pas l'autre. */}
            <SegmentedControl
              value={locale}
              onChange={value => setLocale(value as typeof locale)}
              ariaLabel={t('settings.language')}
              options={locales.map(code => ({
                value: code,
                label: (
                  <span lang={code}>{NOMS_DES_LANGUES[code] ?? code}</span>
                ),
              }))}
            />
          </Reglage>
        </Reglages>
      </Card>

      <Card>
        <TitreSection>{t('settings.data')}</TitreSection>
        <p
          className="m-0 mb-3 text-sm"
          style={{ color: 'var(--dwc-text-soft)' }}
        >
          {nombre === 0
            ? t('settings.carnetVide')
            : fmt.plural(nombre, m.settings.carnetCompte, { count: nombre })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={nombre === 0}
            onClick={() => void exporter()}
          >
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
        {/* L'EFFACEMENT À PART, sous un filet, avec ce qu'il fait : il
            côtoyait l'export, rouge et sans un mot, à un geste de lui. */}
        <div
          className="mt-4 flex flex-col items-start gap-2 border-t pt-4"
          style={{ borderColor: 'var(--dwc-border)' }}
        >
          <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
            {t('settings.resetAide')}
          </p>
          <Button
            variant="danger"
            disabled={nombre === 0}
            onClick={() => setConfirming(true)}
          >
            {t('settings.reset')}
          </Button>
        </div>
      </Card>

      <Card>
        <TitreSection>{t('settings.application')}</TitreSection>
        <ReglagesApplication />
      </Card>

      {/* LA MESURE D’AUDIENCE SE RETIRE ICI, EN UN CLIC, comme elle s’accepte
          au bandeau (RGPD, art. 7.3). Relevé du 29/09/2026 : dix-huit apps
          mesuraient après consentement, aucune ne permettait d’y revenir.
          Mêmes clé et chargeur que le bandeau d’`App.tsx`, titre au rang des
          sections. Sans clé, la section ne rend rien : `empty:hidden`
          retire alors la carte restée vide. */}
      <Card className="empty:hidden">
        <ConsentSection
          posthogKey={import.meta.env.VITE_POSTHOG_KEY}
          loader={() => import('posthog-js/dist/module.slim.js')}
          headingLevel={2}
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

/** Le nom de chaque langue, dans cette langue. */
const NOMS_DES_LANGUES: Record<string, string> = {
  fr: 'Français',
  en: 'English',
};

/**
 * Le titre d'une section, au rang 2, en sur-titre : petites capitales,
 * couleur atténuée. Plus grand que les titres de réglage, il les écrasait ;
 * plus petit sans changer de forme, il se lisait comme l'un d'eux.
 */
function TitreSection({ children }: { children: ReactNode }) {
  return (
    <h2
      className="m-0 mb-4 text-xs font-semibold tracking-wider uppercase"
      style={{ color: 'var(--dwc-text-soft)' }}
    >
      {children}
    </h2>
  );
}

/** Les réglages d'une section, séparés d'un filet. */
function Reglages({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex flex-col divide-y"
      style={{ borderColor: 'var(--dwc-border)' }}
    >
      {children}
    </div>
  );
}

/** Un réglage : son titre au rang 3, ce qu'il fait, puis sa commande. */
function Reglage({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-start gap-2 py-4 first:pt-0 last:pb-0"
      style={{ borderColor: 'var(--dwc-border)' }}
    >
      <h3 className="m-0 text-base font-semibold">{titre}</h3>
      {aide && (
        <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
          {aide}
        </p>
      )}
      {children}
    </div>
  );
}

/** Les raccourcis de la marge, en pour cent. */
const RACCOURCIS_MARGE = [0, 2, 5, 10];

/**
 * LA MARGE : des raccourcis, et un champ seulement pour « Autre ». Le champ
 * libre (#20) restait ouvert sous les raccourcis et répétait leur valeur ;
 * il ne s'ouvre plus qu'à la demande, ou quand la marge enregistrée n'est
 * pas un raccourci. Un exemple dit ce qu'elle retient, dans la monnaie de
 * référence.
 */
function ChoixMarge({ reference }: { reference: string }) {
  const { t, locale } = useI18n();
  const marge = usePreferences(state => state.marge);
  const choisirMarge = usePreferences(state => state.choisirMarge);
  const [libre, setLibre] = useState(() => !RACCOURCIS_MARGE.includes(marge));
  const montant = (n: number) =>
    `${formatNumber(n, locale, { maximumFractionDigits: 2 })} ${reference}`;

  return (
    <>
      <SegmentedControl
        value={libre ? 'autre' : String(marge)}
        onChange={value => {
          if (value === 'autre') {
            setLibre(true);
            return;
          }
          setLibre(false);
          choisirMarge(Number(value));
        }}
        ariaLabel={t('settings.marge')}
        options={[
          ...RACCOURCIS_MARGE.map(valeur => ({
            value: String(valeur),
            label: t('settings.margeOption', { marge: valeur }),
          })),
          { value: 'autre', label: t('settings.autre') },
        ]}
      />
      {libre && <ChampMarge marge={marge} onChoisir={choisirMarge} />}
      {marge > 0 && (
        <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
          {t('settings.margeExemple', {
            montant: montant(100),
            recu: montant(arrondir(100 - marge, 2)),
            garde: montant(marge),
          })}
        </p>
      )}
    </>
  );
}

/** Les raccourcis des décimales ; « Auto » suit la devise. */
const RACCOURCIS_DECIMALES = [0, 2, 4, 6];
/** Le montant de l'aperçu : assez de chiffres pour que chaque choix se voie. */
const EXEMPLE = 1234.5678;

/**
 * LES DÉCIMALES : des raccourcis, un champ seulement pour « Autre », et
 * l'aperçu d'un montant tel qu'il s'affichera.
 */
function ChoixDecimales({ reference }: { reference: string }) {
  const { t, locale } = useI18n();
  const decimales = usePreferences(state => state.decimales);
  const choisirDecimales = usePreferences(state => state.choisirDecimales);
  const [libre, setLibre] = useState(
    () => decimales !== null && !RACCOURCIS_DECIMALES.includes(decimales)
  );
  const chiffres = decimales ?? decimalesDe(reference);
  const apercu = formatNumber(arrondir(EXEMPLE, chiffres), locale, {
    minimumFractionDigits: chiffres,
    maximumFractionDigits: chiffres,
  });

  return (
    <>
      <SegmentedControl
        value={
          libre ? 'autre' : decimales === null ? 'auto' : String(decimales)
        }
        onChange={value => {
          if (value === 'autre') {
            setLibre(true);
            return;
          }
          setLibre(false);
          choisirDecimales(value === 'auto' ? null : Number(value));
        }}
        ariaLabel={t('settings.decimales')}
        options={[
          { value: 'auto', label: t('settings.decimalesAuto') },
          ...RACCOURCIS_DECIMALES.map(valeur => ({
            value: String(valeur),
            label: String(valeur),
          })),
          { value: 'autre', label: t('settings.autre') },
        ]}
      />
      {libre && (
        <ChampDecimales decimales={decimales} onChoisir={choisirDecimales} />
      )}
      <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
        {t('settings.decimalesApercu', { montant: `${apercu} ${reference}` })}
      </p>
    </>
  );
}

/** Une option de la bascule du thème : son icône, puis son nom. */
function Option({
  icone: Icone,
  children,
}: {
  icone: ComponentType<{
    className?: string;
    'aria-hidden'?: boolean | 'true';
  }>;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icone aria-hidden="true" className="size-4" />
      {children}
    </span>
  );
}

/**
 * LE THÈME, NOMMÉ. L'écran ne montrait qu'une icône qui faisait défiler les
 * trois thèmes : on ne savait ni lequel était choisi, ni ce que donnerait le
 * clic. Les trois se voient ici. L'état est celui de `ThemeProvider` (voir
 * `App.tsx`) : le même que la bascule de l'en-tête, qui suit. Sans
 * fournisseur, la bascule du socle prend le relais plutôt qu'un second
 * `useTheme`, qui écrirait le thème à côté du premier.
 */
function ChoixTheme() {
  const { t } = useI18n();
  const contexte = useThemeContext();
  if (!contexte) return <ThemeToggle showLabel />;
  return (
    <SegmentedControl
      value={contexte.theme}
      onChange={value => contexte.setTheme(value)}
      ariaLabel={t('settings.theme')}
      options={[
        {
          value: 'system',
          label: <Option icone={Monitor}>{t('settings.themeSysteme')}</Option>,
        },
        {
          value: 'light',
          label: <Option icone={Sun}>{t('settings.themeClair')}</Option>,
        },
        {
          value: 'dark',
          label: <Option icone={Moon}>{t('settings.themeSombre')}</Option>,
        },
      ]}
    />
  );
}

/**
 * RECHARGER L'APPLICATION. Installée, elle n'a ni barre d'adresse ni bouton
 * de rechargement : ce réglage est son seul moyen de repartir de zéro.
 *
 * - « Recharger » relance la page ; quand une nouvelle version attend, il
 *   l'applique (`update` d'`AppUpdates`) au lieu de recharger l'ancienne.
 * - « Forcer la mise à jour » est le geste du socle pour une application
 *   restée ancienne ou bloquée (`forceUpdate`, ou `applyUpdate({ hard })`
 *   hors fournisseur) : il vide son cache et la recharge. Ni le carnet ni les
 *   réglages ne sont touchés (`sw-update.js` : jamais `localStorage`,
 *   `sessionStorage` ni IndexedDB).
 */
function ReglagesApplication() {
  const { t } = useI18n();
  const majs = useAppUpdates();
  const [enCours, setEnCours] = useState(false);
  const occupe = enCours || majs?.updating === true;
  const idAide = useId();

  const recharger = () => {
    if (majs?.needRefresh) {
      void majs.update();
      return;
    }
    setEnCours(true);
    rechargerLaPage();
  };
  const forcer = () => {
    if (majs) {
      void majs.forceUpdate();
      return;
    }
    setEnCours(true);
    void applyUpdate({ hard: true });
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <AppVersion className="m-0 text-sm" />
      {majs?.needRefresh && (
        <p role="status" className="m-0 text-sm font-semibold">
          {t('settings.majPrete')}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={recharger}
          disabled={occupe}
          loading={occupe}
          aria-describedby={idAide}
        >
          {occupe ? t('settings.rechargement') : t('settings.recharger')}
        </Button>
        <Button
          variant="outline"
          onClick={forcer}
          disabled={occupe}
          aria-describedby={idAide}
        >
          {t('settings.forcer')}
        </Button>
      </div>
      <p
        id={idAide}
        className="m-0 text-sm"
        style={{ color: 'var(--dwc-text-soft)' }}
      >
        {t('settings.rechargerAide')}
      </p>
    </div>
  );
}

/** La marge tapée, de 0 à 100. */
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
      className="w-full max-w-xs"
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
      className="w-full max-w-xs"
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

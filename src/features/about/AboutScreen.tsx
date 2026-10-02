import type { ReactNode } from 'react';
import {
  ArrowUpDown,
  Banknote,
  ChartLine,
  NotebookPen,
  WifiOff,
} from 'lucide-react';
import { AppVersion } from '@mister-guiiug/dev-pwa-config/react/app-version';
import { Card, CardHeader } from '@mister-guiiug/dev-pwa-config/react/card';
import { FamilyAbout } from '@mister-guiiug/dev-pwa-config/react/family-about';
import { useI18n } from '../../i18n/index.ts';
import { APP_ID, REPO_URL } from '../../app/links.ts';
import { env } from '../../app/config/env.ts';

/** Les sources de taux, nommées et liées (spécification 002, récit 4). */
const SOURCES = [
  { nom: 'Frankfurter', url: 'https://frankfurter.dev/', cle: 'bce' },
  {
    nom: 'fawazahmed0/currency-api',
    url: 'https://github.com/fawazahmed0/exchange-api',
    cle: 'marche',
  },
] as const;

/** Les origines que l'application interroge : celles de `connect-src`. */
const ORIGINES = [
  'api.frankfurter.dev',
  'cdn.jsdelivr.net',
  'currency-api.pages.dev',
] as const;

/**
 * L'écran « à propos » : qui elle est, ce qu'elle fait, d'où viennent ses
 * chiffres, ce qui quitte l'appareil ; puis l'installation, la grille de la
 * famille et le pied de page, que `FamilyAbout` du socle compose.
 *
 * UNE PHRASE NE S'Y LIT QU'UNE FOIS. La première version mettait la
 * description de l'application en sous-titre ET en corps de la même carte,
 * sous un titre qui répétait celui de la page ; la confidentialité n'était
 * qu'un paragraphe sous « Billets et pièces ». Chaque section a désormais son
 * titre, et la confidentialité la sienne.
 *
 * LE PIED DE PAGE EST ICI ET SUR L'ACCUEIL, nulle part ailleurs — la règle
 * famille du 06/09/2026, que `pwa-doctor` vérifie.
 */
export function AboutScreen() {
  const { t } = useI18n();
  // Dire « aucune mesure » n'est vrai que si rien n'est posé au build : avec
  // une clé PostHog, le bandeau et les réglages en parlent à leur place.
  const sansMesure = !import.meta.env.VITE_POSTHOG_KEY && !env.VITE_SENTRY_DSN;

  return (
    <FamilyAbout currentAppId={APP_ID} repoUrl={REPO_URL} issues>
      <Card className="flex items-center gap-4">
        <img
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="m-0 text-fluid-lg font-bold">{t('app.name')}</h2>
          <p className="m-0">{t('about.accroche')}</p>
          {/* `AppVersion` rend un paragraphe : son conteneur est un bloc. */}
          <div className="text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
            <AppVersion className="m-0" />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title={t('about.fonctions')} id="about-fonctions" />
        <ul
          aria-labelledby="about-fonctions"
          className="m-0 flex list-none flex-col gap-3 p-0"
        >
          <Fonction icone={<ArrowUpDown />}>
            {t('about.fonction.convertir')}
          </Fonction>
          <Fonction icone={<Banknote />}>
            {t('about.fonction.billets')}
          </Fonction>
          <Fonction icone={<ChartLine />}>
            {t('about.fonction.historique')}
          </Fonction>
          <Fonction icone={<NotebookPen />}>
            {t('about.fonction.carnet')}
          </Fonction>
          <Fonction icone={<WifiOff />}>
            {t('about.fonction.horsLigne')}
          </Fonction>
        </ul>
      </Card>

      {/* La provenance des taux, la raison des dessins et ce qui part chez un
          tiers : les trois choses que la constitution demande de dire
          (principes I et III, contrainte de confidentialité). */}
      <Card>
        <CardHeader title={t('about.sources')} />
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {SOURCES.map(source => (
            <li key={source.cle}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.nom}
              </a>
              {' : '}
              {t(`about.source.${source.cle}`)}
            </li>
          ))}
        </ul>
        <p className="m-0 mt-2" style={{ color: 'var(--dwc-text-soft)' }}>
          {t('about.indicatif')}
        </p>
      </Card>

      <Card>
        <CardHeader title={t('about.billets')} />
        <p className="m-0">{t('about.billetsBody')}</p>
      </Card>

      <Card as="section" aria-labelledby="about-confidentialite">
        <CardHeader
          title={t('about.confidentialite')}
          id="about-confidentialite"
        />
        <div className="flex flex-col gap-2">
          <p className="m-0">{t('about.surAppareil')}</p>
          <p className="m-0">{t('about.tiers')}</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {ORIGINES.map(origine => (
              <li key={origine}>
                <code
                  className="rounded px-1.5 py-0.5 text-sm"
                  style={{ background: 'var(--dwc-surface-2)' }}
                >
                  {origine}
                </code>
              </li>
            ))}
          </ul>
          {sansMesure && <p className="m-0">{t('about.sansMesure')}</p>}
        </div>
      </Card>
    </FamilyAbout>
  );
}

/** Une fonction de l'application : son icône, sa phrase. */
function Fonction({
  icone,
  children,
}: {
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full [&>svg]:size-5"
        style={{
          background: 'var(--dwc-surface-2)',
          color: 'var(--dwc-primary)',
        }}
      >
        {icone}
      </span>
      <span className="pt-1.5">{children}</span>
    </li>
  );
}

import type { ReactNode } from 'react';
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

/** Ce que l'application doit à d'autres, avec leur licence. */
const CREDITS = [
  {
    nom: 'country-flag-icons',
    url: 'https://gitlab.com/catamphetamine/country-flag-icons',
    cle: 'drapeaux',
  },
  {
    nom: 'Wikimedia Commons',
    url: 'https://commons.wikimedia.org/',
    cle: 'photos',
  },
] as const;

/** Les origines que l'application interroge : celles de `connect-src`. */
const ORIGINES = [
  'api.frankfurter.dev',
  'cdn.jsdelivr.net',
  'currency-api.pages.dev',
] as const;

/**
 * L'écran « à propos » : qui elle est, puis une seule lecture sur les taux,
 * les billets et les données. Les fonctions ne sont pas relistées : la
 * navigation les montre déjà. Le nom, la version, les sources liées, la
 * confidentialité et les crédits restent (spécification 002, récit 4).
 *
 * LE PIED DE PAGE EST ICI ET SUR L'ACCUEIL, nulle part ailleurs — la règle
 * famille du 06/09/2026, que `pwa-doctor` vérifie. `FamilyAbout` le compose,
 * avec la grille de la famille, après ces cartes.
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
          <div className="text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
            <AppVersion className="m-0" />
          </div>
        </div>
      </Card>

      <Card as="section" aria-labelledby="about-savoir">
        <CardHeader title={t('about.savoir')} id="about-savoir" />
        <div className="flex flex-col gap-4">
          <Bloc titre={t('about.taux')}>
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
            <p className="m-0" style={{ color: 'var(--dwc-text-soft)' }}>
              {t('about.indicatif')}
            </p>
          </Bloc>
          <Bloc titre={t('about.billets')}>
            <p className="m-0">{t('about.billetsBody')}</p>
          </Bloc>
          <Bloc titre={t('about.donnees')}>
            <p className="m-0">{t('about.surAppareil')}</p>
            <details className="text-sm">
              <summary style={{ color: 'var(--dwc-text-soft)' }}>
                {t('about.adresses')}
              </summary>
              <div className="mt-2 flex flex-col gap-2">
                <p className="m-0">{t('about.tiers')}</p>
                <p className="m-0">{ORIGINES.join(', ')}</p>
                <p className="m-0">{t('about.tiersPhotos')}</p>
                {sansMesure && <p className="m-0">{t('about.sansMesure')}</p>}
              </div>
            </details>
          </Bloc>
        </div>
      </Card>

      <Card>
        <CardHeader title={t('about.credits')} />
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {CREDITS.map(credit => (
            <li key={credit.cle}>
              <a href={credit.url} target="_blank" rel="noreferrer">
                {credit.nom}
              </a>
              {' : '}
              {t(`about.credit.${credit.cle}`)}
            </li>
          ))}
        </ul>
      </Card>
    </FamilyAbout>
  );
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="m-0 text-sm font-semibold">{titre}</h3>
      {children}
    </div>
  );
}

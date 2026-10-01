import { Card, CardHeader } from '@mister-guiiug/dev-pwa-config/react/card';
import { FamilyAbout } from '@mister-guiiug/dev-pwa-config/react/family-about';
import { useI18n } from '../../i18n/index.ts';
import { APP_ID, REPO_URL } from '../../app/links.ts';

/**
 * L'écran « à propos » : installation, grille famille, pied de page.
 *
 * PROMU, PAS INVENTÉ. Cet écran assemblait déjà `PwaInstallPrompt` +
 * `FamilyApps` (`showSource={false}`) + `AppFooter` — `FamilyAbout` du socle
 * est exactement cette composition. L'intro métier reste en `children`.
 *
 * LE PIED DE PAGE EST ICI ET SUR L'ACCUEIL, nulle part ailleurs — la règle
 * famille du 06/09/2026, que `pwa-doctor` vérifie.
 */
export function AboutScreen() {
  const { t } = useI18n();

  return (
    <FamilyAbout currentAppId={APP_ID} repoUrl={REPO_URL} issues>
      <Card>
        <CardHeader title={t('about.title')} subtitle={t('app.tagline')} />
        <p className="m-0">{t('about.what')}</p>
      </Card>
      {/* La provenance des taux, la raison des dessins et ce qui part chez un
          tiers : les trois choses que la constitution demande de dire
          (principes I et III, contrainte de confidentialité). */}
      <Card>
        <CardHeader title={t('about.sources')} />
        <p className="m-0">{t('about.sourcesBody')}</p>
      </Card>
      <Card>
        <CardHeader title={t('about.billets')} />
        <p className="m-0">{t('about.billetsBody')}</p>
        <p className="m-0 mt-2">{t('about.vieprivee')}</p>
      </Card>
    </FamilyAbout>
  );
}

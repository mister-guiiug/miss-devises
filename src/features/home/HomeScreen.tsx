import { AppFooter } from '@mister-guiiug/dev-pwa-config/react/app-footer';
import { REPO_URL } from '../../app/links.ts';
import { ConvertScreen } from '../convert/ConvertScreen.tsx';

/**
 * L'ACCUEIL : le convertisseur, puis le pied de page de la famille.
 *
 * Le pied de page vit ici et sur À propos, nulle part ailleurs (règle du
 * 06/09/2026). `pwa-doctor` reconnaît l'accueil à son NOM DE FICHIER
 * (`home`, `accueil`…) : posé dans `ConvertScreen`, il comptait pour un
 * troisième écran, et le contrôle `liens-famille` le relevait en dette.
 */
export function HomeScreen() {
  return (
    <>
      <ConvertScreen />
      {/* Le lien de soutien vient du catalogue ; `issues` ajoute « Signaler
          un problème », prérempli avec la version et l'écran. */}
      <AppFooter repoUrl={REPO_URL} issues className="mt-6" />
    </>
  );
}

// Accessibilité : axe-core sur chaque écran, dans les DEUX thèmes (T032).
//
// Le tag @a11y permet de filtrer en CI : `playwright test --grep @a11y`.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { expectNoA11yViolations } from '@mister-guiiug/dev-pwa-config/playwright-a11y';
import { simulerPhotos, simulerTaux } from './taux.ts';
import { simulerVoix } from './voix.ts';

interface Ecran {
  nom: string;
  /** Amène l'écran dans l'état audité : axe ne juge que ce qui est rendu. */
  aller: (page: Page) => Promise<void>;
  /** Règles écartées, chacune avec sa raison écrite à côté. */
  regles?: string[];
}

/**
 * Attend la fin des animations FINIES de la page. CopilotKit 2.0 fait
 * apparaître la réponse mot à mot, en fondu : axe lancé pendant ce fondu juge
 * une couleur de passage (mesuré : #b3b7be sur blanc, 2,01:1) et rougit au
 * hasard du minutage. Les animations sans fin (un indicateur qui pulse) sont
 * laissées de côté : leur `finished` n'arrive jamais.
 */
async function finirAnimations(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
        .map(a => a.finished.catch(() => undefined))
    )
  );
}

async function saisir200(page: Page) {
  await page.goto('/');
  await page.getByLabel('Montant en livres égyptiennes').fill('200');
  await expect(page.getByLabel('Montant en euros')).toHaveValue('3,40');
}

const ECRANS: Ecran[] = [
  {
    nom: 'accueil, montant saisi',
    aller: async page => {
      await saisir200(page);
      await expect(page.locator('[data-dwc="app-shell-skip"]')).toBeAttached();
      await expect(page.locator('main#contenu')).toBeVisible();
    },
  },
  {
    nom: 'accueil, seconde devise et calculatrice (spécification 003)',
    aller: async page => {
      await saisir200(page);
      await page.getByRole('button', { name: 'Ajouter une devise' }).click();
      const feuille = page.getByRole('dialog', { name: 'Seconde devise' });
      await feuille.getByLabel('Rechercher une devise').fill('dollar des');
      await feuille.getByRole('button', { name: /^USD/ }).click();
      await page.getByRole('button', { name: 'Calculatrice' }).click();
      const pave = page.getByRole('group', { name: 'Calculatrice' });
      await page.getByLabel('Montant en euros').click();
      await pave.getByRole('button', { name: 'plus' }).click();
      await pave.getByRole('button', { name: '1', exact: true }).click();
      await expect(page.getByText(/^=\s4,40\s€$/)).toBeVisible();
    },
  },
  {
    nom: 'mots utiles, en arabe égyptien (spécification 004)',
    aller: async page => {
      await saisir200(page);
      await page.getByRole('button', { name: 'Mots utiles' }).click();
      await expect(
        page.getByRole('dialog', { name: 'Mots utiles' }).getByRole('listitem')
      ).toHaveCount(16);
    },
  },
  {
    nom: 'accueil, frais choisis (spécification 005)',
    aller: async page => {
      await page.goto('/reglages');
      await page.getByRole('button', { name: 'Ajouter des frais' }).click();
      const feuille = page.getByRole('dialog', { name: 'Nouveaux frais' });
      await feuille.getByLabel('Libellé').fill('Carte');
      await feuille.getByLabel('Pourcentage').fill('2');
      await feuille.getByLabel('Montant fixe par opération').fill('0,50');
      await feuille.getByRole('button', { name: 'Enregistrer' }).click();
      await page.getByRole('link', { name: 'Convertir' }).click();
      await page.getByLabel('Frais').selectOption({ label: 'Carte' });
      await page.getByLabel('Montant en livres égyptiennes').fill('200');
      await expect(page.getByText(/^Coût avec frais/)).toBeVisible();
    },
  },
  {
    nom: 'réglages, nouveaux frais (spécification 005)',
    aller: async page => {
      await page.goto('/reglages');
      await page.getByRole('button', { name: 'Ajouter des frais' }).click();
      await expect(
        page.getByRole('dialog', { name: 'Nouveaux frais' })
      ).toBeVisible();
    },
  },
  {
    nom: 'mots utiles, avec une voix (spécification 005)',
    aller: async page => {
      await simulerVoix(page, ['ar-EG']);
      await saisir200(page);
      await page.getByRole('button', { name: 'Mots utiles' }).click();
      await expect(
        page.getByRole('button', { name: 'Écouter : Combien ça coûte ?' })
      ).toBeVisible();
    },
  },
  {
    nom: 'volet des billets ouvert',
    aller: async page => {
      await saisir200(page);
      await page.getByRole('button', { name: 'Billets et pièces' }).click();
      await expect(
        page.getByRole('region', { name: /Composition de/ })
      ).toBeVisible();
    },
  },
  {
    nom: 'volet des billets, avis avant les photos',
    aller: async page => {
      await saisir200(page);
      await page.getByRole('button', { name: 'Billets et pièces' }).click();
      const volet = page.getByRole('dialog', { name: 'Billets et pièces' });
      await volet.getByRole('switch', { name: 'Vraies photos' }).click();
      await expect(
        volet.getByRole('button', { name: 'Afficher les photos' })
      ).toBeFocused();
    },
  },
  {
    nom: 'volet des billets, en photos',
    aller: async page => {
      await saisir200(page);
      await page.getByRole('button', { name: 'Billets et pièces' }).click();
      const volet = page.getByRole('dialog', { name: 'Billets et pièces' });
      await volet.getByRole('switch', { name: 'Vraies photos' }).click();
      await volet.getByRole('button', { name: 'Afficher les photos' }).click();
      await expect(volet.locator('img[data-photo]').first()).toBeVisible();
      // Les crédits ouverts : axe juge aussi leurs liens.
      await volet.getByText('Crédits des photos').click();
      await expect(
        volet.getByRole('link', { name: 'Wikimedia Commons' }).first()
      ).toBeVisible();
    },
  },
  {
    // L'onglet « Modèle » et le panneau du copilote, qui sont à nous. La
    // conversation de CopilotKit reste dans son onglet masqué : axe ne juge
    // que ce qui est rendu, et ses composants ne sont pas les nôtres.
    nom: 'copilote, onglet Modèle avec Claude (spécification 007)',
    aller: async page => {
      await page.goto('/reglages');
      await page
        .getByRole('switch', { name: 'Copilote (démonstration)' })
        .click();
      await page.getByRole('link', { name: 'Convertir' }).click();
      await page.getByRole('button', { name: 'Copilote' }).click();
      const panneau = page.getByRole('complementary', { name: 'Copilote' });
      await panneau.getByRole('tab', { name: 'Modèle' }).click();
      await panneau.getByLabel(/^Claude, avec votre clé/).check();
      await expect(
        panneau.getByLabel('Votre clé d’API Anthropic')
      ).toBeVisible();
    },
  },
  {
    // LA CONVERSATION, cette fois, avec la fiche de conversion que l'app y
    // rend. L'entrée précédente l'évitait ; c'est ainsi qu'en thème sombre la
    // fiche est restée illisible (texte sombre sur fond sombre) sans qu'axe le
    // voie : CopilotKit n'active son thème sombre que sous une classe `.dark`,
    // et l'app pose `data-theme`.
    nom: 'copilote, conversation avec une fiche de conversion (spécification 007)',
    aller: async page => {
      await page.goto('/reglages');
      await page
        .getByRole('switch', { name: 'Copilote (démonstration)' })
        .click();
      await page.getByRole('link', { name: 'Convertir' }).click();
      await page.getByRole('button', { name: 'Copilote' }).click();
      const panneau = page.getByRole('complementary', { name: 'Copilote' });
      await panneau.getByRole('textbox').fill('1200 JPY');
      await panneau.getByRole('button', { name: 'Envoyer' }).click();
      await expect(
        panneau.getByText('Calculé par l’application')
      ).toBeVisible();
      // La réponse ENTIÈRE, jusqu'à sa parenthèse finale, puis la fin de son
      // fondu : axe juge le texte tel qu'il reste, pas en train d'apparaître.
      await expect(
        panneau.getByText(/^D’après l’application : .*\)\.$/)
      ).toBeVisible();
      await finirAnimations(page);
    },
  },
  {
    nom: 'historique, courbe chargée',
    aller: async page => {
      await saisir200(page);
      await page.getByRole('link', { name: 'Historique' }).click();
      await expect(page.getByText('Plus haut', { exact: true })).toBeVisible();
    },
  },
  {
    nom: 'carnet vide',
    aller: async page => {
      await page.goto('/carnet');
      await expect(
        page.getByText('Aucune conversion enregistrée.')
      ).toBeVisible();
    },
  },
  {
    nom: 'carnet avec une ligne',
    aller: async page => {
      await saisir200(page);
      await page.getByLabel('Libellé').fill('Visite du musée');
      await page.getByRole('button', { name: 'Enregistrer' }).click();
      await page.getByRole('link', { name: 'Carnet' }).click();
      await expect(
        page.getByRole('heading', { name: 'Visite du musée' })
      ).toBeVisible();
    },
  },
  {
    nom: 'réglages',
    aller: async page => {
      await page.goto('/reglages');
      await expect(
        page.getByRole('button', { name: 'Exporter le carnet' })
      ).toBeVisible();
    },
  },
  {
    nom: 'à propos, coquille et FamilyAbout',
    aller: async page => {
      await page.goto('/a-propos');
      await expect(page.locator('[data-dwc="family-about"]')).toBeVisible();
      await expect(page.locator('[data-dwc="app-footer"]')).toBeVisible();
    },
  },
];

// Le Chrome de Playwright se déclare en thème CLAIR : sans `colorScheme`, le
// thème sombre n'aurait jamais été audité (relevé sur miss-dice, 23/09/2026).
for (const theme of ['light', 'dark'] as const) {
  test.describe(`@a11y thème ${theme === 'light' ? 'clair' : 'sombre'}`, () => {
    test.use({ colorScheme: theme });

    // La conversion se vérifie AVEC un taux : sans lui, axe ne verrait que
    // l'écran d'attente.
    test.beforeEach(async ({ page }) => {
      await simulerTaux(page);
      await simulerPhotos(page);
    });

    for (const ecran of ECRANS) {
      test(`${ecran.nom}, sans violation`, async ({ page }) => {
        await ecran.aller(page);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expectNoA11yViolations(
          page,
          AxeBuilder,
          expect,
          ecran.regles ? { disableRules: ecran.regles } : undefined
        );
      });
    }
  });
}

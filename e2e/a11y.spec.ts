// Accessibilité : axe-core sur chaque écran, dans les DEUX thèmes (T032).
//
// Le tag @a11y permet de filtrer en CI : `playwright test --grep @a11y`.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { expectNoA11yViolations } from '@mister-guiiug/dev-pwa-config/playwright-a11y';
import { simulerTaux } from './taux.ts';

interface Ecran {
  nom: string;
  /** Amène l'écran dans l'état audité : axe ne juge que ce qui est rendu. */
  aller: (page: Page) => Promise<void>;
  /** Règles écartées, chacune avec sa raison écrite à côté. */
  regles?: string[];
}

async function saisir200(page: Page) {
  await page.goto('/');
  await page.getByLabel('Montant en livre égyptienne').fill('200');
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
    nom: 'historique, courbe chargée',
    aller: async page => {
      await saisir200(page);
      await page.getByRole('link', { name: 'Historique' }).click();
      await expect(page.getByText('Plus haut', { exact: true })).toBeVisible();
    },
    // EXCEPTION TEMPORAIRE, UNE RÈGLE : le `Stat` du socle 6.21 rend un
    // `<dl>` invalide (un `<div>` autour du seul `<dt>`). Corrigé en amont
    // par dev-pwa-config#415 ; retirer à la montée qui l'embarque.
    regles: ['definition-list'],
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

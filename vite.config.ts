import { defineConfig, type PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { pwaBaseOptions } from '@mister-guiiug/dev-pwa-config/vite-pwa';
import {
  pwaSeoPlugin,
  spaFallbackPlugin,
} from '@mister-guiiug/dev-pwa-config/vite-pwa-base';
import { cspPlugin } from '@mister-guiiug/dev-pwa-config/vite-csp';
import { versionPlugin } from '@mister-guiiug/dev-pwa-config/vite-version';
import { devPortOf } from '@mister-guiiug/dev-pwa-config/apps-catalog';

/**
 * LE MANIFESTE NE S'ÉCRIT PAS À LA MAIN.
 *
 * `pwaBaseOptions({ id })` engendre le manifeste complet — `id`, `lang`, scope,
 * `start_url`, icônes `any` ET `maskable`, couleurs lues dans la palette de
 * l'app — et les options Workbox qui vont avec. C'est le module que le socle
 * publie depuis longtemps et que **zéro application n'importait** : les vingt
 * `vite.config.ts` du parc font de 83 à 380 lignes, dont une centaine à
 * recopier ce que cette fonction rend. Les défauts qui en découlaient se
 * mesuraient en production le 02/09/2026 : `lang: en` sur trois apps
 * françaises, `id` absent six fois, `maskable` absent trois fois.
 *
 * Ce fichier est court exprès. Tout ce qui n'y est pas est une décision que le
 * socle a déjà prise, et qu'une app n'a pas à reprendre.
 */
const analyze = process.env.ANALYZE === '1';
const APP_ID = 'miss-devises';

/**
 * LES HÔTES DES PHOTOS (spécification 002, recherche R5) : les vignettes de
 * Wikimedia Commons, et ses originaux quand ils sont plus étroits que la
 * vignette. Ils ne servent qu'en mode photos, que l'utilisateur choisit.
 */
const HOTES_PHOTOS = [
  'https://thumb.wikimedia.org',
  'https://upload.wikimedia.org',
];

/**
 * LE COPILOTE DE DÉMONSTRATION (spécification 007) : ses morceaux vivent sous
 * `assets/copilote/`, NOMMÉS SANS EMPREINTE ET HORS DU PRÉCACHE.
 *
 * Hors du précache : CopilotKit, le client AG-UI et le SDK d'Anthropic ne se
 * téléchargent que pour qui active le copilote — le service worker ne les
 * impose pas à tous les visiteurs. Sans empreinte : un morceau hors précache
 * nommé par son contenu meurt au déploiement suivant, alors que la coquille
 * précachée le demande encore (`pwa-doctor`, règle `chunk-hors-precache`).
 *
 * QUI EST DU COPILOTE SE LIT DANS LE GRAPHE, PAS DANS UNE LISTE. Le rendu
 * Markdown de CopilotKit tire Shiki, Mermaid et KaTeX : des centaines de
 * morceaux (un par langage, par thème, par diagramme) et leurs polices. Une
 * liste de paquets en oublierait ; le graphe, non. Avant le rendu, on parcourt
 * les imports depuis l'entrée SANS franchir `src/copilote/` : ce qui est
 * atteint est l'application. Un morceau dont aucun module n'en est est du
 * copilote — y compris ceux que le copilote charge à son tour.
 *
 * Un module partagé (React, zustand, les magasins de l'écran) est atteint par
 * l'application : son morceau garde son empreinte et son précache. Sans cela,
 * l'entrée l'importerait depuis un fichier hors précache, et l'application ne
 * démarrerait plus hors ligne (`pwa-doctor`, règle `entree-hors-precache`).
 */
const DOSSIER_COPILOTE = /[\\/]src[\\/]copilote[\\/]/;

/** Un chemin comparable : barres obliques, sans requête (`?no-inline`). */
const normaliser = (chemin: string) =>
  chemin.replace(/\\/g, '/').replace(/\?.*$/, '');

/**
 * Le paquet d'un module : son chemin jusqu'au dossier du paquet, copies
 * imbriquées comprises (`node_modules/@copilotkit/core/node_modules/zod`
 * n'est pas `node_modules/zod`). `null` hors de `node_modules`.
 */
function paquetDe(id: string): string | null {
  const chemin = normaliser(id);
  const debut = chemin.indexOf('node_modules/');
  if (debut < 0) return null;
  const fin = chemin.lastIndexOf('node_modules/') + 'node_modules/'.length;
  const segments = chemin.slice(fin).split('/');
  const nom = segments[0]?.startsWith('@')
    ? segments.slice(0, 2).join('/')
    : segments[0];
  return `${chemin.slice(debut, fin)}${nom ?? ''}`;
}

/**
 * Les paquets que l'application atteint sans le copilote, posés avant le
 * rendu. Un PAQUET, pas un module : un import de `lucide-react` atteint ses
 * mille icônes dans le graphe, même si le build n'en garde que dix. Un
 * paquet que l'application n'atteint jamais est du copilote, entier.
 */
let paquetsDeLApplication: ReadonlySet<string> | null = null;

function estDuCopilote(moduleIds: readonly string[]): boolean {
  const application = paquetsDeLApplication;
  // Hors build (ou avant le parcours), rien n'est rangé à part.
  if (!application) return false;
  return moduleIds.some(id => {
    if (DOSSIER_COPILOTE.test(normaliser(id))) return true;
    const paquet = paquetDe(id);
    return paquet !== null && !application.has(paquet);
  });
}

/**
 * Les feuilles et les polices du copilote : sa CSS, et les polices de KaTeX.
 * Celles-ci n'arrivent que par un `url()` de la feuille de KaTeX : elles ne
 * portent pas leur chemin d'origine, seulement leur nom.
 */
function estUnFichierDuCopilote(asset: {
  names: readonly string[];
  originalFileNames: readonly string[];
}): boolean {
  if (asset.names.some(nom => /^(Copilote[.-]|KaTeX_)/.test(nom))) return true;
  return estDuCopilote(asset.originalFileNames);
}

function graphesDuCopilote(): PluginOption {
  return {
    name: 'miss-devises:copilote-hors-precache',
    apply: 'build',
    renderStart() {
      const atteints = new Set<string>();
      const pile = [...this.getModuleIds()].filter(
        id => this.getModuleInfo(id)?.isEntry
      );
      while (pile.length > 0) {
        const id = pile.pop()!;
        if (atteints.has(id) || DOSSIER_COPILOTE.test(normaliser(id))) {
          continue;
        }
        atteints.add(id);
        const info = this.getModuleInfo(id);
        if (info)
          pile.push(...info.importedIds, ...info.dynamicallyImportedIds);
      }
      paquetsDeLApplication = new Set(
        [...atteints].flatMap(id => paquetDe(id) ?? [])
      );
    },
  };
}

export default defineConfig(({ command }) => {
  // `VITE_BASE_PATH` est prioritaire : le déploiement famille le pose, et la
  // CI Lighthouse le met à `/` pour servir le build à la racine. Sans cette
  // priorité, l'audit part sur un chemin qui n'existe pas et rend NO_FCP.
  let basePath = '/';
  if (process.env.VITE_BASE_PATH) {
    basePath = process.env.VITE_BASE_PATH;
  } else if (command === 'build') {
    basePath = `/${APP_ID}/`;
  }

  return {
    base: basePath,
    // LE PORT VIENT DU CATALOGUE. Chaque application du parc a le sien
    // (`DEV_PORTS`), le squelette a 5240, et une application engendrée reçoit
    // un port libre à sa naissance — le générateur récrit ce repli.
    // `strictPort` : un port pris fait échouer le démarrage, au lieu de glisser
    // en silence vers un autre que `.claude/launch.json` ne connaît pas.
    server: { port: devPortOf(APP_ID, 5213), strictPort: true },
    build: {
      sourcemap: true,
      rolldownOptions: {
        output: {
          chunkFileNames: chunk =>
            estDuCopilote(chunk.moduleIds)
              ? 'assets/copilote/[name].js'
              : 'assets/[name]-[hash].js',
          assetFileNames: asset =>
            estUnFichierDuCopilote(asset)
              ? 'assets/copilote/[name]-[hash][extname]'
              : 'assets/[name]-[hash][extname]',
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      graphesDuCopilote(),

      // AVANT `cspPlugin` : il pose un script inline dans le `<head>`, que la
      // CSP doit hacher après coup.
      versionPlugin({ manifest: true }),

      pwaSeoPlugin({
        basePath,
        logoPath: '/icons/icon-512.png',
        themeColor: { light: '#f7f8fa', dark: '#0f1115' },
      }),

      // `frame-ancestors` est volontairement absent : la spécification
      // l'ignore dans une balise `<meta>`, et GitHub Pages ne pose aucun
      // en-tête. Le greffon refuse la directive plutôt que d'en donner
      // l'illusion.
      cspPlugin({
        dev: command === 'serve',
        // Ouvre les hôtes de PostHog — le nuage EUROPÉEN, `eu.i.posthog.com`
        // (ADR 0012). Sans cette option, l'ingestion que `ConsentBanner`
        // déclenche APRÈS l'accord serait refusée par la politique — et
        // l'échec ne se verrait qu'en console, sur le site déployé, une fois
        // le consentement donné.
        analytics: true,
        // LES SOURCES DE TAUX, ET ELLES SEULES (recherche R10) : la BCE via
        // Frankfurter, le marché via jsDelivr puis son repli Cloudflare
        // Pages. Le sous-domaine du repli porte la date lue
        // (`2025-10-06.currency-api.pages.dev`), d'où le joker.
        // `'self'` D'ABORD : la liste remplace le défaut du socle, qui le
        // contient. Sans lui, la sonde du réseau de « Forcer la mise à jour »
        // (`sw-update`, socle 6.28.0 : une requête HEAD vers la page avant de
        // purger) était bloquée, l'app se croyait hors ligne et ne purgeait
        // plus jamais ; en développement, la websocket du rechargement à chaud
        // l'était aussi.
        connectSrc: [
          "'self'",
          'https://api.frankfurter.dev',
          'https://cdn.jsdelivr.net',
          'https://*.currency-api.pages.dev',
          // Le copilote de démonstration avec Claude (spécification 007) :
          // le navigateur appelle l'API d'Anthropic directement, avec la clé
          // du visiteur. Rien n'y part tant qu'il n'a pas activé le copilote,
          // choisi Claude et saisi sa clé.
          'https://api.anthropic.com',
        ],
        // Les photos des coupures, et elles seules en plus du défaut.
        imgSrc: ["'self'", 'data:', 'blob:', ...HOTES_PHOTOS],
      }),

      // Repli SPA : sans `404.html`, rafraîchir un lien profond sert la page
      // d'erreur de GitHub. Quatre apps en souffraient en production.
      spaFallbackPlugin(),

      // Le manifeste sort entier de `pwaBaseOptions({ id })`. Depuis le socle
      // 4.3.0, il n'y a plus rien à lui redire ici :
      //   - `theme_color` et `background_color` sont lus dans `src/index.css`
      //     (`--dwc-primary`, `--dwc-bg`) quand l'app n'est pas au catalogue ;
      //     le build AVERTIT si aucun chemin ne donne de couleur, car sans
      //     `theme_color` l'application ne s'installe pas ;
      //   - les captures sont lues dans `public/screenshots` (`narrow.png`,
      //     `wide.png`), dimensions comprises. Elles décident de l'interface
      //     d'installation — une fiche au lieu d'une ligne et un bouton — et
      //     `npm run screenshots` les régénère depuis un build.
      // Tant que l'app n'est pas au catalogue, le manifeste prendrait
      // l'identifiant (« miss-devises ») et n'aurait pas de description
      // (audit SEO du 29/09/2026, C12) : les trois valeurs sont donc posées
      // ici. « Miss Devises » tient dans les 12 caractères d'un nom court.
      VitePWA(
        pwaBaseOptions({
          id: APP_ID,
          name: 'Miss Devises',
          shortName: 'Miss Devises',
          // Un appui long sur l'icône installée (spécification 006, récit 3).
          // URL relatives : `pwaBaseOptions` y pose la base de l'app. `?mots`
          // ouvre les mots utiles depuis l'écran Convertir.
          shortcuts: [
            { name: 'Convertir', url: './' },
            { name: 'Carnet', url: 'carnet' },
            { name: 'Mots utiles', url: '?mots' },
          ],
          description:
            'Convertisseur de devises visuel : billets et pièces sous les yeux, conversion dans les deux sens, historique des taux et conversions annotées.',
          // Le copilote de démonstration reste HORS DU PRÉCACHE (spécification
          // 007) : ses morceaux et ses polices pèsent plusieurs mégaoctets, et
          // seul qui l'active doit les télécharger. Les deux premiers motifs
          // sont ceux du socle, que `workbox` remplace sans les fusionner.
          workbox: {
            globIgnores: [
              '**/node_modules/**/*',
              '**/version.json',
              '**/assets/copilote/**',
            ],
          },
          // Les photos déjà vues restent hors ligne. La règle d'images du
          // socle ne voit pas une autre origine (Workbox n'y applique une
          // expression régulière que depuis le début de l'adresse) : celle-ci
          // la nomme. Statut 200 seulement : les images partent en CORS, une
          // réponse opaque n'a rien à faire ici.
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/(thumb|upload)\.wikimedia\.org\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'photos-commons',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: { statuses: [200] },
              },
            },
          ],
        })
      ),

      ...(analyze
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
              open: !process.env.CI,
            }) as PluginOption,
          ]
        : []),
    ],
  };
});

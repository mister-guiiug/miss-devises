#!/usr/bin/env node
/**
 * REVÉRIFIE LE JEU DES PHOTOS sur l'API de Wikimedia Commons (spécification
 * 002, `photos.md`) : chaque fichier existe encore, n'est pas proposé à la
 * suppression, garde sa licence et ses dimensions.
 *
 * Commons peut renommer, remplacer ou supprimer un fichier sans prévenir.
 * L'application ne s'en plaint pas (la photo manquante rend son dessin), mais
 * le jeu vieillit : ce script le dit. Il interroge le réseau, il ne tourne
 * donc pas en CI.
 *
 *   npm run photos:verifier
 *
 * Sortie 1 si un écart est trouvé ; rien n'est réécrit.
 */
import { readFileSync } from 'node:fs';

const UA =
  'miss-devises/verifier-photos (https://github.com/mister-guiiug/miss-devises)';
const API = 'https://commons.wikimedia.org/w/api.php';
const jeu = JSON.parse(
  readFileSync(new URL('../src/data/photos.json', import.meta.url), 'utf8')
);

/** Les licences que l'API ne rend pas : la base légale relevée à la main. */
const LICENCES_RELEVEES = new Set([
  'Euro coin common face (Commission européenne)',
]);

const photos = Object.entries(jeu.devises).flatMap(([code, d]) =>
  [...d.billets, ...d.pieces].map(photo => ({ code, photo }))
);

const texte = html =>
  String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function interroger(titres) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    maxlag: '5',
    prop: 'imageinfo|categories',
    iiprop: 'size|extmetadata',
    iiextmetadatafilter: 'LicenseShortName',
    cllimit: 'max',
    titles: titres.join('|'),
  });
  for (let essai = 0; essai < 5; essai++) {
    const reponse = await fetch(`${API}?${params}`, {
      headers: { 'User-Agent': UA },
    });
    const json = await reponse.json();
    if (json.error?.code !== 'maxlag') return json;
    await new Promise(fin => setTimeout(fin, 5000));
  }
  throw new Error('Commons reste en surcharge (maxlag)');
}

const ecarts = [];
for (let i = 0; i < photos.length; i += 50) {
  const lot = photos.slice(i, i + 50);
  const json = await interroger(
    lot.map(({ photo }) => `File:${photo.fichier}`)
  );
  const pages = new Map(json.query.pages.map(page => [page.title, page]));
  for (const { code, photo } of lot) {
    const nom = `${code} ${photo.valeur} (${photo.fichier})`;
    const page = pages.get(`File:${photo.fichier}`);
    if (!page || page.missing || !page.imageinfo) {
      ecarts.push(`${nom} : absent de Commons`);
      continue;
    }
    const categories = (page.categories ?? []).map(c => c.title).join(' ');
    if (/deletion|copyright violation|speedy/i.test(categories)) {
      ecarts.push(`${nom} : proposé à la suppression`);
    }
    const info = page.imageinfo[0];
    if (info.width !== photo.largeur || info.height !== photo.hauteur) {
      ecarts.push(
        `${nom} : ${info.width}×${info.height} au lieu de ${photo.largeur}×${photo.hauteur} (fichier remplacé ?)`
      );
    }
    const licence = texte(info.extmetadata?.LicenseShortName?.value);
    if (licence !== photo.licence && !LICENCES_RELEVEES.has(photo.licence)) {
      ecarts.push(
        `${nom} : licence « ${licence} » au lieu de « ${photo.licence} »`
      );
    }
  }
  await new Promise(fin => setTimeout(fin, 1000));
}

console.log(`${photos.length} photos relues, ${ecarts.length} écart(s).`);
for (const ecart of ecarts) console.log(`- ${ecart}`);
process.exit(ecarts.length > 0 ? 1 : 0);

#!/usr/bin/env node
/**
 * RELÈVE L'ARTICLE WIKIPÉDIA DE CHAQUE DEVISE par Wikidata : l'élément qui
 * porte le code ISO 4217 (propriété P498), puis son lien vers
 * en.wikipedia.org.
 *
 * Le volet des billets y mène quand des coupures restent dessinées.
 * L'application ne montre pas une image que l'émetteur interdit de publier
 * (les billets égyptiens, par exemple) ; un lien n'en publie aucune.
 *
 * L'ÉDITION ANGLAISE, MÊME POUR L'INTERFACE FRANÇAISE. Elle admet les images
 * non libres au titre de l'usage loyal, l'édition française non : les billets
 * que l'application ne peut pas montrer sont justement ceux qu'on ne voit que
 * là. Relevé du 03/10/2026 : 19 articles français sur 41 montrent moins de
 * quatre images de coupures, et « Livre égyptienne » aucune, contre quarante
 * et une pour « Egyptian pound ».
 *
 *   npm run wikipedia:verifier                    relève et compare au jeu
 *   node scripts/wikipedia-devises.mjs --ecrire   réécrit src/data/wikipedia.json
 *
 * Il interroge le réseau, il ne tourne donc pas en CI. Code de sortie 1 si une
 * devise reste sans article, ou si le relevé diffère du jeu sans `--ecrire`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const UA =
  'miss-devises/wikipedia-devises (https://github.com/mister-guiiug/miss-devises)';
const SPARQL = 'https://query.wikidata.org/sparql';
const JEU = new URL('../src/data/wikipedia.json', import.meta.url);

/**
 * Plusieurs éléments peuvent porter le même code. Le choix est écrit ici,
 * motivé, plutôt que deviné.
 */
const CHOIX = {
  // Q323138, « économie du Royaume-Uni », porte aussi le code GBP.
  GBP: 'Q25224',
  // Q114975111, la roupie numérique de la Banque de réserve, aussi.
  INR: 'Q80524',
};

const codes = Object.keys(
  JSON.parse(
    readFileSync(new URL('../src/data/coupures.json', import.meta.url), 'utf8')
  ).devises
).sort();

const requete = `SELECT ?code ?item ?itemLabel ?en WHERE {
  VALUES ?code { ${codes.map(c => `"${c}"`).join(' ')} }
  ?item wdt:P498 ?code .
  OPTIONAL { ?en schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}`;

const reponse = await fetch(`${SPARQL}?query=${encodeURIComponent(requete)}`, {
  headers: { accept: 'application/sparql-results+json', 'user-agent': UA },
});
if (!reponse.ok) throw new Error(`Wikidata : HTTP ${reponse.status}`);
const lignes = (await reponse.json()).results.bindings.map(b => ({
  code: b.code.value,
  item: b.item.value.replace('http://www.wikidata.org/entity/', ''),
  libelle: b.itemLabel?.value,
  en: b.en?.value,
}));

let ecarts = 0;
const devises = {};
for (const code of codes) {
  const candidats = lignes.filter(l => l.code === code);
  const retenu = CHOIX[code]
    ? candidats.find(l => l.item === CHOIX[code])
    : candidats.length === 1
      ? candidats[0]
      : undefined;
  if (!retenu?.en) {
    ecarts += 1;
    console.error(
      `✖ ${code} : ${candidats.length} élément(s) — ${candidats
        .map(
          l =>
            `${l.item} « ${l.libelle} »${l.en ? '' : ' (sans article anglais)'}`
        )
        .join(' ; ')}`
    );
    continue;
  }
  devises[code] = retenu.en;
  console.log(`${code}  ${retenu.item}  ${decodeURI(retenu.en)}`);
}

// `exitCode` et non `exit()` : sous Windows, quitter pendant que `fetch` ferme
// sa connexion fait échouer une assertion de libuv.
if (ecarts) {
  process.exitCode = 1;
} else if (process.argv.includes('--ecrire')) {
  const jeu = {
    // La date locale : `toISOString` donne celle d'UTC, la veille après minuit.
    releveLe: new Date().toLocaleDateString('sv'),
    source: 'Wikidata, code ISO 4217 (P498), article de en.wikipedia.org',
    devises,
  };
  writeFileSync(JEU, JSON.stringify(jeu, null, 2) + '\n');
  console.log(
    `\n✔ ${codes.length} devises écrites dans src/data/wikipedia.json`
  );
} else {
  let actuel = {};
  try {
    actuel = JSON.parse(readFileSync(JEU, 'utf8')).devises;
  } catch {
    // Pas encore de jeu : tout est écart.
  }
  const differences = codes.filter(c => actuel[c] !== devises[c]);
  if (differences.length) {
    console.error(
      `\n✖ diffère du jeu : ${differences.join(' ')} (--ecrire pour réécrire)`
    );
    process.exitCode = 1;
  } else {
    console.log('\n✔ le jeu est à jour');
  }
}

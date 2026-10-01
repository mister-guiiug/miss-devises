import { describe, expect, it } from 'vitest';
import brut from './coupures.json';
import { coupuresSchema, chargerCoupures } from './coupures.ts';
import { decimalesDe } from '../domain/money.ts';
import { decomposer } from '../domain/decompose.ts';

// Les 41 devises de la clarification du 01/10/2026.
const DEVISES =
  'AED ARS AUD BRL CAD CHF CNY CZK DKK EGP EUR GBP HKD HUF IDR ILS INR ISK JOD JPY KRW MAD MUR MXN MYR NOK NZD PHP PLN RON SEK SGD THB TND TRY USD VND XAF XOF XPF ZAR'.split(
    ' '
  );

const coupures = coupuresSchema.parse(brut);
const entrees = Object.entries(coupures.devises);

describe('le jeu de données des coupures (T007)', () => {
  it('suit son schéma, daté', () => {
    expect(coupures.releveLe).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('couvre les 41 devises, et elles seules', () => {
    expect(Object.keys(coupures.devises).sort()).toEqual(DEVISES);
  });

  it.each(entrees)('%s : valeurs croissantes et uniques', (_, d) => {
    for (const liste of [d.billets, d.pieces]) {
      const valeurs = liste.map(c => c.valeur);
      expect(valeurs).toEqual([...new Set(valeurs)].sort((a, b) => a - b));
    }
  });

  it.each(entrees)('%s : les décimales d’Intl', (code, d) => {
    expect(d.decimales).toBe(decimalesDe(code));
  });

  it.each(entrees)('%s : un billet a ses deux côtés, ou aucun', (_, d) => {
    for (const b of d.billets) {
      expect(b.largeurMm === undefined).toBe(b.hauteurMm === undefined);
      if (b.largeurMm !== undefined && b.hauteurMm !== undefined) {
        expect(b.largeurMm).toBeGreaterThan(b.hauteurMm);
      }
    }
  });

  it('bimétal : le centre, puis l’anneau', () => {
    const euro = coupures.devises.EUR?.pieces ?? [];
    expect(euro.find(p => p.valeur === 2)?.metal).toBe('bimetal-or-argent');
    expect(euro.find(p => p.valeur === 1)?.metal).toBe('bimetal-argent-or');
  });

  it('se charge à la demande, validé et typé', async () => {
    const charge = await chargerCoupures();
    expect(charge.devises.EGP?.billets.at(-1)?.valeur).toBe(200);
  });
});

/**
 * Le plus petit nombre de coupures pour chaque montant exact jusqu'à `max`,
 * par programmation dynamique : l'étalon du glouton.
 */
function optimum(valeurs: number[], max: number): Int32Array {
  const meilleur = new Int32Array(max + 1).fill(2 ** 30);
  meilleur[0] = 0;
  for (let montant = 1; montant <= max; montant++) {
    for (const v of valeurs) {
      if (v > montant) break;
      const n = (meilleur[montant - v] ?? 2 ** 30) + 1;
      if (n < (meilleur[montant] ?? 2 ** 30)) meilleur[montant] = n;
    }
  }
  return meilleur;
}

// Recherche R5 : le glouton est minimal dans un système canonique. La roupie
// mauricienne n'en est pas un (billet de 25, pièce de 20) : exception connue,
// et toute nouvelle exception ferait échouer ce test.
const NON_CANONIQUES = ['MUR'];

describe('decomposer sur le jeu réel (recherche R5)', () => {
  it.each(entrees.filter(([code]) => !NON_CANONIQUES.includes(code)))(
    '%s : le glouton donne le moins de coupures',
    (_, d) => {
      const facteur = 10 ** d.decimales;
      const valeurs = [...d.billets, ...d.pieces]
        .filter(c => !c.plusEmis)
        .map(c => Math.round(c.valeur * facteur))
        .sort((a, b) => a - b);
      const plusGrande = valeurs.at(-1);
      if (plusGrande === undefined) return;
      const max = Math.min(2 * plusGrande, 1_000_000);
      const meilleur = optimum([...new Set(valeurs)], max);
      // Un montant sur sept, pour tenir le test en quelques secondes : la
      // vérification du relevé, hors test, les a tous comparés (01/10/2026).
      for (let mineures = 1; mineures <= max; mineures += 7) {
        const attendu = meilleur[mineures] ?? 2 ** 30;
        if (attendu >= 2 ** 30) continue;
        const d2 = decomposer(mineures / facteur, d);
        expect(d2.reste).toBe(0);
        expect(d2.lignes.reduce((n, l) => n + l.nombre, 0)).toBe(attendu);
      }
    }
  );

  it('MUR : 40 roupies en trois coupures au lieu de deux, mais justes', () => {
    const mur = coupures.devises.MUR;
    if (!mur) throw new Error('MUR absente');
    const d = decomposer(40, mur);
    expect(d.reste).toBe(0);
    expect(d.lignes.map(l => `${l.nombre} × ${l.valeur}`)).toEqual([
      '1 × 25',
      '1 × 10',
      '1 × 5',
    ]);
  });
});

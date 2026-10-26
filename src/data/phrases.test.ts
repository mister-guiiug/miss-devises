import { describe, expect, it } from 'vitest';
import brut from './phrases.json';
import coupures from './coupures.json';
import { GROUPES, IDS, phrasesSchema } from './phrases.ts';
import { LANGUES_DES_DEVISES, languesProposees } from './langues.ts';

const jeu = phrasesSchema.parse(brut);
/** Une lettre qui n'est pas de l'alphabet latin. */
const AUTRE_ECRITURE = /(?![\p{Script=Latin}])\p{L}/u;

describe('le jeu de phrases (spécification 004, CR-001)', () => {
  it('quatre groupes, seize phrases, chacune une fois', () => {
    expect(Object.keys(jeu.categories)).toEqual([...GROUPES]);
    const toutes = Object.values(jeu.categories).flat();
    expect(toutes).toHaveLength(16);
    expect(new Set(toutes)).toEqual(new Set(IDS));
  });

  it('chaque langue a ses seize phrases, non vides', () => {
    for (const [code, langue] of Object.entries(jeu.langues)) {
      expect(Object.keys(langue.phrases).sort(), code).toEqual([...IDS].sort());
      for (const [id, phrase] of Object.entries(langue.phrases)) {
        expect(phrase.texte.trim(), `${code} / ${id}`).not.toBe('');
      }
    }
  });

  it('une autre écriture que le latin porte sa transcription, et seulement elle', () => {
    for (const [code, langue] of Object.entries(jeu.langues)) {
      for (const [id, phrase] of Object.entries(langue.phrases)) {
        const autre = AUTRE_ECRITURE.test(phrase.texte);
        expect(Boolean(phrase.latin), `${code} / ${id}`).toBe(autre);
        if (phrase.latin) {
          expect(AUTRE_ECRITURE.test(phrase.latin), `${code} / ${id}`).toBe(
            false
          );
        }
      }
    }
  });

  it('l’arabe et l’hébreu s’écrivent de droite à gauche, les autres non', () => {
    for (const [code, langue] of Object.entries(jeu.langues)) {
      const rtl = code === 'he' || code === 'ar' || code.startsWith('ar-');
      expect(langue.direction === 'rtl', code).toBe(rtl);
    }
  });

  it('chaque code de langue est un code BCP 47 valide', () => {
    for (const code of Object.keys(jeu.langues)) {
      expect(Intl.getCanonicalLocales(code)[0], code).toBe(code);
    }
  });
});

describe('les langues des devises (R2)', () => {
  it('chaque devise illustrée a au moins une langue, et chacune est relevée', () => {
    for (const code of Object.keys(coupures.devises)) {
      const langues = LANGUES_DES_DEVISES[code];
      expect(langues?.length, code).toBeGreaterThan(0);
      for (const langue of langues ?? []) {
        expect(jeu.langues[langue], `${code} → ${langue}`).toBeDefined();
      }
    }
  });

  it('propose la langue du marché, jamais celle de l’application', () => {
    expect(languesProposees(['EGP'], 'fr')).toEqual(['ar-EG']);
    expect(languesProposees(['CHF'], 'fr')).toEqual(['de', 'it']);
    expect(languesProposees(['CHF'], 'en')).toEqual(['de', 'fr', 'it']);
    expect(languesProposees(['XOF'], 'fr')).toEqual([]);
    expect(languesProposees(['XOF'], 'en')).toEqual(['fr']);
  });

  it('ajoute les langues de la seconde devise, sans doublon', () => {
    expect(languesProposees(['EGP', 'USD'], 'fr')).toEqual(['ar-EG', 'en']);
    expect(languesProposees(['EUR', 'CHF'], 'fr')).toEqual([
      'de',
      'es',
      'it',
      'pt',
    ]);
    expect(languesProposees(['EGP', null], 'fr')).toEqual(['ar-EG']);
  });

  it('une devise sans phrases relevées ne propose rien', () => {
    expect(languesProposees(['XAU'], 'fr')).toEqual([]);
  });
});

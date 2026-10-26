import { describe, expect, it } from 'vitest';
import { deriver } from './conversion.ts';

const lisible = (texte: string) => texte.replace(/\s/g, ' ');

describe('deriver : un champ saisi, l’autre calculé', () => {
  it('200 EGP saisis donnent 3,40 € (récit 1, scénario 1)', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      58.83,
      'fr'
    );
    expect(d.montantDevise).toBe(200);
    expect(d.montantReference).toBeCloseTo(3.39963, 5);
    expect(d.texteReference).toBe('3,40');
    expect(d.texteDevise).toBe('200');
    expect(d.invalide).toBe(false);
  });

  it('20 € saisis donnent 1 176,60 EGP (récit 1, scénario 2)', () => {
    const d = deriver(
      { champ: 'reference', texte: '20' },
      'EGP',
      'EUR',
      58.83,
      'fr'
    );
    expect(lisible(d.texteDevise)).toBe('1 176,60');
    expect(d.texteReference).toBe('20');
  });

  it('une devise sans décimales s’affiche sans décimales (scénario 5)', () => {
    const d = deriver(
      { champ: 'reference', texte: '10' },
      'JPY',
      'EUR',
      162.4,
      'fr'
    );
    expect(lisible(d.texteDevise)).toBe('1 624');
  });

  it('une saisie illisible est signalée, et l’autre champ reste vide', () => {
    const d = deriver(
      { champ: 'devise', texte: 'abc' },
      'EGP',
      'EUR',
      58.83,
      'fr'
    );
    expect(d.invalide).toBe(true);
    expect(d.texteReference).toBe('');
    expect(d.montantReference).toBeNull();
  });

  it('sans taux, rien n’est inventé', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      undefined,
      'fr'
    );
    expect(d.texteReference).toBe('');
    expect(d.montantReference).toBeNull();
    expect(d.montantDevise).toBe(200);
  });

  it('le champ de la référence garde ses décimales : le yen', () => {
    // Le yen pour référence : un yen vaut 1/162,4 euro.
    const d = deriver(
      { champ: 'devise', texte: '10' },
      'EUR',
      'JPY',
      1 / 162.4,
      'fr'
    );
    expect(lisible(d.texteReference)).toBe('1 624');
  });

  it('une marge libre de 1,5 % réduit le montant reçu', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      50,
      'fr',
      1.5
    );
    expect(d.montantReference).toBeCloseTo(3.94, 5);
  });

  it('le nombre de chiffres choisi remplace ceux de la devise', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      58.83,
      'fr',
      0,
      4
    );
    expect(lisible(d.texteReference)).toBe('3,3996');
  });

  it('une marge de 2 % réduit le montant reçu, pas le montant saisi', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'USD',
      50,
      'fr',
      2
    );
    expect(d.montantDevise).toBe(200);
    expect(d.montantReference).toBeCloseTo(3.92, 5);
  });

  it('un champ vide n’est pas une erreur', () => {
    const d = deriver(
      { champ: 'devise', texte: '' },
      'EGP',
      'EUR',
      58.83,
      'fr'
    );
    expect(d.invalide).toBe(false);
    expect(d.texteReference).toBe('');
  });
});

describe('deriver à trois champs (spécification 003, récit 1)', () => {
  const USD = { code: 'USD', taux: 1.0812 };

  it('20 € donnent 1 176,60 EGP et 21,62 USD (scénario 2)', () => {
    const d = deriver(
      { champ: 'reference', texte: '20' },
      'EGP',
      'EUR',
      58.83,
      'fr',
      0,
      null,
      USD
    );
    expect(lisible(d.texteDevise)).toBe('1 176,60');
    expect(d.texteSeconde).toBe('21,62');
    expect(d.montantSeconde).toBeCloseTo(21.624, 6);
  });

  it('200 EGP donnent 3,40 € et 3,68 USD, par la référence (scénario 3)', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      58.83,
      'fr',
      0,
      null,
      USD
    );
    expect(d.texteReference).toBe('3,40');
    expect(d.texteSeconde).toBe('3,68');
  });

  it('10 USD donnent 9,25 € et 544,12 EGP (scénario 4)', () => {
    const d = deriver(
      { champ: 'seconde', texte: '10' },
      'EGP',
      'EUR',
      58.83,
      'fr',
      0,
      null,
      USD
    );
    expect(d.texteSeconde).toBe('10');
    expect(d.montantSeconde).toBe(10);
    expect(d.texteReference).toBe('9,25');
    expect(d.texteDevise).toBe('544,12');
    // Les trois champs se tiennent : la référence est leur pivot (R1).
    expect(d.montantDevise! / 58.83).toBeCloseTo(d.montantReference!, 10);
  });

  it('la marge s’applique à chaque montant calculé, une fois (scénario 8)', () => {
    const d = deriver(
      { champ: 'seconde', texte: '10' },
      'EGP',
      'EUR',
      58.83,
      'fr',
      5,
      null,
      USD
    );
    expect(d.montantReference).toBeCloseTo((10 / 1.0812) * 0.95, 10);
    expect(d.montantDevise).toBeCloseTo((10 / 1.0812) * 58.83 * 0.95, 10);
    expect(d.montantSeconde).toBe(10);
  });

  it('une seconde devise sans taux reste vide, la paire est intacte', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      58.83,
      'fr',
      0,
      null,
      { code: 'XYZ', taux: undefined }
    );
    expect(d.texteReference).toBe('3,40');
    expect(d.texteSeconde).toBe('');
    expect(d.montantSeconde).toBeNull();
  });

  it('une saisie dans la seconde devise sans son taux ne remplit rien', () => {
    const d = deriver(
      { champ: 'seconde', texte: '10' },
      'EGP',
      'EUR',
      58.83,
      'fr',
      0,
      null,
      { code: 'XYZ', taux: undefined }
    );
    expect(d.texteSeconde).toBe('10');
    expect(d.texteReference).toBe('');
    expect(d.texteDevise).toBe('');
  });
});

describe('deriver comprend un calcul (spécification 003, récit 2)', () => {
  const egp = (texte: string, champ: 'devise' | 'reference' = 'reference') =>
    deriver({ champ, texte }, 'EGP', 'EUR', 58.83, 'fr');

  it('« 12,5 + 7,5 » en euros donne 1 176,60 EGP ; le champ garde le calcul (scénario 3)', () => {
    const d = egp('12,5 + 7,5');
    expect(d.texteReference).toBe('12,5 + 7,5');
    expect(d.montantReference).toBe(20);
    expect(lisible(d.texteDevise)).toBe('1 176,60');
    expect(d.calcul).toBe(true);
    expect(d.erreur).toBeNull();
    expect(d.invalide).toBe(false);
  });

  it('un montant seul n’est pas un calcul', () => {
    const d = egp('20');
    expect(d.calcul).toBe(false);
    expect(d.erreur).toBeNull();
  });

  it('une frappe en cours suit le calcul déjà lisible, sans erreur (scénario 6)', () => {
    const d = egp('12 +');
    expect(d.montantReference).toBe(12);
    expect(d.invalide).toBe(false);
  });

  it('division par zéro et résultat négatif disent leur erreur, sans rien remplir (scénario 7)', () => {
    expect(egp('12 ÷ 0').erreur).toBe('division');
    expect(egp('12 ÷ 0').texteDevise).toBe('');
    expect(egp('5 − 8').erreur).toBe('negatif');
    expect(egp('5 − 8').invalide).toBe(true);
    expect(egp('abc').erreur).toBe('illisible');
  });

  it('un champ vide n’est pas une erreur', () => {
    expect(egp('').erreur).toBeNull();
    expect(egp('').invalide).toBe(false);
  });
});

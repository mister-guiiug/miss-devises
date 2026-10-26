/**
 * Les langues utiles dans les pays de chaque devise illustrée, la langue du
 * marché d'abord (spécification 004, recherche R2). Petit et lu par l'écran
 * Convertir, qui décide d'afficher « Mots utiles » ; les phrases elles-mêmes
 * restent dans le morceau de la feuille.
 *
 * Chaque code est une langue de `phrases.json` (vérifié par les tests).
 */
export const LANGUES_DES_DEVISES: Readonly<Record<string, readonly string[]>> =
  {
    AED: ['ar', 'en'],
    ARS: ['es'],
    AUD: ['en'],
    BRL: ['pt'],
    CAD: ['en', 'fr'],
    CHF: ['de', 'fr', 'it'],
    CNY: ['zh-Hans'],
    CZK: ['cs'],
    DKK: ['da'],
    EGP: ['ar-EG'],
    EUR: ['de', 'es', 'it', 'pt', 'fr'],
    GBP: ['en'],
    HKD: ['en'],
    HUF: ['hu'],
    IDR: ['id'],
    ILS: ['he'],
    INR: ['hi', 'en'],
    ISK: ['en'],
    JOD: ['ar', 'en'],
    JPY: ['ja'],
    KRW: ['ko'],
    MAD: ['ar-MA', 'fr'],
    MUR: ['fr', 'en'],
    MXN: ['es'],
    MYR: ['ms'],
    NOK: ['nb'],
    NZD: ['en'],
    PHP: ['fil', 'en'],
    PLN: ['pl'],
    RON: ['ro'],
    SEK: ['sv'],
    SGD: ['en', 'zh-Hans', 'ms'],
    THB: ['th'],
    TND: ['fr', 'ar'],
    TRY: ['tr'],
    USD: ['en'],
    VND: ['vi'],
    XAF: ['fr'],
    XOF: ['fr'],
    XPF: ['fr'],
    ZAR: ['en'],
  };

/**
 * Les langues à proposer pour la devise, puis la seconde devise : dans
 * l'ordre, sans doublon, sans la langue de l'application, que l'on parle
 * déjà. Vide : rien à proposer, pas de bouton.
 */
export function languesProposees(
  devises: readonly (string | null)[],
  langueApp: string
): string[] {
  const vues = new Set<string>();
  for (const devise of devises) {
    for (const langue of (devise && LANGUES_DES_DEVISES[devise]) || []) {
      if (langue.split('-')[0] !== langueApp) vues.add(langue);
    }
  }
  return [...vues];
}

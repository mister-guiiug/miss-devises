import { useEffect, useState } from 'react';

/**
 * La voix des mots utiles (spécification 005, récit 2) : la synthèse vocale
 * de l'appareil, sans requête ni fichier.
 */

type Voix = Pick<SpeechSynthesisVoice, 'lang' | 'localService'>;

const norme = (lang: string) => lang.replace(/_/g, '-').toLowerCase();
const base = (lang: string) => norme(lang).split('-')[0]!;

/**
 * Des langues du jeu dont les voix portent un autre code : le mandarin de
 * Chine pour le chinois simplifié, le tagalog pour le filipino.
 */
const EQUIVALENTS: Record<string, string[]> = {
  'zh-hans': ['zh-cn', 'zh-sg'],
  fil: ['tl', 'fil-ph', 'tl-ph'],
};

/** Des voix de la même langue de base qui ne la disent pas. */
const EXCLUES: Record<string, string[]> = {
  'zh-hans': ['zh-hk', 'zh-mo', 'yue'],
};

/** La voix locale d'abord : elle marche hors ligne. */
const meilleure = <T extends Voix>(candidates: T[]): T | null =>
  candidates.find(v => v.localService) ?? candidates[0] ?? null;

/**
 * La voix d'une langue, ou `null` (recherche R3) : la langue exacte, puis un
 * code équivalent, puis la langue de base ; une voix locale d'abord à chaque
 * étape.
 */
export function choisirVoix<T extends Voix>(
  langue: string,
  voix: readonly T[]
): T | null {
  const cle = norme(langue);
  const exacte = meilleure(voix.filter(v => norme(v.lang) === cle));
  if (exacte) return exacte;
  for (const equivalent of EQUIVALENTS[cle] ?? []) {
    const trouvee = meilleure(
      voix.filter(
        v => norme(v.lang) === equivalent || base(v.lang) === equivalent
      )
    );
    if (trouvee) return trouvee;
  }
  const exclues = EXCLUES[cle] ?? [];
  return meilleure(
    voix.filter(
      v =>
        base(v.lang) === base(langue) &&
        !exclues.some(e => norme(v.lang).startsWith(e))
    )
  );
}

/**
 * L'énoncé en cours, gardé ici jusqu'à sa fin : libéré trop tôt par le
 * ramasse-miettes de certains navigateurs, il couperait la fin de la phrase
 * (relevé dans le parc ; recherche R4).
 */
let enCours: SpeechSynthesisUtterance | null = null;

/** Dit `texte` avec `voix`, un peu lentement ; arrête d'abord la précédente. */
export function dire(
  texte: string,
  langue: string,
  voix: SpeechSynthesisVoice,
  onFin: () => void
): void {
  speechSynthesis.cancel();
  const enonce = new SpeechSynthesisUtterance(texte);
  enonce.lang = voix.lang || langue;
  enonce.voice = voix;
  enonce.rate = 0.85;
  const fin = () => {
    if (enCours === enonce) enCours = null;
    onFin();
  };
  enonce.onend = fin;
  enonce.onerror = fin;
  enCours = enonce;
  speechSynthesis.speak(enonce);
}

export function arreter(): void {
  enCours = null;
  speechSynthesis.cancel();
}

/**
 * Les voix de l'appareil. `null` : pas de synthèse vocale, ou la liste n'est
 * pas encore arrivée (Chrome la livre en différé, par `voiceschanged`) ; au
 * bout d'une seconde et demie sans elle, une liste vide.
 */
export function useVoix(): readonly SpeechSynthesisVoice[] | null {
  const prise = typeof speechSynthesis !== 'undefined';
  const [voix, setVoix] = useState<readonly SpeechSynthesisVoice[] | null>(
    () => {
      if (!prise) return [];
      const deja = speechSynthesis.getVoices();
      return deja.length > 0 ? deja : null;
    }
  );

  useEffect(() => {
    if (!prise) return;
    const lire = () => {
      const liste = speechSynthesis.getVoices();
      if (liste.length > 0) setVoix(liste);
    };
    speechSynthesis.addEventListener?.('voiceschanged', lire);
    const delai = window.setTimeout(
      () => setVoix(v => v ?? speechSynthesis.getVoices()),
      1500
    );
    return () => {
      // La synthèse peut avoir disparu entre-temps (un test qui la retire).
      if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.removeEventListener?.('voiceschanged', lire);
      }
      window.clearTimeout(delai);
    };
  }, [prise]);

  return voix;
}

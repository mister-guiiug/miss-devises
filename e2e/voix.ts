import type { Page } from '@playwright/test';

/**
 * Une synthèse vocale simulée : Chromium sans affichage n'a pas de voix. Les
 * voix données sont celles de « l'appareil » ; chaque phrase dite est notée
 * dans `window.__dites`, et sa fin arrive 50 ms plus tard.
 */
export async function simulerVoix(page: Page, langues: string[]) {
  await page.addInitScript(codes => {
    const dites: { text: string; lang: string }[] = [];
    (window as unknown as { __dites: typeof dites }).__dites = dites;
    const voix = codes.map(lang => ({
      lang,
      name: `Voix ${lang}`,
      localService: true,
      default: false,
      voiceURI: lang,
    }));
    // L'énoncé aussi : le vrai refuse une voix qui n'est pas une
    // `SpeechSynthesisVoice` du navigateur.
    class Enonce {
      lang = '';
      voice: unknown = null;
      rate = 1;
      onend: ((e: Event) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: Enonce,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => voix,
        speak: (u: Enonce) => {
          dites.push({ text: u.text, lang: u.lang });
          setTimeout(() => u.onend?.(new Event('end')), 50);
        },
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  }, langues);
}

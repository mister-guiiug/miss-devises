import { afterEach, describe, expect, it, vi } from 'vitest';
import { arreter, choisirVoix, dire } from './voix.ts';

const voix = (lang: string, localService = true, name = lang) => ({
  lang,
  name,
  localService,
  default: false,
  voiceURI: name,
});

describe('choisir une voix (spécification 005, recherche R3)', () => {
  it('la langue exacte, une voix locale d’abord', () => {
    const distante = voix('ar-EG', false, 'distante');
    const locale = voix('ar-EG', true, 'locale');
    expect(choisirVoix('ar-EG', [distante, locale])).toBe(locale);
  });

  it('lit les codes d’Android, en minuscules et soulignés', () => {
    const thai = voix('th_TH');
    expect(choisirVoix('th', [voix('en-US'), thai])).toBe(thai);
  });

  it('une variante sans voix propre prend la langue de base (scénario 5)', () => {
    const saoudienne = voix('ar-SA');
    expect(choisirVoix('ar-EG', [voix('de-DE'), saoudienne])).toBe(saoudienne);
  });

  it('le chinois simplifié prend le mandarin de Chine, jamais le cantonais', () => {
    const hk = voix('zh-HK');
    const cn = voix('zh-CN');
    expect(choisirVoix('zh-Hans', [hk, cn])).toBe(cn);
    expect(choisirVoix('zh-Hans', [hk])).toBeNull();
  });

  it('le filipino prend une voix tagalog', () => {
    const tagalog = voix('tl-PH');
    expect(choisirVoix('fil', [tagalog])).toBe(tagalog);
  });

  it('aucune voix pour la langue : rien', () => {
    expect(choisirVoix('th', [voix('en-US'), voix('de-DE')])).toBeNull();
    expect(choisirVoix('th', [])).toBeNull();
  });
});

describe('dire une phrase (recherche R4)', () => {
  class Enonce {
    lang = '';
    voice: unknown = null;
    rate = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  }
  const synthese = { speak: vi.fn(), cancel: vi.fn() };

  afterEach(() => {
    vi.unstubAllGlobals();
    synthese.speak.mockReset();
    synthese.cancel.mockReset();
  });

  it('dit la phrase dans sa langue, avec sa voix, un peu lentement ; arrête la précédente', () => {
    vi.stubGlobal('speechSynthesis', synthese);
    vi.stubGlobal('SpeechSynthesisUtterance', Enonce);
    const thai = voix('th-TH');
    const fin = vi.fn();
    dire('ลดได้ไหม', 'th', thai as unknown as SpeechSynthesisVoice, fin);
    expect(synthese.cancel).toHaveBeenCalledBefore(synthese.speak);
    const enonce = synthese.speak.mock.calls[0]![0] as Enonce;
    expect(enonce.text).toBe('ลดได้ไหม');
    expect(enonce.lang).toBe('th-TH');
    expect(enonce.voice).toBe(thai);
    expect(enonce.rate).toBe(0.85);
    enonce.onend?.();
    expect(fin).toHaveBeenCalledOnce();
  });

  it('« Arrêter » coupe la lecture', () => {
    vi.stubGlobal('speechSynthesis', synthese);
    arreter();
    expect(synthese.cancel).toHaveBeenCalledOnce();
  });
});

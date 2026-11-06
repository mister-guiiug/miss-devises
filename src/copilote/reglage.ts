/**
 * LE RÉGLAGE DU COPILOTE ET LA CLÉ DU VISITEUR (spécification 007, R10).
 *
 * La clé vit dans `sessionStorage` : elle disparaît à la fermeture de
 * l'onglet, ne passe jamais par un serveur de l'application (il n'y en a
 * pas), et ne part que vers l'API d'Anthropic, dans l'en-tête de chaque
 * appel. Elle n'entre ni dans l'état de l'agent, ni dans les messages, ni
 * dans l'inspecteur.
 *
 * Le modèle simulé est le défaut : rien ne quitte l'appareil tant que le
 * visiteur n'a pas choisi Claude ET saisi sa clé.
 */
import { create } from 'zustand';
import { creerModeleClaude } from './agent/modele-claude.ts';
import { creerModeleSimule } from './agent/modele-simule.ts';
import { ErreurModele, type Modele } from './agent/modele.ts';

export const MODELES = [
  { id: 'claude-opus-5-5', nom: 'Claude Opus 5.5' },
  { id: 'claude-sonnet-5-5', nom: 'Claude Sonnet 5.5' },
  { id: 'claude-haiku-5-5', nom: 'Claude Haiku 5.5' },
] as const;
export type IdModele = (typeof MODELES)[number]['id'];

const CLES = {
  mode: 'miss-devises:copilote:mode',
  modele: 'miss-devises:copilote:modele',
  cle: 'miss-devises:copilote:cle',
} as const;

/** `sessionStorage` peut manquer ou refuser (navigation privée) : on s'en passe. */
function lire(cle: string): string | null {
  try {
    return sessionStorage.getItem(cle);
  } catch {
    return null;
  }
}
function ecrire(cle: string, valeur: string | null) {
  try {
    if (valeur === null) sessionStorage.removeItem(cle);
    else sessionStorage.setItem(cle, valeur);
  } catch {
    // La valeur reste en mémoire pour l'onglet ; elle ne survivra pas au rechargement.
  }
}

interface EtatReglage {
  mode: 'simule' | 'claude';
  modele: IdModele;
  cle: string | null;
  choisirMode: (mode: 'simule' | 'claude') => void;
  choisirModele: (modele: IdModele) => void;
  poserCle: (cle: string) => void;
  oublierCle: () => void;
}

const estModele = (valeur: string | null): valeur is IdModele =>
  MODELES.some(m => m.id === valeur);

export function creerReglage() {
  return create<EtatReglage>(set => {
    const modele = lire(CLES.modele);
    return {
      mode: lire(CLES.mode) === 'claude' ? 'claude' : 'simule',
      modele: estModele(modele) ? modele : 'claude-opus-5-5',
      cle: lire(CLES.cle),
      choisirMode: mode => {
        ecrire(CLES.mode, mode);
        set({ mode });
      },
      choisirModele: modele => {
        ecrire(CLES.modele, modele);
        set({ modele });
      },
      poserCle: cle => {
        const nette = cle.trim();
        if (!nette) return;
        ecrire(CLES.cle, nette);
        set({ cle: nette });
      },
      oublierCle: () => {
        ecrire(CLES.cle, null);
        set({ cle: null });
      },
    };
  });
}

export const useReglage = creerReglage();

/** Une clé d'API Anthropic en a la forme ; le reste, c'est l'API qui le dira. */
export const aLaFormeDUneCle = (cle: string) =>
  /^sk-ant-[\w-]{20,}$/.test(cle.trim());

/**
 * Le modèle de la prochaine exécution, lu au moment de la lancer. Claude sans
 * clé ne part pas : l'exécution s'arrête sur une erreur qui dit quoi faire.
 */
export function modeleCourant(etat = useReglage.getState()): Modele {
  if (etat.mode === 'simule') return creerModeleSimule();
  if (!etat.cle) return sansCle(etat.modele);
  return creerModeleClaude({
    modele: etat.modele,
    effort: 'low',
    cle: etat.cle,
  });
}

function sansCle(nom: string): Modele {
  return {
    nom,
    fournisseur: 'anthropic',
    tour: () => ({
      flux: (async function* () {})(),
      fin: () =>
        Promise.reject(
          new ErreurModele(
            'Aucune clé Anthropic : saisissez-la dans l’onglet « Modèle », ou choisissez le modèle simulé.',
            'cle-absente'
          )
        ),
    }),
  };
}

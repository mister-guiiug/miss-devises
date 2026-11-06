import { beforeEach, describe, expect, it } from 'vitest';
import { aLaFormeDUneCle, creerReglage, modeleCourant } from './reglage.ts';

const CLE = 'sk-ant-test-cle-de-demonstration-0000000000';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe('le réglage du copilote et la clé du visiteur', () => {
  it('commence sur le modèle simulé, sans clé : rien ne quitte l’appareil', () => {
    const reglage = creerReglage();
    expect(reglage.getState()).toMatchObject({
      mode: 'simule',
      modele: 'claude-opus-5-5',
      cle: null,
    });
    expect(modeleCourant(reglage.getState()).nom).toBe('simulé');
  });

  it('garde la clé dans la session de l’onglet, jamais sur l’appareil', () => {
    const reglage = creerReglage();
    reglage.getState().choisirMode('claude');
    reglage.getState().poserCle(`  ${CLE}  `);
    expect(sessionStorage.getItem('miss-devises:copilote:cle')).toBe(CLE);
    expect(localStorage.length).toBe(0);
    // Un rechargement de l'onglet la retrouve.
    expect(creerReglage().getState()).toMatchObject({
      mode: 'claude',
      cle: CLE,
    });

    reglage.getState().oublierCle();
    expect(sessionStorage.getItem('miss-devises:copilote:cle')).toBeNull();
    expect(reglage.getState().cle).toBeNull();
  });

  it('Claude avec une clé : le modèle choisi ; sans clé : une erreur qui dit quoi faire', async () => {
    const reglage = creerReglage();
    reglage.getState().choisirMode('claude');
    reglage.getState().choisirModele('claude-sonnet-5-5');
    const sansCle = modeleCourant(reglage.getState());
    await expect(
      sansCle
        .tour({ systeme: '', contexte: '', messages: [], outils: [] })
        .fin()
    ).rejects.toMatchObject({
      code: 'cle-absente',
    });

    reglage.getState().poserCle(CLE);
    expect(modeleCourant(reglage.getState())).toMatchObject({
      nom: 'claude-sonnet-5-5',
      fournisseur: 'anthropic',
    });
  });

  it('une clé vide n’est pas posée ; la forme d’une clé se reconnaît', () => {
    const reglage = creerReglage();
    reglage.getState().poserCle('   ');
    expect(reglage.getState().cle).toBeNull();
    expect(aLaFormeDUneCle(CLE)).toBe(true);
    expect(aLaFormeDUneCle('ma-cle')).toBe(false);
  });
});

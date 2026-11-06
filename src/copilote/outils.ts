/**
 * LES OUTILS DU NAVIGATEUR (spécification 007, R7). L'agent les appelle ; ils
 * s'exécutent ici, sur l'écran, par les MÊMES magasins que les gestes de
 * l'utilisateur (`usePreferences`, `useConversion`). Ils rendent ce que
 * l'application calcule (`deriver`, `tauxDuJour`) : l'agent n'a aucun outil
 * qui calcule, un montant vient toujours d'ici (principe I).
 *
 * Fonctions pures autour des magasins, sans React : les tests les appellent
 * directement, le panneau les enregistre auprès de CopilotKit.
 */
import { z } from 'zod';
import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { usePreferences } from '../app/preferences.ts';
import {
  deriver,
  useConversion,
  type ChampSaisi,
} from '../features/convert/conversion.ts';
import { useTaux } from '../rates/store.ts';
import { codesConnus, tauxDuJour, type TauxDuJour } from '../rates/service.ts';
import {
  coutAvecFrais,
  decrireFrais,
  fixeEnReference,
} from '../domain/frais.ts';
import {
  formaterDate,
  formaterMontant,
  formaterTauxEn,
  type Langue,
} from '../domain/money.ts';

const CODE = z
  .string()
  .regex(/^[A-Z]{3}$/, 'un code ISO 4217 en trois majuscules');

export const ParametresConvertir = z.object({
  montant: z
    .number()
    .positive()
    .describe('Le montant donné par l’utilisateur, dans la devise « devise ».'),
  devise: CODE.describe('Code ISO 4217 de la devise du montant, ex. JPY.'),
  vers: CODE.optional().describe(
    'Code ISO 4217 de la devise voulue, si l’utilisateur en nomme une. Sans elle, l’application convertit vers sa monnaie de référence.'
  ),
});

export const ParametresFrais = z.object({
  libelle: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .describe('Le nom des frais, ex. « Carte ».'),
  pourcentage: z
    .number()
    .min(0)
    .max(100)
    .describe('Frais en pour cent du montant, ex. 2.'),
  fixe: z
    .number()
    .min(0)
    .optional()
    .describe('Frais fixes par opération, s’il y en a.'),
  deviseFixe: CODE.optional().describe(
    'Devise des frais fixes ; par défaut la monnaie de référence.'
  ),
});

export interface LigneConvertie {
  code: string;
  texte: string;
  /** « 1 EUR = 162,4 JPY » : le taux de la paire, dit dans la devise. */
  taux: string;
  source: string;
  date: string;
  ancien: boolean;
}

export type ResultatConvertir =
  | {
      ok: true;
      saisi: string;
      resultats: LigneConvertie[];
      marge?: string;
      avecFrais?: {
        libelle: string;
        description: string;
        frais: string;
        total: string;
      };
    }
  | { ok: false; raison: string };

export type ResultatFrais =
  | {
      ok: true;
      frais: { libelle: string; description: string; repris: boolean };
    }
  | { ok: false; raison: string };

const SOURCES = { bce: 'BCE', marche: 'marché' } as const;

/** Un montant à écrire dans un champ : sans séparateur de milliers. */
const enSaisie = (montant: number, langue: Langue) =>
  formatNumber(montant, langue, {
    useGrouping: false,
    maximumFractionDigits: 8,
  });

const invalide = (erreur: z.ZodError): { ok: false; raison: string } => ({
  ok: false,
  raison: `paramètres invalides : ${erreur.issues.map(i => `${i.path.join('.')} ${i.message}`).join(' ; ')}`,
});

/**
 * Règle l'écran Convertir sur un montant, puis rend sa conversion.
 *
 * - Montant dans la référence : il va dans le champ de la référence, et la
 *   devise affichée devient `vers` si elle est donnée.
 * - Montant dans une autre devise : elle devient la devise affichée, le
 *   montant va dans son champ, et `vers` (autre que la référence) devient la
 *   seconde devise (spécification 003).
 *
 * Une devise que l'application ne connaît pas ne change RIEN à l'écran.
 */
export function executerConvertir(
  args: unknown,
  langue: Langue,
  maintenant = new Date()
): ResultatConvertir {
  const lu = ParametresConvertir.safeParse(args);
  if (!lu.success) return invalide(lu.error);
  const { montant, devise, vers } = lu.data;

  const { etat, pret } = useTaux.getState();
  if (!pret)
    return { ok: false, raison: 'les taux ne sont pas encore chargés' };
  const connus = codesConnus(etat);
  const inconnue = [devise, vers].find(
    code => code !== undefined && !connus.includes(code)
  );
  if (inconnue)
    return {
      ok: false,
      raison: `l’application ne connaît pas la devise ${inconnue}`,
    };

  const preferences = usePreferences.getState();
  const { reference } = preferences;
  const texte = enSaisie(montant, langue);
  let champ: ChampSaisi;
  if (devise === reference) {
    const cible = vers && vers !== reference ? vers : preferences.devise;
    if (cible !== preferences.devise) preferences.choisirDevise(cible);
    champ = 'reference';
  } else {
    if (devise !== preferences.devise) preferences.choisirDevise(devise);
    if (vers && vers !== reference && vers !== devise)
      usePreferences.getState().choisirSeconde(vers);
    champ = 'devise';
  }
  useConversion.getState().saisir(champ, texte);

  // Ce que l'écran affiche maintenant, calculé comme il le calcule.
  const apres = usePreferences.getState();
  const jour = tauxDuJour(reference, apres.devise, etat, maintenant);
  const jourSeconde = apres.seconde
    ? tauxDuJour(reference, apres.seconde, etat, maintenant)
    : undefined;
  const seconde = apres.seconde
    ? { code: apres.seconde, taux: jourSeconde?.taux }
    : null;
  const saisie = { champ, texte };
  const d = deriver(
    saisie,
    apres.devise,
    reference,
    jour?.taux,
    langue,
    apres.marge,
    apres.decimales,
    seconde
  );

  const ligne = (
    code: string,
    valeur: number | null,
    paire: TauxDuJour | undefined
  ): LigneConvertie | string => {
    if (valeur === null || !paire)
      return code === reference ? apres.devise : code;
    return {
      code,
      texte: formaterMontant(
        valeur,
        code,
        langue,
        apres.decimales === null ? {} : { decimales: apres.decimales }
      ),
      taux: `${formaterMontant(1, reference, langue, { decimales: 0 })} = ${formaterTauxEn(paire.taux, paire.code, langue)}`,
      source: SOURCES[paire.source],
      date: formaterDate(paire.date, langue),
      ancien: paire.fraicheur === 'ancien',
    };
  };
  const lignes = [
    champ === 'devise'
      ? ligne(reference, d.montantReference, jour)
      : ligne(apres.devise, d.montantDevise, jour),
    ...(seconde ? [ligne(seconde.code, d.montantSeconde, jourSeconde)] : []),
  ];
  const sansTaux = lignes.find(l => typeof l === 'string');
  if (sansTaux !== undefined) {
    return {
      ok: false,
      raison: `pas de taux pour ${String(sansTaux)} : l’application ne convertit pas sans taux`,
    };
  }
  const resultats = (lignes as LigneConvertie[]).sort(
    (a, b) => Number(b.code === vers) - Number(a.code === vers)
  );

  return {
    ok: true,
    saisi: formaterMontant(montant, devise, langue),
    resultats,
    ...(apres.marge > 0
      ? {
          marge: `${String(apres.marge)} % retranchés (marge réglée dans l’application)`,
        }
      : {}),
    ...avecFrais(
      saisie,
      apres.devise,
      reference,
      jour?.taux,
      langue,
      maintenant
    ),
  };
}

/** Le coût frais compris, sur le montant indicatif, comme `LigneFrais` (spécification 005). */
function avecFrais(
  saisie: { champ: ChampSaisi; texte: string },
  devise: string,
  reference: string,
  taux: number | undefined,
  langue: Langue,
  maintenant: Date
): Pick<Extract<ResultatConvertir, { ok: true }>, 'avecFrais'> {
  const { frais, fraisChoisis } = usePreferences.getState();
  const choisis = frais.find(f => f.id === fraisChoisis);
  if (!choisis) return {};
  const indicatif = deriver(
    saisie,
    devise,
    reference,
    taux,
    langue
  ).montantReference;
  const tauxFixe = tauxDuJour(
    reference,
    choisis.deviseFixe,
    useTaux.getState().etat,
    maintenant
  )?.taux;
  const fixe = fixeEnReference(choisis, reference, tauxFixe);
  if (indicatif === null || fixe === null) return {};
  const cout = coutAvecFrais(indicatif, choisis.pourcentage, fixe);
  return {
    avecFrais: {
      libelle: choisis.libelle,
      description: decrireFrais(choisis, langue),
      frais: formaterMontant(cout.frais, reference, langue),
      total: formaterMontant(cout.total, reference, langue),
    },
  };
}

/**
 * Applique des frais : les mêmes, déjà enregistrés, sont repris ; sinon ils
 * sont créés par la règle des réglages (bornes, six au plus), puis choisis.
 */
export function executerAppliquerFrais(
  args: unknown,
  langue: Langue
): ResultatFrais {
  const lu = ParametresFrais.safeParse(args);
  if (!lu.success) return invalide(lu.error);
  const preferences = usePreferences.getState();
  const voulus = {
    libelle: lu.data.libelle,
    pourcentage: lu.data.pourcentage,
    fixe: lu.data.fixe ?? 0,
    deviseFixe: lu.data.deviseFixe ?? preferences.reference,
  };
  if (voulus.pourcentage === 0 && voulus.fixe === 0)
    return { ok: false, raison: 'des frais nuls ne s’appliquent pas' };

  const memes = preferences.frais.find(
    f =>
      f.pourcentage === voulus.pourcentage &&
      f.fixe === voulus.fixe &&
      f.deviseFixe === voulus.deviseFixe
  );
  if (memes) {
    preferences.choisirFrais(memes.id);
    return {
      ok: true,
      frais: {
        libelle: memes.libelle,
        description: decrireFrais(memes, langue),
        repris: true,
      },
    };
  }
  const avant = preferences.frais.length;
  preferences.ajouterFrais(voulus);
  const apres = usePreferences.getState().frais;
  const nouveaux = apres.length > avant ? apres.at(-1) : undefined;
  if (!nouveaux) {
    return {
      ok: false,
      raison:
        'frais refusés : six sont déjà enregistrés, en retirer un dans les réglages',
    };
  }
  usePreferences.getState().choisirFrais(nouveaux.id);
  return {
    ok: true,
    frais: {
      libelle: nouveaux.libelle,
      description: decrireFrais(nouveaux, langue),
      repris: false,
    },
  };
}

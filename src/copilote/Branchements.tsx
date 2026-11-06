/**
 * CE QUE L'APPLICATION OFFRE À L'AGENT (spécification 007, R7 et R8) : ses
 * outils, leurs fiches dans la conversation, et la description de son écran.
 * Tout passe dans l'entrée de chaque exécution (`tools`, `context`).
 */
import { useMemo } from 'react';
import { z } from 'zod';
import {
  useAgent,
  useAgentContext,
  useFrontendTool,
  useRenderTool,
  UseAgentUpdate,
} from '@copilotkit/react-core/v2';
import { usePreferences } from '../app/preferences.ts';
import { deriver, useConversion } from '../features/convert/conversion.ts';
import { tauxDuJour } from '../rates/service.ts';
import { useTaux } from '../rates/store.ts';
import { decrireFrais } from '../domain/frais.ts';
import { useI18n } from '../i18n/index.ts';
import { convertirDepenses, lireDepenses, type Depense } from './depenses.ts';
import { FicheConversion, FicheDepense, FicheFrais } from './Fiches.tsx';
import {
  executerAppliquerFrais,
  executerConvertir,
  ParametresConvertir,
  ParametresFrais,
} from './outils.ts';

export const AGENT = 'devises';

export function Branchements() {
  const { locale } = useI18n();

  useFrontendTool(
    {
      name: 'convertir',
      description:
        'Règle l’écran Convertir de l’application sur un montant, et rend la conversion qu’elle calcule : montants, taux, source et date. À appeler pour TOUTE conversion.',
      parameters: ParametresConvertir,
      handler: async args => JSON.stringify(executerConvertir(args, locale)),
      render: FicheConversion,
    },
    [locale]
  );
  useFrontendTool(
    {
      name: 'appliquer_frais',
      description:
        'Applique des frais de carte ou de banque à la conversion de l’écran : un pourcentage, et un montant fixe s’il y en a. Des frais identiques déjà enregistrés sont repris.',
      parameters: ParametresFrais,
      handler: async args =>
        JSON.stringify(executerAppliquerFrais(args, locale)),
      render: FicheFrais,
    },
    [locale]
  );
  // L'outil de l'agent lui-même n'a pas de gestionnaire ici, seulement sa fiche.
  useRenderTool(
    {
      name: 'noter_depense',
      parameters: z.object({
        libelle: z.string(),
        montant: z.number(),
        devise: z.string(),
      }),
      render: FicheDepense,
    },
    []
  );

  useAgentContext({
    description: 'L’écran Convertir, tel qu’il est affiché',
    value: useEcran(locale),
  });
  useAgentContext({
    description:
      'Les dépenses notées, converties par l’application (le total est le sien)',
    value: useDepensesConverties(locale),
  });
  return null;
}

/** L'écran Convertir, en clair : des valeurs simples, sans `undefined`. */
function useEcran(langue: 'fr' | 'en') {
  const reference = usePreferences(s => s.reference);
  const devise = usePreferences(s => s.devise);
  const seconde = usePreferences(s => s.seconde);
  const marge = usePreferences(s => s.marge);
  const decimales = usePreferences(s => s.decimales);
  const frais = usePreferences(s => s.frais);
  const fraisChoisis = usePreferences(s => s.fraisChoisis);
  const saisie = useConversion(s => s.saisie);
  const etat = useTaux(s => s.etat);
  return useMemo(() => {
    const maintenant = new Date();
    const jour = tauxDuJour(reference, devise, etat, maintenant);
    const jourSeconde = seconde
      ? tauxDuJour(reference, seconde, etat, maintenant)
      : undefined;
    const d = deriver(
      saisie,
      devise,
      reference,
      jour?.taux,
      langue,
      marge,
      decimales,
      seconde ? { code: seconde, taux: jourSeconde?.taux } : null
    );
    const choisis = frais.find(f => f.id === fraisChoisis);
    return {
      langue,
      reference,
      devise,
      seconde,
      saisie: { champ: saisie.champ, texte: saisie.texte },
      affiche: {
        devise: d.texteDevise,
        reference: d.texteReference,
        seconde: d.texteSeconde,
      },
      taux: jour
        ? {
            valeur: jour.taux,
            source: jour.source,
            date: jour.date,
            ancien: jour.fraicheur === 'ancien',
          }
        : null,
      marge,
      fraisAppliques: choisis
        ? `${choisis.libelle} : ${decrireFrais(choisis, langue)}`
        : null,
    };
  }, [
    reference,
    devise,
    seconde,
    marge,
    decimales,
    frais,
    fraisChoisis,
    saisie,
    etat,
    langue,
  ]);
}

function useDepensesConverties(langue: 'fr' | 'en') {
  const { agent } = useAgent({
    agentId: AGENT,
    updates: [UseAgentUpdate.OnStateChanged],
  });
  const reference = usePreferences(s => s.reference);
  const etat = useTaux(s => s.etat);
  // La clé est le texte de la liste : le contexte ne change que si elle change.
  const cle = JSON.stringify(lireDepenses(agent.state));
  return useMemo(() => {
    const c = convertirDepenses(
      JSON.parse(cle) as Depense[],
      reference,
      etat,
      langue
    );
    return {
      lignes: c.lignes.map(l => ({
        libelle: l.libelle,
        paye: l.texte,
        enReference: l.texteReference,
      })),
      totalTexte: c.totalTexte,
      sansTaux: c.sansTaux,
    };
  }, [cle, reference, etat, langue]);
}

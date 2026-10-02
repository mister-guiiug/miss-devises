import { z } from 'zod';
import { create } from 'zustand';
import { createVersionedStore } from '@mister-guiiug/dev-pwa-config/versioned-store';

const CODE = z.string().regex(/^[A-Z]{3}$/);

const schema = z.object({
  reference: CODE,
  devise: CODE,
  recentes: z.array(CODE).max(6),
  sensVolet: z.enum(['devise', 'reference']),
  periode: z.enum(['1M', '6M', '1A']),
  /**
   * Dessins ou photos dans le volet (spécification 002, récit 3). Ajoutés
   * avec une valeur par défaut, ils ne relèvent pas la version : une
   * préférence d'avant eux se lit en dessins, l'avis encore à lire.
   */
  images: z.enum(['dessins', 'photos']).default('dessins'),
  /** L'avis sur Wikimedia a été lu : il ne s'affiche qu'une fois. */
  avisPhotos: z.boolean().default(false),
});

export type Preferences = z.infer<typeof schema>;

/**
 * L'euro pour référence : c'est la demande d'origine (« une monnaie de
 * référence : l'euro »), et qui ne touche à rien retrouve la version 001.
 *
 * La livre égyptienne par défaut : c'est l'exemple de la demande d'origine
 * (« visite du musée, 200 EGP vers euro »), et une devise que la BCE ne
 * publie pas — la première ouverture montre donc la source de marché.
 */
export const DEFAUTS: Preferences = {
  reference: 'EUR',
  devise: 'EGP',
  recentes: [],
  sensVolet: 'devise',
  periode: '1A',
  images: 'dessins',
  avisPhotos: false,
};

/**
 * Clé `miss-devises:preferences`, version 2 (spécification 002, modèle de
 * données). La version 1 ne connaissait que l'euro : il devient la
 * référence, et le volet qui montrait « l'euro » montre « la référence ».
 */
export const preferencesStore = createVersionedStore<Preferences>({
  store: 'miss-devises',
  key: 'preferences',
  version: 2,
  validate: (data: unknown) => schema.parse(data),
  seed: () => DEFAUTS,
  migrations: {
    1: (data: unknown) => {
      if (typeof data !== 'object' || data === null) return data;
      const v1 = data as Record<string, unknown>;
      return {
        ...v1,
        reference: 'EUR',
        sensVolet: v1.sensVolet === 'euro' ? 'reference' : v1.sensVolet,
      };
    },
  },
});

interface EtatPreferences extends Preferences {
  choisirDevise: (code: string) => void;
  /**
   * Change de référence. Si la nouvelle référence est la devise affichée, les
   * deux s'échangent : référence et devise ne sont jamais la même (EF-004).
   */
  choisirReference: (code: string) => void;
  basculerVolet: () => void;
  choisirPeriode: (periode: Preferences['periode']) => void;
  choisirImages: (images: Preferences['images']) => void;
  /** L'avis sur Wikimedia est lu, et les photos choisies. */
  accepterPhotos: () => void;
}

/** Une fabrique, pour qu'un test relise les préférences comme au rechargement. */
export function creerPreferences() {
  return create<EtatPreferences>((set, get) => {
    const sauver = (changement: Partial<Preferences>) => {
      set(changement);
      const {
        reference,
        devise,
        recentes,
        sensVolet,
        periode,
        images,
        avisPhotos,
      } = get();
      preferencesStore.save({
        reference,
        devise,
        recentes,
        sensVolet,
        periode,
        images,
        avisPhotos,
      });
    };
    return {
      ...preferencesStore.load(),
      choisirDevise: code =>
        sauver({
          devise: code,
          recentes: [code, ...get().recentes.filter(c => c !== code)].slice(
            0,
            6
          ),
        }),
      choisirReference: code => {
        const { reference, devise } = get();
        if (code === reference) return;
        sauver({
          reference: code,
          ...(code === devise ? { devise: reference } : {}),
        });
      },
      basculerVolet: () =>
        sauver({
          sensVolet: get().sensVolet === 'devise' ? 'reference' : 'devise',
        }),
      choisirPeriode: periode => sauver({ periode }),
      choisirImages: images => sauver({ images }),
      accepterPhotos: () => sauver({ images: 'photos', avisPhotos: true }),
    };
  });
}

export const usePreferences = creerPreferences();

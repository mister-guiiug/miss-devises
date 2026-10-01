import { z } from 'zod';
import { create } from 'zustand';
import { createVersionedStore } from '@mister-guiiug/dev-pwa-config/versioned-store';

const CODE = z.string().regex(/^[A-Z]{3}$/);

const schema = z.object({
  devise: CODE,
  recentes: z.array(CODE).max(6),
  sensVolet: z.enum(['devise', 'euro']),
  periode: z.enum(['1M', '6M', '1A']),
});

export type Preferences = z.infer<typeof schema>;

/**
 * La livre égyptienne par défaut : c'est l'exemple de la demande d'origine
 * (« visite du musée, 200 EGP vers euro »), et une devise que la BCE ne
 * publie pas — la première ouverture montre donc la source de marché.
 */
export const DEFAUTS: Preferences = {
  devise: 'EGP',
  recentes: [],
  sensVolet: 'devise',
  periode: '1A',
};

/** Clé `miss-devises:preferences`, version 1 (modèle de données). */
export const preferencesStore = createVersionedStore<Preferences>({
  store: 'miss-devises',
  key: 'preferences',
  version: 1,
  validate: (data: unknown) => schema.parse(data),
  seed: () => DEFAUTS,
  migrations: {},
});

interface EtatPreferences extends Preferences {
  choisirDevise: (code: string) => void;
  basculerVolet: () => void;
  choisirPeriode: (periode: Preferences['periode']) => void;
}

/** Une fabrique, pour qu'un test relise les préférences comme au rechargement. */
export function creerPreferences() {
  return create<EtatPreferences>((set, get) => {
    const sauver = (changement: Partial<Preferences>) => {
      set(changement);
      const { devise, recentes, sensVolet, periode } = get();
      preferencesStore.save({ devise, recentes, sensVolet, periode });
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
      basculerVolet: () =>
        sauver({ sensVolet: get().sensVolet === 'devise' ? 'euro' : 'devise' }),
      choisirPeriode: periode => sauver({ periode }),
    };
  });
}

export const usePreferences = creerPreferences();

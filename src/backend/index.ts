import { createLocalBackend } from './local.ts';

/**
 * LE BACKEND, LOCAL ET LUI SEUL (ADR 0013). Le squelette choisissait à
 * l'exécution entre l'appareil et Supabase ; cette application ne connaît pas
 * de compte (spécification 001, EF-014), et la couche distante est partie
 * avec l'écran de compte. Le port reste : un adaptateur distant pourrait
 * revenir sans que les écrans changent.
 */
export const backend = createLocalBackend();

export type {
  Backend,
  CarnetInstantane,
  ConversionEnregistree,
} from './ports.ts';

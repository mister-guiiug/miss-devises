import { z } from 'zod';
import { createLogger } from '@mister-guiiug/dev-pwa-config/logger';

const log = createLogger('config');

/**
 * LA CONFIGURATION EST VALIDÉE, ET SON ABSENCE NE BLOQUE PAS LE DÉMARRAGE.
 *
 * Les deux moitiés comptent. Valider dit ce qui est cassé au lieu de laisser
 * une chaîne vide se propager : le 02/09/2026, une app du parc était en ligne
 * avec `apiKey: undefined` dans son bundle, CI verte, backend injoignable, et
 * rien pour le dire. Ne pas bloquer garde l'app utilisable hors ligne, en test,
 * et dans une CI sans secrets — ce que les cinq apps local-first font par
 * nature et que les autres doivent savoir faire.
 *
 * Tout est OPTIONNEL ici parce que l'application démarre sans rien. Une app qui
 * exige une variable la rend obligatoire dans ce schéma ET la déclare dans
 * `config/env.manifest.json`, d'où dérivent `.env.example` et le `required-env`
 * du déploiement.
 */
const schema = z.object({
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  VITE_BASE_PATH: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

function read(): Env {
  const result = schema.safeParse(import.meta.env);
  if (result.success) return result.data;

  // Journaliser, puis continuer sur ce qui est lisible : une variable mal
  // formée ne doit pas empêcher l'app de s'ouvrir sur son repli local.
  log.warn('configuration invalide, repli sur les valeurs par défaut', {
    problemes: result.error.issues.map(
      issue => `${issue.path.join('.')}: ${issue.message}`
    ),
  });
  return {};
}

export const env = read();

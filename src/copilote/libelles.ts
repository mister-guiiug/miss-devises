/**
 * LES LIBELLÉS DU COPILOTE, en français et en anglais (constitution,
 * principe IV). Ils vivent dans le morceau du copilote, pas dans
 * `src/i18n/messages.ts` : le bundle publié n'en porte aucun.
 */
import { useI18n } from '../i18n/index.ts';

const fr = {
  ouvrir: 'Copilote',
  avertissement:
    'Le modèle peut se tromper ; les montants, eux, viennent de l’application.',
  envoyer: 'Envoyer',
  arreter: 'Arrêter',
  joindre: 'Joindre une photo',
  reflexion: 'Réflexion…',
  retirerPiece: 'Retirer la pièce jointe',
  fermer: 'Fermer le copilote',
  titre: 'Copilote',
  sousTitre: 'démo AG-UI · CopilotKit',
  onglets: 'Vues du copilote',
  ongletConversation: 'Conversation',
  ongletEvenements: 'Événements',
  ongletDepenses: 'Dépenses',
  ongletModele: 'Modèle',
  modeleLegende: 'Qui répond ?',
  modeSimule: 'Le modèle simulé',
  modeSimuleAide:
    'Un script qui comprend quelques tournures. Rien ne quitte l’appareil, aucune clé.',
  modeClaude: 'Claude, avec votre clé Anthropic',
  modeClaudeAide:
    'Comprend vos phrases et lit les photos. Les appels sont facturés sur votre compte Anthropic.',
  modeleChoix: 'Modèle',
  avisEnvoi:
    'Ce que vous écrivez au copilote, la description de l’écran Convertir, les dépenses notées et les photos jointes partent chez Anthropic (États-Unis), directement depuis ce navigateur, avec votre clé. L’application n’a pas de serveur : elle ne voit ni la clé ni les échanges.',
  avisCle:
    'La clé reste dans cet onglet (sessionStorage) et disparaît à sa fermeture.',
  avisPolitique: 'Politique de confidentialité d’Anthropic',
  nouvelOnglet: '(nouvel onglet)',
  cleLibelle: 'Votre clé d’API Anthropic',
  cleDouteuse: 'Une clé d’API Anthropic commence par « sk-ant- ».',
  cleUtiliser: 'Utiliser cette clé',
  cleObtenir: 'Créer une clé dans la console d’Anthropic',
  cleEnregistree: 'Clé enregistrée pour cet onglet (…{fin})',
  oublierCle: 'Oublier la clé',
  sansCle: 'clé à saisir',
  placeholder: 'Ex. : un ramen à 1 200 yens',
  bienvenue:
    'Demandez une conversion en une phrase, ou joignez la photo d’une étiquette. Je règle l’écran, et je réponds avec ce que l’application calcule.',
  conversionEnCours: 'Conversion…',
  conversionDe: 'Conversion de {montant} {devise}…',
  conversionFaite: 'Calculé par l’application',
  conversionImpossible: 'Pas de conversion',
  avecFrais: 'Frais {libelle} ({description}) : {frais}, soit {total}',
  marge: 'Marge : {marge}',
  fraisEnCours: 'Frais…',
  fraisAppliques: 'Frais appliqués : {libelle}, {description}',
  fraisRepris: 'déjà enregistrés, repris',
  depenseEnCours: 'Note de la dépense…',
  depenseNotee: 'Dépense notée : {libelle}, {montant}',
  depensesVides:
    'Aucune dépense notée. Écrivez « note un taxi à 3000 yens » dans la conversation.',
  depensesTitre: 'Dépenses notées par l’agent',
  depensesAide:
    'L’agent écrit cette liste par l’état partagé (STATE_DELTA) ; l’application convertit chaque ligne. Retirer une ligne change l’état que l’agent reçoit au tour suivant.',
  total: 'Total',
  sansTaux: 'sans taux',
  retirer: 'Retirer {libelle}',
  inspecteurVide:
    'Aucun événement. Envoyez un message : chaque événement AG-UI que le client reçoit s’affichera ici.',
  effacer: 'Effacer',
  filtrer: 'Filtrer par type d’événement',
  tous: 'Tous',
  execution: 'Exécution {id}',
  enCours: 'en cours',
  finie: 'finie',
  enErreur: 'en erreur',
  evenements: '{n} événements',
  entree:
    'Entrée envoyée : {messages} messages ({roles}), outils : {outils}, {contexte} contextes',
  jetons: 'Jetons : {entree} en entrée ({cache} en cache), {sortie} en sortie',
  modeleInconnu: 'modèle ?',
} as const;

type Cle = keyof typeof fr;

const en: Record<Cle, string> = {
  ouvrir: 'Copilot',
  avertissement: 'The model can be wrong; the amounts come from the app.',
  envoyer: 'Send',
  arreter: 'Stop',
  joindre: 'Attach a photo',
  reflexion: 'Thinking…',
  retirerPiece: 'Remove the attachment',
  fermer: 'Close the copilot',
  titre: 'Copilot',
  sousTitre: 'AG-UI · CopilotKit demo',
  onglets: 'Copilot views',
  ongletConversation: 'Chat',
  ongletEvenements: 'Events',
  ongletDepenses: 'Expenses',
  ongletModele: 'Model',
  modeleLegende: 'Who answers?',
  modeSimule: 'The simulated model',
  modeSimuleAide:
    'A script that understands a few phrasings. Nothing leaves the device, no key.',
  modeClaude: 'Claude, with your Anthropic key',
  modeClaudeAide:
    'Understands your sentences and reads photos. Calls are billed to your Anthropic account.',
  modeleChoix: 'Model',
  avisEnvoi:
    'What you write to the copilot, the description of the Convert screen, the noted expenses and attached photos go to Anthropic (United States), straight from this browser, with your key. The app has no server: it sees neither the key nor the exchanges.',
  avisCle:
    'The key stays in this tab (sessionStorage) and is gone when it closes.',
  avisPolitique: 'Anthropic’s privacy policy',
  nouvelOnglet: '(new tab)',
  cleLibelle: 'Your Anthropic API key',
  cleDouteuse: 'An Anthropic API key starts with “sk-ant-”.',
  cleUtiliser: 'Use this key',
  cleObtenir: 'Create a key in the Anthropic console',
  cleEnregistree: 'Key saved for this tab (…{fin})',
  oublierCle: 'Forget the key',
  sansCle: 'key needed',
  placeholder: 'E.g. a ramen for 1,200 yen',
  bienvenue:
    'Ask for a conversion in one sentence, or attach a photo of a price tag. I set the screen, and answer with what the app computes.',
  conversionEnCours: 'Converting…',
  conversionDe: 'Converting {montant} {devise}…',
  conversionFaite: 'Computed by the app',
  conversionImpossible: 'No conversion',
  avecFrais: '{libelle} fees ({description}): {frais}, total {total}',
  marge: 'Margin: {marge}',
  fraisEnCours: 'Fees…',
  fraisAppliques: 'Fees applied: {libelle}, {description}',
  fraisRepris: 'already saved, reused',
  depenseEnCours: 'Noting the expense…',
  depenseNotee: 'Expense noted: {libelle}, {montant}',
  depensesVides:
    'No expense noted. Write “add a taxi at 3000 yen” in the chat.',
  depensesTitre: 'Expenses noted by the agent',
  depensesAide:
    'The agent writes this list through shared state (STATE_DELTA); the app converts each line. Removing a line changes the state the agent receives next turn.',
  total: 'Total',
  sansTaux: 'no rate',
  retirer: 'Remove {libelle}',
  inspecteurVide:
    'No event yet. Send a message: every AG-UI event the client receives will show here.',
  effacer: 'Clear',
  filtrer: 'Filter by event type',
  tous: 'All',
  execution: 'Run {id}',
  enCours: 'running',
  finie: 'finished',
  enErreur: 'failed',
  evenements: '{n} events',
  entree:
    'Input sent: {messages} messages ({roles}), tools: {outils}, {contexte} contexts',
  jetons: 'Tokens: {entree} in ({cache} cached), {sortie} out',
  modeleInconnu: 'model ?',
};

export function useLibelles() {
  const { locale } = useI18n();
  const table: Record<Cle, string> = locale === 'en' ? en : fr;
  return {
    locale,
    t: (cle: Cle, valeurs: Record<string, string | number> = {}) =>
      table[cle].replace(/\{(\w+)\}/g, (_, nom: string) =>
        String(valeurs[nom] ?? '')
      ),
  };
}

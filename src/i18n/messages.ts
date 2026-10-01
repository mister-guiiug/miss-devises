/**
 * Les dictionnaires de l'application, une entrée par locale et TOUTES DE MÊME
 * FORME : `createI18n` dérive le type des clés du dictionnaire de repli, et le
 * compilateur refuse ensuite `t('cle.qui.nexiste.pas')`.
 *
 * CE FICHIER NE CONTIENT PAS LES LIBELLÉS DES COMPOSANTS DU SOCLE (« Fermer »,
 * « Réessayer », « Retour »…). Ils vivent dans `react/labels`, en sept langues,
 * et `I18nProvider` pose `LabelsProvider` avec la locale courante tout seul.
 *
 * PAS DE `as const` ICI, et c'est délibéré. Il figerait chaque chaîne
 * française comme son PROPRE type littéral, et le dictionnaire anglais devrait
 * alors contenir… les mêmes mots français. La forme est ce qui doit
 * correspondre, pas le contenu.
 */
const fr = {
  app: {
    name: 'Miss Devises',
    tagline:
      'Convertisseur de devises visuel : billets et pièces sous les yeux, conversion dans les deux sens, historique des taux et conversions annotées.',
  },
  nav: {
    convert: 'Convertir',
    history: 'Historique',
    carnet: 'Carnet',
    settings: 'Réglages',
    about: 'À propos',
  },
  convert: {
    title: 'Convertir',
    devise: 'Devise',
    choisir: 'Changer de devise',
    montant: 'Montant en {nom}',
    montantEuro: 'Montant en euros',
    inverser: 'Inverser les deux devises',
    invalide: 'Montant illisible : chiffres, et une virgule ou un point.',
    taux: '1 € = {taux}',
    tauxInverse: '1 {code} = {taux}',
    source: {
      bce: 'taux de référence de la BCE',
      marche: 'taux de marché',
    },
    date: '{source}, du {date}',
    ancien: 'Taux du {date} : plus de 3 jours.',
    absent:
      'Aucun taux connu pour cette devise. Il se chargera dès que l’appareil sera en ligne.',
    horsLigne: 'Hors ligne : derniers taux connus.',
    indicatif: 'Taux indicatif, frais de change non compris.',
    reessayer: 'Réessayer',
    recherche: 'Rechercher une devise',
    recentes: 'Récentes',
    toutes: 'Toutes les devises',
    aucune: 'Aucune devise ne correspond.',
    billets: 'Billets et pièces',
    libelle: 'Libellé',
    libelleExemple: 'Visite du musée',
    enregistrer: 'Enregistrer',
    enregistre: 'Enregistré dans le carnet.',
  },
  money: {
    title: 'Billets et pièces',
    billets: 'Billets',
    pieces: 'Pièces',
    voirDevise: 'En {code}',
    voirEuro: 'En euros',
    composition: 'Composition de {montant}',
    reste: 'Reste {montant}, sous la plus petite pièce.',
    inconnues:
      'Les billets et pièces de cette devise ne sont pas encore répertoriés. La conversion reste disponible.',
    plusEmis: 'n’est plus émis',
    billet: 'Billet de {valeur}, soit {contre}',
    piece: 'Pièce de {valeur}, soit {contre}',
    toucher: 'Touchez vos billets et pièces pour composer le montant.',
    ajoute: '{nombre} × {valeur}',
    retirer: 'Retirer un {valeur}',
    remettre: 'Remettre à zéro',
    utiliser: 'Utiliser ce montant',
    source: 'Coupures relevées le {date}.',
    sources: 'Sources',
    sens: 'Afficher les coupures',
    chargement: 'Chargement des billets et pièces…',
    billetSeul: 'Billet de {valeur}',
    pieceSeule: 'Pièce de {valeur}',
    contre: '≈ {montant}',
    moinsDe: 'moins de {montant}',
    total: 'Total : {montant}, soit {contre}',
    totalSeul: 'Total : {montant}',
    compte: {
      one: '{count} ajouté',
      other: '{count} ajoutés',
    },
  },
  history: {
    title: 'Historique',
    periodes: {
      '1M': '1 mois',
      '6M': '6 mois',
      '1A': '1 an',
    },
    plusHaut: 'Plus haut',
    plusBas: 'Plus bas',
    variation: 'Variation',
    comparaison:
      '{montant} valaient {avant} le {date}, et valent {maintenant} aujourd’hui.',
    ecart: 'Écart : {ecart} ({pourcentage}).',
    sansMontant: 'Saisissez un montant dans Convertir pour le comparer.',
    chargement: 'Chargement de l’historique…',
    horsLigne:
      'Cette période n’a pas encore été consultée : elle sera disponible hors ligne une fois chargée.',
    incomplete: 'Quelques dates manquent : la courbe passe au-dessus.',
    courbe: 'Évolution de 1 € en {code} sur {periode}',
    periode: 'Période',
    le: 'le {date}',
    hausse: 'en hausse',
    baisse: 'en baisse',
    stable: 'stable',
    description:
      '{nombre} points du {debut} au {fin} : de {premier} à {dernier}, plus bas {min}, plus haut {max}.',
    sourceDates: '{source}, du {debut} au {fin}',
  },
  carnet: {
    title: 'Carnet',
    vide: 'Aucune conversion enregistrée.',
    videAide:
      'Depuis Convertir, donnez un libellé à une conversion et enregistrez-la.',
    aujourdhui: 'Aujourd’hui : {montant} ({ecart})',
    taux: 'Taux du {date} : 1 € = {taux}',
    renommer: 'Renommer',
    renommerTitre: 'Renommer la conversion',
    renommerLigne: 'Renommer « {libelle} »',
    supprimerLigne: 'Supprimer « {libelle} »',
    valider: 'Valider',
    supprimer: 'Supprimer',
    supprime: 'Conversion supprimée.',
    annuler: 'Annuler',
    totaux: 'Totaux',
    total: '{montant}, soit {euros}',
    count: {
      one: '{count} conversion',
      other: '{count} conversions',
    },
  },
  settings: {
    title: 'Réglages',
    appearance: 'Apparence',
    language: 'Langue',
    data: 'Carnet',
    export: 'Exporter le carnet',
    import: 'Importer un carnet',
    importConfirm: 'Remplacer le carnet actuel ?',
    importBody:
      'Le fichier remplacera toutes les conversions de cet appareil. Exportez d’abord si vous voulez garder l’état actuel.',
    imported: {
      one: '{count} conversion importée.',
      other: '{count} conversions importées.',
    },
    importFailed: 'Fichier refusé : {error}',
    reset: 'Tout effacer',
    resetConfirm: 'Effacer tout le carnet ?',
    resetBody: 'Cette action est définitive.',
  },
  about: {
    title: 'À propos',
    what: 'Convertisseur de devises visuel : billets et pièces sous les yeux, conversion dans les deux sens, historique des taux et conversions annotées.',
    sources: 'D’où viennent les taux',
    sourcesBody:
      'Les taux de référence de la Banque centrale européenne, via Frankfurter, pour les 29 devises qu’elle publie ; pour les autres, les taux de marché de fawazahmed0/currency-api. Ils sont indicatifs : un bureau de change applique ses propres taux et ses frais.',
    billets: 'Billets et pièces',
    billetsBody:
      'Ils sont dessinés à leur couleur et à leurs proportions, jamais reproduits : la reproduction des billets est encadrée, voire interdite, par les banques centrales.',
    vieprivee:
      'Le carnet et les réglages restent sur cet appareil. Pour lire un taux, l’application interroge api.frankfurter.dev, cdn.jsdelivr.net et currency-api.pages.dev, qui voient l’adresse IP de l’appareil et rien d’autre.',
  },
};

const en: typeof fr = {
  app: {
    name: 'Miss Devises',
    tagline:
      'A visual currency converter: banknotes and coins in plain sight, conversion both ways, rate history and labelled conversions.',
  },
  nav: {
    convert: 'Convert',
    history: 'History',
    carnet: 'Log',
    settings: 'Settings',
    about: 'About',
  },
  convert: {
    title: 'Convert',
    devise: 'Currency',
    choisir: 'Change currency',
    montant: 'Amount in {nom}',
    montantEuro: 'Amount in euros',
    inverser: 'Swap the two currencies',
    invalide: 'Unreadable amount: digits, and one comma or point.',
    taux: '€1 = {taux}',
    tauxInverse: '1 {code} = {taux}',
    source: {
      bce: 'ECB reference rate',
      marche: 'market rate',
    },
    date: '{source}, from {date}',
    ancien: 'Rate from {date}: more than 3 days old.',
    absent:
      'No rate known for this currency yet. It will load as soon as the device is online.',
    horsLigne: 'Offline: last known rates.',
    indicatif: 'Indicative rate, exchange fees not included.',
    reessayer: 'Retry',
    recherche: 'Search a currency',
    recentes: 'Recent',
    toutes: 'All currencies',
    aucune: 'No currency matches.',
    billets: 'Banknotes and coins',
    libelle: 'Label',
    libelleExemple: 'Museum visit',
    enregistrer: 'Save',
    enregistre: 'Saved to the log.',
  },
  money: {
    title: 'Banknotes and coins',
    billets: 'Banknotes',
    pieces: 'Coins',
    voirDevise: 'In {code}',
    voirEuro: 'In euros',
    composition: 'Breakdown of {montant}',
    reste: '{montant} left, below the smallest coin.',
    inconnues:
      'The banknotes and coins of this currency are not listed yet. Conversion is still available.',
    plusEmis: 'no longer issued',
    billet: '{valeur} banknote, worth {contre}',
    piece: '{valeur} coin, worth {contre}',
    toucher: 'Tap your banknotes and coins to build the amount.',
    ajoute: '{nombre} × {valeur}',
    retirer: 'Remove one {valeur}',
    remettre: 'Reset',
    utiliser: 'Use this amount',
    source: 'Denominations as of {date}.',
    sources: 'Sources',
    sens: 'Show denominations',
    chargement: 'Loading banknotes and coins…',
    billetSeul: '{valeur} banknote',
    pieceSeule: '{valeur} coin',
    contre: '≈ {montant}',
    moinsDe: 'less than {montant}',
    total: 'Total: {montant}, i.e. {contre}',
    totalSeul: 'Total: {montant}',
    compte: {
      one: '{count} added',
      other: '{count} added',
    },
  },
  history: {
    title: 'History',
    periodes: {
      '1M': '1 month',
      '6M': '6 months',
      '1A': '1 year',
    },
    plusHaut: 'High',
    plusBas: 'Low',
    variation: 'Change',
    comparaison:
      '{montant} was worth {avant} on {date}, and is worth {maintenant} today.',
    ecart: 'Difference: {ecart} ({pourcentage}).',
    sansMontant: 'Enter an amount in Convert to compare it.',
    chargement: 'Loading history…',
    horsLigne:
      'This period has not been viewed yet: it will be available offline once loaded.',
    incomplete: 'A few dates are missing: the curve skips over them.',
    courbe: '€1 in {code} over {periode}',
    periode: 'Period',
    le: 'on {date}',
    hausse: 'rising',
    baisse: 'falling',
    stable: 'flat',
    description:
      '{nombre} points from {debut} to {fin}: from {premier} to {dernier}, low {min}, high {max}.',
    sourceDates: '{source}, from {debut} to {fin}',
  },
  carnet: {
    title: 'Log',
    vide: 'No saved conversions.',
    videAide: 'In Convert, give a conversion a label and save it.',
    aujourdhui: 'Today: {montant} ({ecart})',
    taux: 'Rate of {date}: €1 = {taux}',
    renommer: 'Rename',
    renommerTitre: 'Rename the conversion',
    renommerLigne: 'Rename “{libelle}”',
    supprimerLigne: 'Delete “{libelle}”',
    valider: 'Confirm',
    supprimer: 'Delete',
    supprime: 'Conversion deleted.',
    annuler: 'Undo',
    totaux: 'Totals',
    total: '{montant}, i.e. {euros}',
    count: {
      one: '{count} conversion',
      other: '{count} conversions',
    },
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    data: 'Log',
    export: 'Export the log',
    import: 'Import a log',
    importConfirm: 'Replace the current log?',
    importBody:
      'The file will replace every conversion on this device. Export first if you want to keep the current state.',
    imported: {
      one: '{count} conversion imported.',
      other: '{count} conversions imported.',
    },
    importFailed: 'File rejected: {error}',
    reset: 'Erase everything',
    resetConfirm: 'Erase the whole log?',
    resetBody: 'This cannot be undone.',
  },
  about: {
    title: 'About',
    what: 'A visual currency converter: banknotes and coins in plain sight, conversion both ways, rate history and labelled conversions.',
    sources: 'Where the rates come from',
    sourcesBody:
      'The European Central Bank reference rates, through Frankfurter, for the 29 currencies it publishes; for the others, the market rates of fawazahmed0/currency-api. They are indicative: an exchange office applies its own rates and fees.',
    billets: 'Banknotes and coins',
    billetsBody:
      'They are drawn in their colour and proportions, never reproduced: central banks restrict, or forbid, banknote reproduction.',
    vieprivee:
      'The log and the settings stay on this device. To read a rate, the app queries api.frankfurter.dev, cdn.jsdelivr.net and currency-api.pages.dev, which see the device’s IP address and nothing else.',
  },
};

export const messages = { fr, en };
export type Messages = typeof fr;

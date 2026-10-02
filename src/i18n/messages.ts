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
    inverser: 'Inverser les deux devises',
    invalide: 'Montant illisible : chiffres, et une virgule ou un point.',
    taux: '{un} = {taux}',
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
    vraiesPhotos: 'Vraies photos',
    photosDisponibles: '{count} sur {total} coupures',
    dessin: 'Dessin',
    avisTitre: 'Les photos viennent de Wikimedia Commons',
    avis: 'Pour les afficher, l’appareil les demande aux serveurs de la Wikimedia Foundation (États-Unis), qui voient son adresse IP, son navigateur, l’heure et les images demandées, donc les coupures affichées ; ni référent ni cookie ne leur est envoyé. Les dessins, eux, ne demandent rien à personne.',
    avisAfficher: 'Afficher les photos',
    avisGarder: 'Garder les dessins',
    aucunePhoto: 'Aucune photo libre pour cette devise.',
    credit: 'Crédit',
    creditDe: 'Crédit de la photo : {coupure}, sur Wikimedia Commons',
    credits: 'Crédits des photos',
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
    courbe: 'Évolution de {un} en {code} sur {periode}',
    periode: 'Période',
    le: 'le {date}',
    hausse: 'en hausse',
    baisse: 'en baisse',
    stable: 'stable',
    description:
      '{nombre} points du {debut} au {fin} : de {premier} à {dernier}, plus bas {min}, plus haut {max}.',
    sourceDates: '{source}, du {debut} au {fin}',
    curseur: 'Lire la courbe',
    point: 'Le {date} : {un} = {taux}',
  },
  carnet: {
    title: 'Carnet',
    vide: 'Aucune conversion enregistrée.',
    videAide:
      'Depuis Convertir, donnez un libellé à une conversion et enregistrez-la.',
    aujourdhui: 'Aujourd’hui : {montant} ({ecart})',
    taux: 'Taux du {date} : {un} = {taux}',
    renommer: 'Renommer',
    renommerTitre: 'Renommer la conversion',
    renommerLigne: 'Renommer « {libelle} »',
    supprimerLigne: 'Supprimer « {libelle} »',
    valider: 'Valider',
    supprimer: 'Supprimer',
    supprime: 'Conversion supprimée.',
    annuler: 'Annuler',
    totaux: 'Totaux',
    total: '{montant}, soit {reference}',
    count: {
      one: '{count} conversion',
      other: '{count} conversions',
    },
  },
  settings: {
    title: 'Réglages',
    reference: 'Monnaie de référence',
    referenceAide:
      'Convertir, l’historique et le carnet comptent dans cette devise. Les conversions déjà gardées restent dans la leur.',
    referenceChoisir: 'Changer de monnaie de référence',
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
    accroche: 'Le convertisseur de devises qui montre l’argent.',
    fonctions: 'Ce qu’elle fait',
    fonction: {
      convertir:
        'Convertir dans les deux sens, à chaque chiffre, entre votre monnaie de référence et une devise, avec la source et la date du taux.',
      billets:
        'Voir les billets et les pièces de 41 devises, en dessins ou en photos, et composer un montant en les touchant.',
      historique:
        'Comparer un montant à ce qu’il valait il y a un mois, six mois ou un an.',
      carnet:
        'Garder ses conversions dans un carnet, chacune avec son libellé.',
      horsLigne: 'Convertir hors ligne, avec les derniers taux connus.',
    },
    sources: 'D’où viennent les taux',
    source: {
      bce: 'les taux de référence de la Banque centrale européenne, pour les 29 devises qu’elle publie.',
      marche: 'les taux de marché, pour toutes les autres devises.',
    },
    indicatif:
      'Ils sont indicatifs : un bureau de change applique ses propres taux et ses frais.',
    billets: 'Billets et pièces',
    billetsBody:
      'Ils sont dessinés à leur couleur et à leurs proportions. À la demande, le volet montre à la place des photos libres de Wikimedia Commons, réduites, d’une seule face et créditées ; les devises dont la banque centrale encadre ou interdit la reproduction gardent leurs dessins.',
    confidentialite: 'Confidentialité',
    surAppareil:
      'Le carnet et les réglages restent sur cet appareil, sans compte. L’export en fichier est la seule façon de les en sortir.',
    tiers:
      'Pour lire un taux, l’application interroge ces trois adresses. Elles voient l’adresse IP de l’appareil, les dates demandées et, pour un historique de la BCE, le code de la devise ; jamais un montant ni un libellé.',
    tiersPhotos:
      'En mode photos seulement, le navigateur demande les images à thumb.wikimedia.org et upload.wikimedia.org (Wikimedia Foundation, États-Unis), qui voient l’adresse IP de l’appareil, son navigateur et les images demandées ; ni référent ni cookie ne leur est envoyé.',
    sansMesure: 'Ni mesure d’audience, ni cookie, ni publicité.',
    credits: 'Crédits',
    credit: {
      drapeaux: 'les drapeaux, sous licence MIT.',
      photos:
        'les photos des billets et des pièces, chacune sous sa licence et créditée dans le volet.',
    },
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
    inverser: 'Swap the two currencies',
    invalide: 'Unreadable amount: digits, and one comma or point.',
    taux: '{un} = {taux}',
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
    vraiesPhotos: 'Real photos',
    photosDisponibles: '{count} of {total} denominations',
    dessin: 'Drawing',
    avisTitre: 'The photos come from Wikimedia Commons',
    avis: 'To show them, the device requests them from the Wikimedia Foundation servers (United States), which see its IP address, its browser, the time and the requested images, hence the denominations shown; no referrer and no cookie is sent. The drawings ask nothing of anyone.',
    avisAfficher: 'Show the photos',
    avisGarder: 'Keep the drawings',
    aucunePhoto: 'No free photo for this currency.',
    credit: 'Credit',
    creditDe: 'Photo credit: {coupure}, on Wikimedia Commons',
    credits: 'Photo credits',
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
    courbe: '{un} in {code} over {periode}',
    periode: 'Period',
    le: 'on {date}',
    hausse: 'rising',
    baisse: 'falling',
    stable: 'flat',
    description:
      '{nombre} points from {debut} to {fin}: from {premier} to {dernier}, low {min}, high {max}.',
    sourceDates: '{source}, from {debut} to {fin}',
    curseur: 'Read the curve',
    point: '{date}: {un} = {taux}',
  },
  carnet: {
    title: 'Log',
    vide: 'No saved conversions.',
    videAide: 'In Convert, give a conversion a label and save it.',
    aujourdhui: 'Today: {montant} ({ecart})',
    taux: 'Rate of {date}: {un} = {taux}',
    renommer: 'Rename',
    renommerTitre: 'Rename the conversion',
    renommerLigne: 'Rename “{libelle}”',
    supprimerLigne: 'Delete “{libelle}”',
    valider: 'Confirm',
    supprimer: 'Delete',
    supprime: 'Conversion deleted.',
    annuler: 'Undo',
    totaux: 'Totals',
    total: '{montant}, i.e. {reference}',
    count: {
      one: '{count} conversion',
      other: '{count} conversions',
    },
  },
  settings: {
    title: 'Settings',
    reference: 'Reference currency',
    referenceAide:
      'Convert, the history and the log count in this currency. Conversions already saved keep their own.',
    referenceChoisir: 'Change the reference currency',
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
    accroche: 'The currency converter that shows the money.',
    fonctions: 'What it does',
    fonction: {
      convertir:
        'Convert both ways, at every keystroke, between your reference currency and another, with the source and date of the rate.',
      billets:
        'See the banknotes and coins of 41 currencies, as drawings or photos, and build an amount by tapping them.',
      historique:
        'Compare an amount with what it was worth a month, six months or a year ago.',
      carnet: 'Keep your conversions in a log, each with its own label.',
      horsLigne: 'Convert offline, with the last known rates.',
    },
    sources: 'Where the rates come from',
    source: {
      bce: 'the European Central Bank reference rates, for the 29 currencies it publishes.',
      marche: 'market rates, for every other currency.',
    },
    indicatif:
      'They are indicative: an exchange office applies its own rates and fees.',
    billets: 'Banknotes and coins',
    billetsBody:
      'They are drawn in their colour and proportions. On request, the sheet shows free photos from Wikimedia Commons instead, reduced, one side only and credited; currencies whose central bank restricts or forbids reproduction keep their drawings.',
    confidentialite: 'Privacy',
    surAppareil:
      'The log and the settings stay on this device, without an account. Exporting a file is the only way to take them out.',
    tiers:
      'To read a rate, the app queries these three addresses. They see the device’s IP address, the requested dates and, for an ECB history, the currency code; never an amount or a label.',
    tiersPhotos:
      'In photo mode only, the browser requests the images from thumb.wikimedia.org and upload.wikimedia.org (Wikimedia Foundation, United States), which see the device’s IP address, its browser and the requested images; no referrer and no cookie is sent.',
    sansMesure: 'No audience measurement, no cookie, no advertising.',
    credits: 'Credits',
    credit: {
      drapeaux: 'the flags, under the MIT licence.',
      photos:
        'the photos of banknotes and coins, each under its own licence and credited in the sheet.',
    },
  },
};

export const messages = { fr, en };
export type Messages = typeof fr;

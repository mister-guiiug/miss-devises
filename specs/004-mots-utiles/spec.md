# Spécification : les mots utiles du pays

**Branche** : `004-mots-utiles`
**Créée le** : 26/10/2026
**Statut** : validée pour la planification
**Demande d'origine** : « en fonction de la langue de l'application, ajouter un
endroit, à choisir, pour afficher les mots débrouillards pour marchander,
demander à faire de la monnaie (casser un billet), l'addition… »

## Scénarios et tests _(obligatoire)_

### Récit 1 : dire les mots qui servent à payer (priorité P1)

Au souk du Caire, il convertit 200 livres et veut négocier. Sous la conversion,
« Mots utiles » ouvre les phrases en arabe égyptien : « بكام ده؟ », sa
transcription « bikam da? », et ce qu'elle veut dire, dans la langue de
l'application : « Combien ça coûte ? ». Il touche la phrase : elle s'affiche en
grand, à montrer au vendeur.

**Pourquoi cette priorité** : demandé explicitement ; c'est le geste qui suit
une conversion au marché, au restaurant ou au guichet.

**Test indépendant** : avec la devise EGP, ouvrir « Mots utiles », lire les
quatre groupes de phrases en arabe égyptien avec leur sens ; passer
l'application en anglais, relire le sens en anglais ; toucher une phrase et la
voir en grand.

**Scénarios d'acceptation** :

1. **Étant donné** la devise EGP, **quand** j'ouvre « Mots utiles », **alors**
   je lis seize phrases en arabe égyptien, en quatre groupes : les bases,
   marchander, la monnaie, l'addition. Chacune montre le texte, sa
   transcription en lettres latines, et son sens.
2. **Étant donné** l'application en français, **alors** le sens est en
   français (« L'addition, s'il vous plaît ») ; en anglais, **alors** il est en
   anglais (« The bill, please »).
3. **Étant donné** une devise de plusieurs langues (CHF : allemand, français,
   italien), **alors** je choisis la langue dans la feuille, la première par
   défaut ; la langue de l'application n'est pas proposée.
4. **Étant donné** une seconde devise (spécification 003), **alors** ses
   langues s'ajoutent à celles de la devise.
5. **Étant donné** une phrase, **quand** je la touche, **alors** elle s'affiche
   en grand, avec sa transcription et son sens, et un bouton pour revenir à la
   liste.
6. **Étant donné** une devise dont le pays parle la langue de l'application
   (XOF avec l'application en français), ou une devise sans phrases relevées,
   **alors** le bouton « Mots utiles » n'apparaît pas.
7. **Étant donné** un appareil hors ligne, **alors** les phrases s'affichent :
   elles sont livrées avec l'application.
8. **Étant donné** un lecteur d'écran, **alors** chaque phrase est annoncée
   dans sa langue (`lang`), l'arabe et l'hébreu s'écrivent de droite à
   gauche (`dir`), et le sens est lu dans la langue de l'application.

### Cas limites

- **Formes de politesse qui dépendent du locuteur** (thaï ครับ/ค่ะ, hindi,
  hébreu) : les deux formes, séparées d'une barre oblique.
- **Écritures absentes de l'appareil** : les polices du système couvrent
  l'arabe, l'hébreu, le thaï, le devanagari, le chinois, le japonais et le
  coréen sur les téléphones visés ; la transcription reste lisible partout.
- **Très petits écrans** : rien ne déborde sur 320 px ; une phrase longue se
  replie.

## Exigences _(obligatoire)_

### Exigences fonctionnelles

- **EF-001** : l'écran Convertir DOIT proposer « Mots utiles » quand la devise
  ou la seconde devise a au moins une langue relevée autre que celle de
  l'application.
- **EF-002** : les phrases DOIVENT couvrir quatre besoins : les bases
  (bonjour, merci, s'il vous plaît, non merci), marchander, faire la monnaie,
  l'addition.
- **EF-003** : chaque phrase DOIT montrer son texte, sa transcription latine
  pour une autre écriture, et son sens dans la langue de l'application.
- **EF-004** : une phrase touchée DOIT s'afficher en grand, pour être montrée.
- **EF-005** : les phrases DOIVENT être livrées avec l'application ; aucune
  requête réseau.
- **EF-006** : chaque phrase DOIT porter sa langue (`lang`) et son sens
  d'écriture (`dir`).

### Entités clés

- **Langue relevée** : un code BCP 47 (`ar-EG`, `zh-Hans`…), son sens
  d'écriture, et ses seize phrases (texte, transcription facultative).
- **Langues d'une devise** : la liste ordonnée des langues utiles dans les
  pays de la devise, la plus utile d'abord.

## Critères de réussite _(obligatoire)_

### Résultats mesurables

- **CR-001** : les 41 devises illustrées ont chacune au moins une langue ;
  chaque langue a ses seize phrases, et une transcription pour toute écriture
  non latine (test sur tout le jeu).
- **CR-002** : chaque phrase a été relue contre le guide de conversation de
  Wikivoyage de sa langue ; la relecture et ses corrections sont publiées
  dans [phrases.md](./phrases.md).
- **CR-003** : la feuille tient sur 320 px, sans violation axe, dans les deux
  thèmes.
- **CR-004** : le poids reste sous le budget de `package.json` ; le jeu de
  phrases n'est pas préchargé.

## Clarifications

### Séance du 26/10/2026

- Q : « en fonction de la langue de l'application » ? → R : le sens de chaque
  phrase est donné dans la langue de l'application ; la phrase elle-même est
  dans la langue du pays de la devise. Celle de l'application n'est jamais
  proposée : on la parle déjà.
- Q : « un endroit, à choisir » ? → R : l'emplacement est laissé au choix de
  l'implémentation : un bouton « Mots utiles » à côté de « Billets et pièces »
  sur l'écran Convertir, qui ouvre une feuille, comme le volet des billets.
  Les phrases suivent la devise convertie, au moment où elles servent.
- Q : quel arabe ? → R : celui qu'on parle au marché, quand il diffère :
  égyptien pour l'EGP, darija pour le MAD ; un arabe standard simple pour les
  dirhams des Émirats, le dinar jordanien et le dinar tunisien, où le français
  est aussi proposé.
- Q : faire entendre la phrase ? → R : pas dans cette spécification. Les voix
  de synthèse manquent pour plusieurs de ces langues sur un appareil hors
  ligne ; montrer la phrase en grand marche partout.

## Hypothèses

- Une phrase courte et usuelle n'est pas une œuvre : la relire contre un guide
  sous licence libre n'en fait pas une copie, et le jeu est rédigé ici.
- Les marchés où l'on marchande sont ceux des pays dont la langue diffère de
  celle de l'application ; ailleurs, les phrases de l'addition et de la
  monnaie servent quand même.

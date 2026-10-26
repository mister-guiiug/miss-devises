# Spécification : les frais d'une conversion, et les phrases parlées

**Branche** : `005-frais-et-voix`
**Créée le** : 26/10/2026
**Statut** : validée pour la planification
**Demande d'origine** : « sur les mots utiles ajoute une version parlée des
phrases ; ajoute la possibilité d'ajouter des Fees sur les conversions ».

## Scénarios et tests _(obligatoire)_

### Récit 1 : ce que la conversion coûte, frais compris (priorité P1)

Sa banque lui prend 2 % et 0,50 € par paiement à l'étranger ; le distributeur
de Bangkok, 220 bahts par retrait. Dans les réglages, elle enregistre deux
frais, « Carte » et « Retrait ». Sur l'écran Convertir, elle choisit
« Carte » : sous les montants, « Coût avec frais : 3,97 € », et le détail,
« dont 0,57 € de frais (2 % + 0,50 €) ».

**Pourquoi cette priorité** : demandé explicitement ; c'est l'écart entre le
taux affiché et ce que le relevé bancaire dira.

**Test indépendant** : enregistrer des frais, les choisir sur Convertir,
vérifier le coût et le détail ; recharger, les retrouver ; les supprimer.

**Scénarios d'acceptation** (taux de l'exemple : 58,83 EGP pour 1 €) :

1. **Étant donné** aucun frais enregistré, **alors** l'écran Convertir est
   inchangé ; les réglages proposent « Ajouter des frais ».
2. **Étant donné** des frais « Carte » de 2 % et 0,50 €, choisis sur Convertir,
   **quand** je saisis 200 EGP, **alors** je lis « Coût avec frais : 3,97 € »
   et « dont 0,57 € de frais » : 200 EGP font 3,3996 €, plus 2 % (0,068 €)
   et 0,50 €.
3. **Étant donné** des frais fixes dans une autre devise (220 THB), **alors**
   ils se convertissent en référence au taux de leur paire, avec la même
   source ; sans taux pour elle, le coût n'est pas calculé et l'écran le dit.
4. **Étant donné** plusieurs frais enregistrés, **alors** j'en choisis un, ou
   aucun, sur l'écran Convertir ; le choix est gardé.
5. **Étant donné** des frais enregistrés, **alors** je peux les modifier et les
   supprimer dans les réglages ; supprimer les frais choisis revient à
   « aucun ».
6. **Étant donné** une marge de bureau, **alors** les frais s'ajoutent au
   montant indicatif, pas au montant après marge : les deux ne se cumulent
   pas (une carte paie au taux du réseau, un bureau prend sa marge).
7. **Étant donné** une conversion enregistrée au carnet, **alors** il garde le
   taux indicatif, sans les frais, et l'écran le dit.

---

### Récit 2 : entendre une phrase (priorité P2)

Au marché de Bangkok, il ne sait pas lire « ลดได้ไหม ». Il touche le
haut-parleur à côté de la phrase : l'appareil la prononce en thaï, à une
vitesse posée. Il la fait entendre au vendeur.

**Pourquoi cette priorité** : demandé explicitement ; la transcription aide à
lire, la voix aide à se faire comprendre.

**Test indépendant** : avec une voix thaïe sur l'appareil, toucher
« Écouter » : la phrase est dite en thaï ; sans voix pour une langue, les
boutons n'apparaissent pas et la feuille le dit.

**Scénarios d'acceptation** :

1. **Étant donné** une voix pour la langue choisie, **alors** chaque phrase a
   un bouton « Écouter », dans la liste et en grand.
2. **Quand** je touche « Écouter », **alors** la phrase est dite dans sa langue,
   un peu plus lentement que la normale ; le bouton devient « Arrêter »
   jusqu'à la fin.
3. **Étant donné** une phrase en cours, **quand** j'en écoute une autre,
   **alors** la première s'arrête.
4. **Étant donné** aucune voix pour la langue (ni la variante, ni la langue de
   base), ou un navigateur sans synthèse vocale, **alors** aucun bouton
   « Écouter » et une phrase le dit ; afficher en grand reste possible.
5. **Étant donné** une variante sans voix propre (arabe égyptien), **alors** une
   voix de la langue de base (arabe) la dit.
6. **Étant donné** un lecteur d'écran, **alors** chaque bouton nomme la phrase
   qu'il fait entendre (« Écouter : Combien ça coûte ? »).

### Cas limites

- **Frais à zéro** (0 % et 0) : refusés, ils n'ont rien à compter.
- **Changement de référence** : des frais fixes en euros restent en euros et
  se convertissent ; ils ne suivent pas la référence.
- **Voix chargées en différé** (Chrome) : les boutons apparaissent quand la
  liste des voix arrive.
- **La fin d'une phrase longue** : la phrase est gardée en mémoire jusqu'à la
  fin de la lecture (sinon certains navigateurs coupent la voix).

## Exigences _(obligatoire)_

### Exigences fonctionnelles

- **EF-001** : l'utilisateur DOIT pouvoir enregistrer, modifier et supprimer
  jusqu'à six frais : un libellé, un pourcentage, un montant fixe et sa
  devise ; au moins le pourcentage ou le montant fixe non nul.
- **EF-002** : l'écran Convertir DOIT proposer, dès qu'un frais existe, de
  choisir les frais appliqués ou aucun ; le choix est gardé.
- **EF-003** : avec des frais choisis et un montant, l'écran DOIT montrer le
  coût en référence frais compris et le montant des frais, calculés sur le
  montant indicatif, arrondis à l'affichage seulement.
- **EF-004** : un montant fixe dans une autre devise DOIT se convertir au taux
  de sa paire avec la référence ; sans ce taux, aucun coût n'est inventé.
- **EF-005** : chaque phrase des mots utiles DOIT pouvoir être dite par la
  synthèse vocale de l'appareil, dans sa langue, quand une voix existe.
- **EF-006** : sans voix pour une langue, l'écran DOIT le dire, sans bouton
  qui ne ferait rien.

### Entités clés

- **Frais** : un identifiant, un libellé, un pourcentage, un montant fixe et sa
  devise ; dans les préférences, avec le frais choisi.

## Critères de réussite _(obligatoire)_

### Résultats mesurables

- **CR-001** : sans frais enregistré, les parcours des spécifications 001 à
  004 passent à l'identique (e2e).
- **CR-002** : les chiffres du scénario 2 du récit 1 sont vérifiés par un test.
- **CR-003** : le choix d'une voix (variante, langue de base, voix locale
  d'abord) est vérifié par un test sur une liste de voix simulée.
- **CR-004** : sur 320 px, rien ne déborde ; axe ne relève aucune violation,
  frais choisis et feuille des mots ouverte, dans les deux thèmes.
- **CR-005** : le poids reste sous le budget de `package.json`.

## Clarifications

### Séance du 26/10/2026

- Q : « Fees » : la marge du bureau existe déjà ? → R : elle reste ; c'est un
  écart sur le taux, retranché du montant reçu. Les frais sont ceux d'une
  banque ou d'un distributeur : un pourcentage et un montant fixe ajoutés à
  ce que coûte un paiement ou un retrait. Ils se montrent à part, sous les
  montants, pour ne pas fausser la conversion.
- Q : plusieurs frais ? → R : oui (« des Fees ») : on en enregistre plusieurs,
  on en applique un à la fois, comme on paie soit par carte, soit en espèces
  retirées.
- Q : une voix enregistrée, ou celle de l'appareil ? → R : celle de l'appareil
  (synthèse vocale du navigateur) : aucune requête, aucun fichier de plus ; une
  voix enregistrée pour 432 phrases pèserait des mégaoctets.

## Hypothèses

- Les téléphones visés ont des voix pour les langues courantes ; certaines
  (tagalog, darija) peuvent manquer, et le récit 2 le traite.
- Des frais fixes se paient une fois par opération : le coût suppose que le
  montant saisi est une seule opération.

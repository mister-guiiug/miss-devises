# Le jeu de phrases : couverture et relecture

Relevé du 26/10/2026 : `src/data/phrases.json`, seize phrases dans 27 langues,
pour les 41 devises illustrées (`src/data/langues.ts`).

## Méthode

1. Rédaction ici, phrase par phrase, dans le registre poli d'un échange avec
   un vendeur, un serveur ou un caissier ; la variété parlée au marché quand
   elle diffère de la langue écrite (arabe égyptien, darija).
2. Relecture de chaque langue contre son guide de conversation de Wikivoyage,
   et contre des dictionnaires pour les phrases que ces guides ne couvrent
   pas : ils donnent les bases, « combien », « trop cher » et l'addition, mais
   rarement la monnaie d'un billet, le dernier prix ou « gardez la monnaie ».
3. Chaque correction est appliquée au jeu, puis les tests du jeu le revérifient
   (seize phrases par langue, transcription des écritures non latines).

## Corrections de la relecture

18 sur 432 phrases.

| Langue | Phrase           | Avant                           | Après                                    | Raison                                                                   |
| ------ | ---------------- | ------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| ja     | dernier prix     | これが最終価格ですか            | これが一番安い値段ですか                 | « prix final » se dit d'une enchère ; au marché, « le prix le plus bas » |
| ko     | non merci        | gwaenchansseumnida              | gwaenchanseumnida                        | romanisation révisée                                                     |
| ko     | casser un billet | 이 지폐 좀 바꿔 주실 수 있어요? | 이 지폐 잔돈으로 좀 바꿔 주실 수 있어요? | « changer » seul se lit comme un change de devises                       |
| hi     | une erreur       | kuch                            | kuchh                                    | transcription cohérente avec « chhutte »                                 |
| hi     | casser un billet | यह नोट तोड़ सकते हैं            | इस नोट के छुट्टे दे सकते हैं             | la tournure courante                                                     |
| th     | casser un billet | แลกแบงก์นี้ได้ไหม               | แตกแบงก์นี้ได้ไหม                        | แลก se lit comme un change ; แตกแบงก์ est « casser un billet »           |
| vi     | casser un billet | Đổi giúp tôi tờ tiền này…       | Đổi giúp tôi tờ này ra tiền lẻ…          | « đổi tiền » seul veut dire changer des devises                          |
| vi     | dernier prix     | Giá cuối                        | Giá chót                                 | le mot du marchandage                                                    |
| id     | casser un billet | Bisa pecah uang ini?            | Bisa tukar uang ini dengan uang kecil?   | « pecah » ne se construit pas ainsi                                      |
| ar-EG  | pas de monnaie   | ma’aysh fakka                   | ma’ish fakka                             | prononciation de معيش                                                    |
| ar-MA  | bonjour          | السلام (salam)                  | السلام عليكم (s-salamu ’alikum)          | la transcription ne rendait pas l'article ; la forme polie               |
| ar-MA  | casser un billet | tsref                           | tserref                                  | ṣref veut dire « dépenser », ṣerref « faire la monnaie »                 |
| pt     | non merci        | Não, obrigado                   | Não, obrigado / obrigada                 | le mot suit le genre de qui parle                                        |
| pt     | pas de monnaie   | Não tenho troco.                | Não tenho dinheiro trocado.              | « troco » est la monnaie que rend le caissier                            |
| pl     | petite monnaie   | Czy ma Pan drobne?              | Czy ma Pan/Pani drobne?                  | « Pan » ne s'adresse qu'à un homme                                       |
| da     | s'il vous plaît  | Vær så venlig                   | Ja tak                                   | peu usité ; on dit « tak » à la fin d'une demande                        |
| nb     | s'il vous plaît  | Vær så snill                    | Ja takk                                  | sonne comme une supplication                                             |
| sv     | s'il vous plaît  | Snälla                          | Ja tack                                  | familier, presque une supplique                                          |

Gardées après relecture : le thaï คะ (et non ค่ะ) dans une question d'une
femme ; « cambio » en espagnol, compris partout même si l'on dit « sencillo »
dans les Andes ; « poslední cena » en tchèque ; « Tartsa meg a visszajárót »
en hongrois.

## Guides consultés

- [Arabic](https://en.wikivoyage.org/wiki/Arabic_phrasebook),
  [Egyptian Arabic](https://en.wikivoyage.org/wiki/Egyptian_Arabic_phrasebook),
  [Moroccan Arabic](https://en.wikivoyage.org/wiki/Moroccan_Arabic_phrasebook),
  [Hebrew](https://en.wikivoyage.org/wiki/Hebrew_phrasebook)
- [Thai](https://en.wikivoyage.org/wiki/Thai_phrasebook),
  [Vietnamese](https://en.wikivoyage.org/wiki/Vietnamese_phrasebook),
  [Indonesian](https://en.wikivoyage.org/wiki/Indonesian_phrasebook),
  [Malay](https://en.wikivoyage.org/wiki/Malay_phrasebook),
  [Tagalog](https://en.wikivoyage.org/wiki/Tagalog_phrasebook)
- [Japanese](https://en.wikivoyage.org/wiki/Japanese_phrasebook),
  [Korean](https://en.wikivoyage.org/wiki/Korean_phrasebook),
  [Chinese](https://en.wikivoyage.org/wiki/Chinese_phrasebook),
  [Hindi](https://en.wikivoyage.org/wiki/Hindi_phrasebook)
- [Polish](https://en.wikivoyage.org/wiki/Polish_phrasebook),
  [Czech](https://en.wikivoyage.org/wiki/Czech_phrasebook),
  [Hungarian](https://en.wikivoyage.org/wiki/Hungarian_phrasebook),
  [Romanian](https://en.wikivoyage.org/wiki/Romanian_phrasebook),
  [Turkish](https://en.wikivoyage.org/wiki/Turkish_phrasebook),
  [Danish](https://en.wikivoyage.org/wiki/Danish_phrasebook),
  [Norwegian](https://en.wikivoyage.org/wiki/Norwegian_phrasebook),
  [Swedish](https://en.wikivoyage.org/wiki/Swedish_phrasebook)

## Limites

Une relecture n'est pas un locuteur natif. Les phrases de la monnaie et du
dernier prix, que les guides couvrent peu, sont les plus exposées : une
correction proposée par un locuteur se fait dans `phrases.json`, et les tests
du jeu la revérifient.

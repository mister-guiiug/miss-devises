# Billets et pièces : le relevé du 01/10/2026

Le jeu de données `src/data/coupures.json` a été relevé le 01/10/2026 pour les
41 devises de la clarification du 01/10, auprès des banques centrales quand leur
site se lisait, sinon de Wikipédia (en anglais ou en français). Les couleurs sont
des approximations de la couleur nommée par la source : un dessin stylisé, pas
une reproduction (EF-006).

## Conventions

- **Métal** : la couleur visible, pas l'alliage. `argent` pour l'acier nickelé,
  l'inox, l'aluminium et le cupronickel ; `laiton` pour le laiton, le bronze
  d'aluminium et l'or nordique ; `cuivre` pour l'acier cuivré ; `autre` pour la
  seule pièce de 50 Kč (couronne cuivrée, cœur doré).
- **Bimétal** : le CENTRE, puis l'ANNEAU. La 2 € est `bimetal-or-argent`. Le
  relevé nommait l'anneau d'abord : les 37 pièces bimétalliques ont été
  permutées à la préparation.
- **Dimensions** : `largeurMm` est toujours le grand côté (les billets suisses,
  décrits en lecture verticale, sont retournés).
- **Décimales** : celles d'`Intl`, que l'application affiche. IDR et HUF passent
  de 2 (ISO 4217) à 0 : aucune pièce de sen ni de fillér ne circule.
- **Exclus** : les coupures sans cours légal ou retirées (1000 DKK depuis le
  31/05/2025, 2000 INR), et les pièces sans usage réel (VND et ARS : aucune).

## Ce qui reste incertain

Les devises à forte inflation (ARS, TRY, EGP) sont relevées à la date du
01/10/2026 et vieilliront les premières. Le détail, devise par devise :

### AED : dirham des Émirats arabes unis

Transition vers le polymère : 5, 10, 50, 100, 500 et 1000 Dh en polymère (formats polymère indiqués), 20 et 200 Dh encore en papier (formats papier) ; les billets papier des autres valeurs circulent encore. Couleur du 1000 Dh : brun-olive en polymère, turquoise en papier. Pièces de 1, 5 et 10 fils quasi inusitées (exclues). La pièce de 50 fils est heptagonale.

Sources : <https://en.wikipedia.org/wiki/United_Arab_Emirates_dirham>, <https://www.polymernotes.com/en/news/the-united-arab-emirates-a-polymer-100-dirham-note-completes-the-series.html>.

### ARS : peso argentin

Forte inflation : gamme relevée au 01/10/2026. Billets courants : 1000, 2000, 10 000 et 20 000 $ (20 000 $ émis le 13/11/2024, plus grosse coupure ; pas de 50 000 $ à cette date) ; 100, 200 et 500 $ encore valables mais peu utilisés ; 10, 20 et 50 $ ne circulent plus. Pièces (1 centavo à 10 $) toujours valables mais sans usage réel (frappe arrêtée, refusées dans les commerces) : liste vide. Format commun des billets non relu à la source : omis. Couleurs : 2000 $ gris foncé et rose (BCRA), 10 000 $ bleu clair à bleu-vert, 20 000 $ bleu (avec de l'ocre).

Sources : <https://www.bcra.gob.ar/en/billete-de-2000-de-circulacion/>, <https://en.wikipedia.org/wiki/Argentine_peso>, <https://es.wikipedia.org/wiki/Peso_(moneda_de_Argentina)>.

### AUD : dollar australien

Un nouveau billet de 5 $ (thème des Premières Nations) est en préparation, sans date d'émission connue. Pièces de 1 et 2 cents retirées depuis 1992. La 50 cents est dodécagonale (diamètre mesuré entre plats).

Sources : <https://en.wikipedia.org/wiki/Banknotes_of_the_Australian_dollar>, <https://en.wikipedia.org/wiki/Coins_of_the_Australian_dollar>.

### BRL : réal brésilien

Billets de la 1re famille (1994-2010) encore valables mais plus émis. Pièce de 1 centavo plus frappée (exclue).

Sources : <https://en.wikipedia.org/wiki/Brazilian_real>, <https://www.bcb.gov.br/dinheirobrasileiro/segunda-familia-moedas.html>.

### CAD : dollar canadien

Nouveau billet vertical de 20 $ (Charles III) dévoilé le 03/09/2026, mise en circulation progressive prévue fin février 2027. Le 10 $ vertical (2018) circule avec l'ancien modèle. Plus de pièce de 1 cent depuis 2013 (arrondi à 5 cents) ; la pièce de 50 cents circule très peu.

Sources : <https://en.wikipedia.org/wiki/Banknotes_of_the_Canadian_dollar>, <https://en.wikipedia.org/wiki/Coins_of_the_Canadian_dollar>, <https://www.bankofcanada.ca/2026/09/bank-canada-unveils-new-vertical-20-bank-note/>.

### CHF : franc suisse

La BNS donne les formats « 70 x 123 mm » (billets à lecture verticale) ; ici largeurMm = grand côté. Une 10e série est annoncée pour après 2030 ; la 8e série n'a plus cours légal depuis 2021 (échangeable à la BNS).

Sources : <https://www.snb.ch/en/the-snb/mandates-goals/cash/series-9>, <https://en.wikipedia.org/wiki/Banknotes_of_the_Swiss_franc>, <https://en.wikipedia.org/wiki/Coins_of_the_Swiss_franc>.

### CNY : yuan (renminbi)

Espèces peu utilisées (paiement mobile). Billets de 1 et 5 jiao et pièces de fen valables mais rares (exclus). La pièce de 5 jiao de 2019 est nickelée (argentée) ; l'ancienne version dorée circule encore. Couleur du 20 ¥ : brun (éditions 1999/2005) ou orangé (éditions récentes).

Sources : <https://en.wikipedia.org/wiki/Fifth_series_of_the_renminbi>, <https://en.wikipedia.org/wiki/Renminbi>.

### CZK : couronne tchèque

La pièce de 50 Kč a une couronne cuivrée et un cœur doré (classée « autre »). Pièces de 2 Kč (11 pans) et 20 Kč (13 pans).

Sources : <https://en.wikipedia.org/wiki/Czech_koruna>, <https://www.cnb.cz/en/banknotes-and-coins/banknotes/>.

### DKK : couronne danoise

Le billet de 1000 kr n'a plus cours légal depuis le 31/05/2025 (exclu). Nouvelle série de billets (50 à 500 kr) prévue en 2028-2029. Pièces de 1, 2 et 5 kr percées.

Sources : <https://en.wikipedia.org/wiki/Danish_krone>, <https://www.nationalbanken.dk/en/what-we-do/notes-and-coins/danish-banknotes-today>.

### EGP : livre égyptienne

Inflation élevée : gamme relevée au 01/10/2026. Les 10 £ et 20 £ existent en papier et en polymère (formats et couleurs des versions polymère 2022-2023 indiqués). Les petites valeurs (25 et 50 piastres, 1 £) existent en billets et en pièces. Pièces de 5, 10 et 20 piastres rares (exclues) ; la 25 piastres est percée.

Sources : <https://en.wikipedia.org/wiki/Egyptian_pound>.

### EUR : euro

Le billet de 500 € n'est plus émis depuis 2019 mais garde cours légal. Une 3e série de billets est en préparation (décision de la BCE attendue fin 2026, mise en circulation pas avant ~2028). Plusieurs pays arrondissent à 5 cents et n'utilisent guère les pièces de 1 et 2 cents (Finlande, Pays-Bas, Belgique, Irlande, Italie, Slovaquie, Estonie).

Sources : <https://en.wikipedia.org/wiki/Euro_banknotes>, <https://en.wikipedia.org/wiki/Euro_coins>, <https://en.wikipedia.org/wiki/500_euro_note>.

### GBP : livre sterling

Seuls les billets de la Banque d'Angleterre sont décrits : ceux des banques écossaises et nord-irlandaises n'ont pas été relevés. Billets Élisabeth II et Charles III circulent ensemble. Pièces de 20 p et 50 p heptagonales ; 1 £ à 12 pans (23,03 à 23,43 mm selon l'article Wikipédia « One pound (British coin) »).

Sources : <https://www.bankofengland.co.uk/banknotes/current-banknotes>, <https://en.wikipedia.org/wiki/Banknotes_of_the_pound_sterling>, <https://en.wikipedia.org/wiki/Coins_of_the_pound_sterling>.

### HKD : dollar de Hong Kong

Billets de 20 à 1000 $ émis par trois banques (HSBC, Standard Chartered, Bank of China) : dessins différents, mêmes formats et couleurs ; le 10 $ (papier et polymère) est émis par le gouvernement. Pièces de 20 cents et 2 $ festonnées : diamètre maximal retenu.

Sources : <https://www.bochk.com/dam/bochk/desktop/top/aboutus/banknote/2018/index_en.html>, <https://en.wikipedia.org/wiki/Hong_Kong_ten-dollar_note>, <https://en.wikipedia.org/wiki/Coins_of_the_Hong_Kong_dollar>.

### HUF : forint hongrois

L'ISO 4217 prévoit 2 décimales mais le fillér n'est plus utilisé. Couleurs d'après l'« effet d'ensemble » décrit par les règlements MNB de chaque billet (net.jogtar.hu) : 10 000 Ft « jaunâtre-bordeaux » à impressions violettes, 20 000 Ft bleu-vert. Décimales ramenées de 2 (ISO 4217) à 0 (Intl, ce que l'application affiche).

Sources : <https://www.mnb.hu/bankjegy-es-erme/ermeink>, <https://www.mnb.hu/bankjegy-es-erme/bankjegyeink/500-forintos-bankjegy>, <https://net.jogtar.hu/jogszabaly?docid=a1400031.mnb>.

### IDR : roupie indonésienne

L'ISO 4217 prévoit 2 décimales, inutilisées en pratique. Les billets de la série 2016 restent valables à côté de ceux de 2022. La pièce de 50 Rp a cours légal mais est quasi inusitée (exclue). Une redénomination (suppression de trois zéros) est envisagée sans date ferme (Wikipédia). Décimales ramenées de 2 (ISO 4217) à 0 (Intl, ce que l'application affiche).

Sources : <https://www.bi.go.id/id/rupiah/gambar-uang/default.aspx>, <https://www.detik.com/edu/detikpedia/d-6243873/ciri-ciri-uang-baru-2022-tiap-pecahan-begini-bedanya>, <https://id.wikipedia.org/wiki/Uang_koin_rupiah>.

### ILS : nouveau shekel israélien

Aucun doute signalé.

Sources : <https://en.wikipedia.org/wiki/Israeli_new_shekel>.

### INR : roupie indienne

Le billet de 2000 ₹ a été retiré de la circulation en 2023 (il garde cours légal) : exclu. Plusieurs séries de pièces de 1 à 10 ₹ coexistent (tailles et métaux variables) ; la 50 paise n'est plus frappée (exclue). Pièce de 20 ₹ dodécagonale.

Sources : <https://en.wikipedia.org/wiki/Mahatma_Gandhi_New_Series>, <https://en.wikipedia.org/wiki/Coins_of_the_Indian_rupee>.

### ISK : couronne islandaise

Le billet de 2000 kr n'est plus produit mais reste valable (rare ; format non relevé, couleur brune d'après la recherche). Couleur du 5000 kr : bleu-vert selon Wikipédia, souvent dite bleue.

Sources : <https://en.wikipedia.org/wiki/Icelandic_kr%C3%B3na>, <https://www.visindavefur.is/svar.php?id=30697>.

### JOD : dinar jordanien

Nouvelle série de billets 2022-2023 ; l'ancienne série reste valable. Couleurs des 20 et 50 JD variables selon les descriptions (cyan ou vert-bleu ; violet ou brun-violet). Composition de la pièce de 10 piastres non précisée par la source (aspect argenté retenu). Pièces de ¼ et ½ dinar heptagonales ; pièce de 1 dinar non relevée.

Sources : <https://en.wikipedia.org/wiki/Jordanian_dinar>.

### JPY : yen

Nouvelle série de billets depuis 2024 (1000, 5000, 10 000 ¥) ; les séries précédentes restent valables. Le billet de 2000 ¥ est valable mais très rarement vu. Pièces de 5 et 50 ¥ percées.

Sources : <https://en.wikipedia.org/wiki/Banknotes_of_the_Japanese_yen>, <https://en.wikipedia.org/wiki/Coins_of_the_Japanese_yen>, <https://en.wikipedia.org/wiki/500_yen_coin>.

### KRW : won sud-coréen

Pièces de 1 et 5 won frappées seulement pour les coffrets (exclues). Le 5000 ₩ est décrit orange par la source (teinte rouge-orangé).

Sources : <https://en.wikipedia.org/wiki/South_Korean_won>.

### MAD : dirham marocain

Nouvelle gamme de billets 2023-2024, aux mêmes couleurs que la série 2012/2013 qui circule encore. Pièces : la série 2023 est décrite (fiches Bank Al-Maghrib) ; des pièces des séries antérieures (2002, 2011) circulent encore.

Sources : <https://www.bkam.ma/Billets-et-monnaies/Billets-et-pieces-en-circulation/Billets-en-circulation/Serie-2023/Billet-de-100-dh>, <https://www.bkam.ma/Billets-et-monnaies/Billets-et-pieces-en-circulation/Pieces-en-circulation/Serie-2023/5-dirham>, <https://en.wikipedia.org/wiki/Moroccan_dirham>.

### MUR : roupie mauricienne

Passage progressif au polymère (25, 50 et 500 Rs en 2013 ; 1000 Rs en 2024 ; 100 et 200 Rs en 2025) : billets papier et polymère circulent ensemble. Caractéristiques des pièces tirées de Wikipédia seulement ; la 10 Rs est heptagonale et la 5 cents peu utilisée.

Sources : <https://en.wikipedia.org/wiki/Mauritian_rupee>, <https://www.bom.mu/bank-notes-coins/polymer-notes/communique>.

### MXN : peso mexicain

Formats et couleurs relevés sur la fiche Banxico de chaque billet de la famille G (le 20 $ G, commémoratif, est vert et rouge). Le 20 $ bleu de la famille F est en retrait depuis le 10/10/2025 (reste valable, d'après El Financiero) ; seuls le 20 $ G et les pièces de 20 $ resteront en vigueur dans cette valeur. Plusieurs modèles de pièces de 20 $ circulent (dodécagonales de 30 mm, rondes de 32 mm). Centavos peu utilisés ; la 20 centavos dodécagonale dorée de la famille C (19,5 mm) a aussi encore cours légal selon la Banxico.

Sources : <https://www.banxico.org.mx/billetes-y-monedas/billete-1000-pesos-familia-.html>, <https://www.banxico.org.mx/billetes-y-monedas/moneda-20-pesos-c-reciente-00001.html>, <https://en.wikipedia.org/wiki/Mexican_peso>.

### MYR : ringgit malaisien

Pièce de 1 sen plus émise (arrondi aux 5 sen) ; pièce de 1 ringgit démonétisée en 2005.

Sources : <https://en.wikipedia.org/wiki/Malaysian_ringgit>.

### NOK : couronne norvégienne

Couleur du 500 kr décrite jaune par Wikipédia, souvent orangée ailleurs. Pièces de 1 et 5 kr percées.

Sources : <https://en.wikipedia.org/wiki/Norwegian_krone>, <https://www.norges-bank.no/en/topics/notes-and-coins/legal-tender-notes-coins/>, <https://www.norges-bank.no/en/topics/notes-and-coins/legal-tender-notes-coins/20-krone-coin/20-design/>.

### NZD : dollar néo-zélandais

Plus de pièce de 5 cents depuis 2006. Premières pièces à l'effigie de Charles III attendues en 2027 ; nouveaux billets après épuisement des stocks.

Sources : <https://en.wikipedia.org/wiki/New_Zealand_dollar>.

### PHP : peso philippin

Les billets de 50, 100, 500 et 1000 ₱ existent aussi en polymère (1000 depuis 2022, les autres depuis décembre 2024) : format relevé pour la série papier NGC. Le 20 ₱ n'est plus réapprovisionné (remplacé par la pièce) et le 200 ₱ n'est plus produit depuis 2021 ; tous deux restent valables. La pièce de 5 ₱ existe en version ronde (2017) et à 9 pans (2019) ; pièces de 1 et 5 sentimo peu utilisées.

Sources : <https://en.wikipedia.org/wiki/New_Generation_Currency_Series>, <https://en.wikipedia.org/wiki/Philippine_peso>.

### PLN : zloty polonais

Le billet de 500 zł est multicolore (violet, gris, bleu, jaune, vert) : teinte grise-violette retenue. Projet de billet de 1000 zł abandonné en 2024.

Sources : <https://en.wikipedia.org/wiki/Polish_coins_and_banknotes>, <https://pl.wikipedia.org/wiki/Monety_obiegowe_III_Rzeczypospolitej>, <https://en.wikipedia.org/wiki/Polish_z%C5%82oty>.

### RON : leu roumain

Pages de la BNR non lisibles par l'outil : données tirées de Wikipédia (anglais et roumain, concordantes).

Sources : <https://en.wikipedia.org/wiki/Romanian_leu>, <https://ro.wikipedia.org/wiki/Leu_rom%C3%A2nesc>.

### SEK : couronne suédoise

Aucun doute signalé.

Sources : <https://en.wikipedia.org/wiki/Swedish_krona>, <https://sv.wikipedia.org/wiki/Svenska_mynt>.

### SGD : dollar de Singapour

Billets de 1000 $ (production arrêtée en 2021) et de 10 000 $ (impression arrêtée en 2014) toujours valables mais rares. Pièce de 1 cent retirée de la circulation en 2002 (encore valable, exclue).

Sources : <https://en.wikipedia.org/wiki/Singapore_dollar>.

### THB : baht thaïlandais

Les billets de 20, 50 et 100 ฿ existent aussi en polymère (50 et 100 depuis le 21/11/2025 selon Wikipédia), même format. Pièces de 1, 5 et 10 satang non mises en circulation générale (exclues).

Sources : <https://en.wikipedia.org/wiki/Banknotes_of_the_Thai_baht>, <https://www.royalthaimint.net/ewtadmin/ewt/mint_web/ewt_news.php?nid=784>.

### TND : dinar tunisien

Diamètres non trouvés dans une source fiable lisible, sauf 200 millimes et 2 dinars (pièces à 13 pans). Disposition des métaux de la 5 dinars (couronne dorée, cœur argenté) tirée de catalogues numismatiques, non vérifiée auprès de la BCT. Pièces de 10 et 20 millimes peu utilisées ; 5 millimes (aluminium) exclue. Des billets des séries 2011/2013 circulent encore.

Sources : <https://en.wikipedia.org/wiki/Tunisian_dinar>, <https://kapitalis.com/tunisie/2022/04/28/tunisie-les-principales-caracteristiques-des-nouveaux-billets-de-banque-mis-en-circulation/>, <https://destination-tunis.fr/informations-utiles/dinar-tunisien/>.

### TRY : livre turque

Forte inflation : gamme relevée au 01/10/2026 (billets de 5 à 200 ₺, aucune coupure supérieure à cette date). Pièces de 1, 5 et 10 kuruş très peu utilisées. Le billet de 5 ₺ est violet depuis 2013 (brun auparavant).

Sources : <https://en.wikipedia.org/wiki/Turkish_lira>, <https://en.wikipedia.org/wiki/Banknotes_of_Turkey>.

### USD : dollar américain

Tous les billets ont le même format (Wikipédia : 15,6 × 6,7 cm) et une dominante vert-gris ; les couleurs indiquées reprennent les teintes de fond des séries récentes (le 1 $ et le 2 $ n'en ont pas). La frappe du cent pour la circulation s'est arrêtée le 12/11/2025 : il garde cours légal (article Wikipédia « Penny (United States coin) ») mais se raréfie, certains commerces arrondissent à 5 cents. Billet de 2 $, pièces de 50 cents et de 1 $ rares en pratique.

Sources : <https://en.wikipedia.org/wiki/Federal_Reserve_Note>, <https://www.uscurrency.gov/denominations>, <https://en.wikipedia.org/wiki/Coins_of_the_United_States_dollar>.

### VND : dông vietnamien

Les pièces (200 à 5000 ₫) ont toujours cours légal mais ont disparu de l'usage depuis 2011 : liste vide. Billets en coton de 100, 200 et 500 ₫ valables mais inusités (exclus) ; ceux de 1000, 2000 et 5000 ₫ ne sont plus produits mais restent courants. Couleur du 500 000 ₫ : « lavande foncée » selon la SBV, cyan selon Wikipédia.

Sources : <https://sbv.gov.vn/en/w/sbv615814>, <https://en.wikipedia.org/wiki/Vietnamese_%C4%91%E1%BB%93ng>.

### XAF : franc CFA d'Afrique centrale

Billets de la « gamme 2020 » (en circulation depuis le 15/12/2022) : formats non vérifiés dans une source lisible, omis. Nouvelle série de pièces « type 2024 » depuis avril 2025, qui circule avec la série 2006 : métaux et diamètres indiqués = série 2006, sauf la nouvelle 200 F (27 mm d'après un marchand numismatique ; disposition des métaux non vérifiée). Dans la série 2024, 50 et 100 F seraient polygonales et la 500 F trimétallique (presse, non vérifié).

Sources : <https://en.wikipedia.org/wiki/Central_African_CFA_franc>, <https://www.cameroon-tribune.cm/article.html/52971/fr.html/monnaie-les-nouveaux-billets-devoiles>, <https://www.financialafrik.com/2025/04/03/la-beac-met-en-circulation-une-nouvelle-serie-de-pieces-de-monnaie-type-2024/>.

### XOF : franc CFA d'Afrique de l'Ouest

Format du billet de 500 F (en circulation depuis 2012) non trouvé dans une source lisible ; sa couleur (orangée) vient d'au-senegal.com. La pièce de 1 F est rare ; la pièce de 250 F (bimétallique, disposition non relevée) est exclue.

Sources : <https://www.bceao.int/fr/content/pieces-en-circulation>, <http://www.aacb.org/fr/book/export/html/198>, <https://en.wikipedia.org/wiki/West_African_CFA_franc>.

### XPF : franc Pacifique (franc CFP)

Gamme de pièces renouvelée en 2021 (1 et 2 F supprimées, 200 F bicolore créée) ; les anciennes pièces ne sont plus acceptées par les commerces depuis le 01/12/2022 (échange à l'IEOM).

Sources : <https://en.wikipedia.org/wiki/CFP_franc>, <https://www.ieom.fr/Les-pieces-et-billets-en-circulation>, <https://numismag.com/fr/2021/04/03/la-nouvelle-gamme-de-pieces-en-francs-pacifique-2021-ieom-institut-d-emission-d-outre-mer-2/>.

### ZAR : rand sud-africain

Série de billets 2023 : le 50 R passe du rouge au violet ; les séries antérieures (50 R rouge) restent valables. Disposition de la 5 R (couronne argentée, cœur doré) d'après la FAQ de la SARB citée en recherche, non relue directement. Pièces de 1, 2 et 5 cents plus émises (exclues).

Sources : <https://en.wikipedia.org/wiki/South_African_rand>, <https://en.wikipedia.org/wiki/Coins_of_the_South_African_rand>, <https://www.gov.za/news/media-statements/reserve-bank-highlights-country%E2%80%99s-fourth-decimal-coin-series-september-12-sep>.

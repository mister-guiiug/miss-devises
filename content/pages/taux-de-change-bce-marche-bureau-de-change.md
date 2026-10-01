---
title: Taux de change de la BCE, taux de marché et bureau de change
description: Taux de référence de la BCE, taux de marché, taux du bureau de change ou de la carte : d'où vient chaque chiffre, et comment mesurer ce que coûte le change.
date: 2026-10-01
answer: La BCE publie chaque jour ouvré, vers 16 h, heure d'Europe centrale, un taux de référence pour 29 devises, à titre d'information. Pour les autres, comme la livre égyptienne, Miss Devises lit un taux de marché. Un bureau de change ou une banque applique son propre taux et ses frais : l'écart avec ces taux est le prix du change.
---

# Taux de change de la BCE, taux de marché et bureau de change

Trois chiffres circulent pour une même devise : le taux de référence de la Banque centrale européenne, un taux de marché, et le taux qu'on vous applique au guichet ou sur votre relevé de carte. Les deux premiers servent à comparer ; le troisième est un prix, et c'est la différence avec les deux autres qui dit combien coûte le change.

## Le taux de référence de la BCE

La Banque centrale européenne publie ses taux de change de référence de l'euro chaque jour ouvré, vers 16 h, heure d'Europe centrale, sauf les jours de fermeture du système TARGET. Ils résultent d'une concertation quotidienne entre banques centrales européennes, vers 14 h 10. Au 1er octobre 2026, ils couvrent 29 devises, dont le dollar américain, le yen, la livre sterling, le franc suisse, le zloty, la couronne tchèque, le baht thaïlandais et le rand sud-africain.

La BCE les publie à titre d'information et déconseille fortement de s'en servir pour des transactions. C'est pourtant la référence commune : un taux que personne ne vend, donc un étalon neutre. Miss Devises le lit par Frankfurter, un service libre qui republie ces taux.

## Le taux de marché

La livre égyptienne, le dirham marocain ou le dinar tunisien n'ont pas de taux de référence de la BCE. Pour ces devises, Miss Devises lit currency-api, un projet libre de fawazahmed0, sous licence CC0, qui publie chaque jour les taux de plus de 200 devises, cryptomonnaies et métaux compris. Le projet ne dit pas d'où viennent ses chiffres : ils donnent un ordre de grandeur, pas un prix garanti.

Une devise garde la même source pour le taux du jour et pour son historique. Sinon, comparer le taux d'aujourd'hui à celui d'il y a un an mélangerait deux mesures différentes.

## Le taux du bureau de change, de la banque et du terminal

Un bureau de change achète et vend chaque devise à ses propres taux, avec un écart entre les deux, et parfois une commission en plus. Une banque qui convertit un paiement par carte applique le taux de son réseau, et souvent des frais.

Dans l'Union européenne, pour un paiement par carte dans une devise d'un État membre autre que l'euro, comme la couronne tchèque ou le zloty, le règlement (UE) 2019/518 encadre ces frais. Son article 3 bis demande à la banque, et à celui qui propose la conversion à un distributeur ou à un terminal de paiement, d'exprimer le total des frais de conversion en pourcentage au-dessus du dernier taux de référence de la BCE, et de le communiquer avant le paiement. Cette règle s'applique depuis le 19 avril 2020. Depuis le 19 avril 2021, la banque envoie aussi un message électronique avec ces informations après un retrait ou un paiement dans une autre devise de l'Union.

Ce règlement ne vise que les devises de l'Union. Pour un paiement en livres égyptiennes, en dirhams ou en bahts, rien n'oblige à afficher la marge : la comparaison est à faire vous-même.

Quand un terminal propose de payer en euros plutôt qu'en devise locale, c'est le commerçant ou son prestataire qui fixe le taux de conversion. Comparer le montant en euros annoncé à votre propre conversion avant d'accepter, c'est voir sa marge.

## Comparer en pratique

Un billet de musée coûte 200 livres égyptiennes. Avec un taux d'exemple de 58,83 livres pour un euro, il vaut 3,40 €. Si le bureau de change vous donne 55 livres pour un euro, ces mêmes 200 livres vous coûtent 3,64 € : l'écart de 0,24 €, soit environ 7 %, est le prix du change.

Le même calcul vaut pour un relevé de carte : divisez le montant payé dans la devise par le montant débité en euros, et comparez ce taux à celui du jour du paiement.

## Dans Miss Devises

Chaque taux s'affiche avec sa source, BCE ou marché, et sa date. Au-delà de trois jours, l'application le signale ; hors ligne, elle garde les derniers taux connus. Les taux restent indicatifs : ils ne comprennent ni la marge d'un bureau de change ni les frais d'une banque.

## Sources

- Banque centrale européenne, [taux de change de référence de l'euro](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html).
- [Règlement (UE) 2019/518](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32019R0518) du 19 mars 2019, articles 1er et 3 bis.
- [currency-api](https://github.com/fawazahmed0/exchange-api), de fawazahmed0.

# Contrat : les sources de taux

Ce que l'application attend de chaque source. Toute réponse passe par un schéma
zod avant usage : une réponse qui ne s'y conforme pas est traitée comme une
source indisponible (repli, puis dernier taux connu), jamais lue de travers.

## Frankfurter (BCE)

### Dernier taux

`GET https://api.frankfurter.dev/v1/latest?base=EUR`

```json
{ "amount": 1, "base": "EUR", "date": "2026-10-01", "rates": { "USD": 1.0812 } }
```

Schéma : `base` vaut `"EUR"`, `date` au format `AAAA-MM-JJ`, `rates` une table
de codes de 3 majuscules vers des nombres finis strictement positifs.

### Série

`GET https://api.frankfurter.dev/v1/<début>..<fin>?base=EUR&symbols=<CODE>`

```json
{
  "amount": 1,
  "base": "EUR",
  "start_date": "2025-10-01",
  "end_date": "2026-09-30",
  "rates": { "2025-10-01": { "USD": 1.17 } }
}
```

Une date sans la devise demandée est ignorée ; une série vide est une série
indisponible.

### Devises couvertes

L'ensemble des clés de `rates` du dernier taux. Une devise qui y figure passe
par cette source, et par elle seule.

## fawazahmed0/currency-api (marché)

`GET https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@<latest|AAAA-MM-JJ>/v1/currencies/eur.json`

repli : `GET https://<latest|AAAA-MM-JJ>.currency-api.pages.dev/v1/currencies/eur.json`

```json
{ "date": "2026-10-01", "eur": { "egp": 58.83286362, "usd": 1.0812 } }
```

Schéma : `date` au format `AAAA-MM-JJ`, `eur` une table de codes en minuscules
vers des nombres. Les codes sont mis en majuscules ; seuls ceux de R9 (ISO 4217
nommés par `Intl`, sans métaux ni fonds) sont retenus ; une valeur non finie ou
non positive est écartée.

## Délais et repli

- Chaque requête abandonne après 8 s.
- Marché : CDN jsDelivr d'abord, Cloudflare Pages ensuite.
- Échec des deux : le dernier instantané gardé, avec sa date et l'état
  `ancien` ou `absent`.

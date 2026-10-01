# Contrat : les ports de l'application

Les écrans ne parlent qu'à ces interfaces. Les implémentations se remplacent
sans toucher aux écrans, et chacune se teste seule.

## Taux

```ts
type Source = 'bce' | 'marche';
type Periode = '1M' | '6M' | '1A';

interface TauxDuJour {
  code: string; // devise étrangère
  taux: number; // unités de la devise pour un euro
  source: Source;
  date: string; // AAAA-MM-JJ
  fraicheur: 'frais' | 'ancien';
}

interface ServiceDeTaux {
  /** Le dernier taux connu, sans réseau ; `undefined` s'il n'y en a aucun. */
  dernier(code: string): TauxDuJour | undefined;
  /** Relit les deux sources ; ne lève jamais, rend ce qui a pu être lu. */
  rafraichir(): Promise<{ bce: boolean; marche: boolean }>;
  /** La série d'une devise sur une période, depuis le cache ou le réseau. */
  serie(
    code: string,
    periode: Periode,
    signal?: AbortSignal
  ): Promise<{ date: string; taux: number }[]>;
  /** Les devises convertibles (R9), triées par nom dans la langue donnée. */
  devises(langue: 'fr' | 'en'): { code: string; nom: string }[];
}
```

## Carnet

Même forme que le port `notes` du squelette : des mutations, pas un
instantané, et tout asynchrone, même en local.

```ts
interface Carnet {
  load(): Promise<{ conversions: ConversionEnregistree[] }>;
  add(conversion: ConversionEnregistree): Promise<void>;
  rename(id: string, libelle: string): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  /** L'état courant en JSON (`{ v, data }`), pour l'export. */
  export(): Promise<string | null>;
  /** Remplace tout par un export valide ; rejette un fichier illisible. */
  import(json: string): Promise<{ conversions: ConversionEnregistree[] }>;
}
```

## Règles pures (`src/domain`)

```ts
function lireMontant(saisie: string, langue: 'fr' | 'en'): number | null;
function decimalesDe(code: string): number;
function convertir(
  montant: number,
  taux: number,
  sens: 'versDevise' | 'versEuro'
): number;
function decomposer(
  montant: number,
  coupures: number[],
  decimales: number
): { parCoupure: { valeur: number; nombre: number }[]; reste: number };
function statistiques(points: { date: string; taux: number }[]): {
  plusHaut: number;
  plusBas: number;
  variation: number; // proportion, du premier au dernier point
} | null;
```

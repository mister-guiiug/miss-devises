/**
 * LE DRAPEAU D'UNE DEVISE (spécification 002, récit 2, recherche R4).
 *
 * ISO 4217 prend les deux premières lettres d'un code de devise à ISO 3166 :
 * EGP est la livre d'Égypte (EG), CHF le franc de Suisse (CH). Trois règles
 * complètent celle-là :
 *
 * - l'euro montre le drapeau européen ;
 * - un code en X n'appartient à aucun pays (franc CFA, franc CFP, dollar des
 *   Caraïbes orientales, florin caribéen) : signe neutre. LE PIÈGE EST RÉEL :
 *   la bibliothèque des drapeaux a des fichiers XA, XO et XC, codes
 *   « attribués par l'utilisateur » qu'elle donne à l'Abkhazie, à l'Ossétie du
 *   Sud et à Chypre du Nord. La règle des deux lettres aurait donné au franc
 *   CFA d'Afrique centrale le drapeau de l'Abkhazie ;
 * - le florin antillais (ANG) est celui d'un pays dissous (AN) : neutre.
 */
export function paysDe(code: string): string | undefined {
  if (code === 'EUR') return 'EU';
  if (code.startsWith('X') || SANS_PAYS.has(code)) return undefined;
  return code.slice(0, 2);
}

const SANS_PAYS = new Set(['ANG']);

/**
 * Les drapeaux livrés, un fichier par pays : ceux des devises que les deux
 * sources publient et qu'`Intl` sait nommer, anciennes monnaies de l'euro
 * comprises (le franc, le mark : la source de marché les cote encore). Un
 * test vérifie que la liste les couvre toutes, et rien de plus.
 *
 * `?url&no-inline` : chaque drapeau reste un FICHIER, émis par Vite et
 * précaché par le service worker. Sans `no-inline`, Vite mettrait ces
 * fichiers de moins de 4 ko en base64 dans le JavaScript : 25 ko gzip, plus
 * que toute la marge du budget de poids.
 */
const FICHIERS = import.meta.glob<string>(
  '/node_modules/country-flag-icons/3x2/{AE,AF,AL,AM,AO,AR,AT,AU,AW,AZ,BA,BB,BD,BE,BG,BH,BI,BM,BN,BO,BR,BS,BT,BW,BY,BZ,CA,CD,CH,CL,CN,CO,CR,CU,CV,CY,CZ,DE,DJ,DK,DO,DZ,EE,EG,ER,ES,ET,EU,FI,FJ,FK,FR,GB,GE,GH,GI,GM,GN,GR,GT,GY,HK,HN,HR,HT,HU,ID,IE,IL,IN,IQ,IR,IS,IT,JM,JO,JP,KE,KG,KH,KM,KP,KR,KW,KY,KZ,LA,LB,LK,LR,LS,LT,LU,LV,LY,MA,MD,MG,MK,MM,MN,MO,MR,MT,MU,MV,MW,MX,MY,MZ,NA,NG,NI,NL,NO,NP,NZ,OM,PA,PE,PG,PH,PK,PL,PT,PY,QA,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SK,SL,SO,SR,SS,ST,SV,SY,SZ,TH,TJ,TM,TN,TO,TR,TT,TW,TZ,UA,UG,US,UY,UZ,VE,VN,VU,WS,YE,ZA,ZM,ZW}.svg',
  { query: '?url&no-inline', import: 'default', eager: true }
);

const PAR_PAYS = new Map(
  Object.entries(FICHIERS).map(([chemin, url]) => [chemin.slice(-6, -4), url])
);

/** Les pays dont un drapeau est livré. */
export const PAYS_LIVRES: ReadonlySet<string> = new Set(PAR_PAYS.keys());

/** L'adresse du drapeau d'une devise, ou rien : signe neutre. */
export function drapeauDe(code: string): string | undefined {
  const pays = paysDe(code);
  return pays === undefined ? undefined : PAR_PAYS.get(pays);
}

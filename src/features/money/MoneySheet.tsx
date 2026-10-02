import { useEffect, useId, useState, type ReactNode } from 'react';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { Sheet } from '@mister-guiiug/dev-pwa-config/react/sheet';
import { SegmentedControl } from '@mister-guiiug/dev-pwa-config/react/segmented-control';
import { useI18n } from '../../i18n/index.ts';
import { usePreferences } from '../../app/preferences.ts';
import {
  chargerCoupures,
  type Billet,
  type Coupures,
  type DeviseCoupures,
  type Piece,
} from '../../data/coupures.ts';
import { convertir } from '../../domain/convert.ts';
import { decomposer, sommer } from '../../domain/decompose.ts';
import {
  arrondir,
  decimalesDe,
  formaterCoupure,
  formaterDate,
  formaterMontant,
  formaterValeur,
  nommerMontant,
} from '../../domain/money.ts';
import { useConversion } from '../convert/conversion.ts';
import { Drapeau } from '../../ui/Drapeau.tsx';
import { Banknote } from './Banknote.tsx';
import { Coin } from './Coin.tsx';

interface Props {
  open: boolean;
  onClose: () => void;
  /** La devise étrangère de l'écran Convertir. */
  devise: string;
  /** La monnaie de référence : l'euro par défaut (spécification 002). */
  reference: string;
  /** Unités de la devise pour une unité de la référence ; sans lui, pas de contre-valeur. */
  taux: number | undefined;
  montantDevise: number | null;
  montantReference: number | null;
}

/** Largeur du plus grand billet d'une devise, et diamètre de la plus grande pièce. */
const LARGEUR_BILLET = 136;
const DIAMETRE_PIECE = 56;

/**
 * Le volet des billets et des pièces (récit 2) : chaque coupure dessinée, du
 * plus petit au plus grand, avec sa contre-valeur ; la bascule vers les
 * coupures de la référence ; la composition du montant saisi (EF-005,
 * EF-007).
 */
export function MoneySheet({
  open,
  onClose,
  devise,
  reference,
  taux,
  montantDevise,
  montantReference,
}: Props) {
  const { t, locale } = useI18n();
  const saisir = useConversion(s => s.saisir);
  const sens = usePreferences(s => s.sensVolet);
  const basculer = usePreferences(s => s.basculerVolet);
  const [coupures, setCoupures] = useState<Coupures>();
  const [echec, setEchec] = useState(false);

  useEffect(() => {
    if (!open || coupures) return undefined;
    let actif = true;
    chargerCoupures()
      .then(lues => {
        if (actif) setCoupures(lues);
      })
      .catch(() => {
        if (actif) setEchec(true);
      });
    return () => {
      actif = false;
    };
  }, [open, coupures]);

  const code = sens === 'devise' ? devise : reference;
  const systeme = coupures?.devises[code];

  let contenu: ReactNode;
  if (!coupures) {
    contenu = (
      <p role="status" className="m-0 text-sm">
        {echec ? t('money.inconnues') : t('money.chargement')}
      </p>
    );
  } else if (!systeme) {
    contenu = <p className="m-0 text-sm">{t('money.inconnues')}</p>;
  } else {
    // `key` : basculer de devise repart d'une composition vide.
    contenu = (
      <Contenu
        key={code}
        code={code}
        autre={sens === 'devise' ? reference : devise}
        systeme={systeme}
        taux={taux}
        versReference={sens === 'devise'}
        montant={sens === 'devise' ? montantDevise : montantReference}
        releveLe={coupures.releveLe}
        onUtiliser={total => {
          // Le total devient la saisie de Convertir, dans son champ : sans
          // séparateur de milliers, aux décimales de la devise.
          saisir(
            sens,
            formatNumber(total, locale, {
              maximumFractionDigits: decimalesDe(code),
              useGrouping: false,
            })
          );
          onClose();
        }}
      />
    );
  }

  return (
    <Sheet open={open} title={t('money.title')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <SegmentedControl
          value={sens}
          onChange={valeur => {
            if (valeur !== sens) basculer();
          }}
          options={[
            {
              value: 'devise',
              label: (
                <Segment code={devise}>
                  {t('money.voirDevise', { code: devise })}
                </Segment>
              ),
            },
            {
              value: 'reference',
              label: (
                <Segment code={reference}>
                  {t('money.voirDevise', { code: reference })}
                </Segment>
              ),
            },
          ]}
          ariaLabel={t('money.sens')}
          fullWidth
        />
        {contenu}
      </div>
    </Sheet>
  );
}

/** Un côté de la bascule : le drapeau de la devise, puis son libellé. */
function Segment({ code, children }: { code: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Drapeau code={code} hauteur={12} />
      {children}
    </span>
  );
}

interface PropsContenu {
  /** La devise dont on montre les coupures. */
  code: string;
  /** Celle de la contre-valeur. */
  autre: string;
  systeme: DeviseCoupures;
  taux: number | undefined;
  /** `true` : les coupures de la devise, valant leur montant en référence. */
  versReference: boolean;
  montant: number | null;
  releveLe: string;
  /** « Utiliser ce montant » : le total composé au toucher (récit 5). */
  onUtiliser: (total: number) => void;
}

function Contenu({
  code,
  autre,
  systeme,
  taux,
  versReference,
  montant,
  releveLe,
  onUtiliser,
}: PropsContenu) {
  const { t, m, fmt, locale } = useI18n();
  // Combien de chaque coupure on a touchée : clé `billet-100`, `piece-0.5`.
  const [compte, setCompte] = useState<Record<string, number>>({});
  const idBillets = useId();
  const idPieces = useId();
  const idComposition = useId();

  /**
   * La contre-valeur d'une coupure, telle qu'on la lit. Arrondie à zéro, elle
   * ne dirait rien (« 0,00 € » pour 25 piastres) : « moins de 0,01 € ».
   */
  const contre = (valeur: number) => {
    if (taux === undefined) return undefined;
    const montantAutre = convertir(
      valeur,
      taux,
      versReference ? 'versReference' : 'versDevise'
    );
    const decimales = decimalesDe(autre);
    if (arrondir(montantAutre, decimales) === 0) {
      const plusPetit = formaterMontant(10 ** -decimales, autre, locale);
      return { lu: t('money.moinsDe', { montant: plusPetit }), vu: '' };
    }
    const lu = formaterMontant(montantAutre, autre, locale);
    return { lu, vu: t('money.contre', { montant: lu }) };
  };

  const libelle = (genre: 'billet' | 'piece', valeur: number) => {
    const nom = nommerMontant(valeur, code, locale);
    const c = contre(valeur);
    if (!c) {
      return t(genre === 'billet' ? 'money.billetSeul' : 'money.pieceSeule', {
        valeur: nom,
      });
    }
    return t(genre === 'billet' ? 'money.billet' : 'money.piece', {
      valeur: nom,
      contre: c.lu,
    });
  };

  const legende = (valeur: number) => {
    const c = contre(valeur);
    return (
      <span aria-hidden="true" className="flex flex-col items-center text-xs">
        <span className="font-semibold">
          {formaterCoupure(valeur, code, locale)}
        </span>
        {c && (
          <span style={{ color: 'var(--dwc-text-soft)' }}>{c.vu || c.lu}</span>
        )}
      </span>
    );
  };

  const largeurMax = Math.max(0, ...systeme.billets.map(b => b.largeurMm ?? 0));
  const diametreMax = Math.max(
    0,
    ...systeme.pieces.map(p => p.diametreMm ?? 0)
  );
  const largeurDe = (b: Billet, base = LARGEUR_BILLET) =>
    b.largeurMm && largeurMax ? (base * b.largeurMm) / largeurMax : base * 0.9;
  const diametreDe = (p: Piece, base = DIAMETRE_PIECE) =>
    p.diametreMm && diametreMax
      ? Math.max(base * 0.55, (base * p.diametreMm) / diametreMax)
      : base * 0.8;

  // Les dessins sont muets : le bouton qui les porte, ou le texte de la
  // composition, dit déjà la coupure.
  const billet = (b: Billet, base?: number) => (
    <Banknote
      couleur={b.couleur}
      texte={formaterValeur(b.valeur, code, locale)}
      code={code}
      largeurMm={b.largeurMm}
      hauteurMm={b.hauteurMm}
      largeur={largeurDe(b, base)}
      plusEmis={b.plusEmis}
    />
  );
  const piece = (p: Piece, base?: number) => (
    <Coin
      metal={p.metal}
      texte={formaterValeur(p.valeur, code, locale)}
      diametre={diametreDe(p, base)}
      plusEmis={p.plusEmis}
    />
  );

  const composition =
    montant !== null && montant > 0 ? decomposer(montant, systeme) : undefined;

  // Récit 5 : les coupures touchées, leur total et sa contre-valeur.
  const ajouter = (cle: string) =>
    setCompte(c => ({ ...c, [cle]: (c[cle] ?? 0) + 1 }));
  const retirer = (cle: string) =>
    setCompte(c => {
      const { [cle]: n = 0, ...autres } = c;
      return n > 1 ? { ...autres, [cle]: n - 1 } : autres;
    });
  const touchees = [
    ...systeme.billets.map(b => ({ cle: `billet-${b.valeur}`, b })),
    ...systeme.pieces.map(p => ({ cle: `piece-${p.valeur}`, b: p })),
  ].flatMap(({ cle, b }) =>
    compte[cle] ? [{ valeur: b.valeur, nombre: compte[cle] }] : []
  );
  const total = sommer(touchees, systeme.decimales);
  const contreTotal = contre(total);

  /**
   * Une coupure qu'on touche pour l'ajouter. Le bouton porte le nom complet,
   * compteur compris : le dessin et la légende, à l'intérieur, sont muets.
   */
  const touche = (
    cle: string,
    genre: 'billet' | 'piece',
    valeur: number,
    dessin: ReactNode,
    plusEmis = false
  ) => {
    const n = compte[cle] ?? 0;
    const nom = [
      libelle(genre, valeur),
      plusEmis ? t('money.plusEmis') : '',
      n > 0 ? fmt.plural(n, m.money.compte, { count: n }) : '',
    ]
      .filter(Boolean)
      .join(', ');
    return (
      <li key={cle} className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => ajouter(cle)}
          aria-label={nom}
          className="relative flex flex-col items-center gap-1 rounded-lg p-1"
        >
          {dessin}
          {legende(valeur)}
          {plusEmis && (
            <span
              aria-hidden="true"
              className="text-xs italic"
              style={{ color: 'var(--dwc-text-soft)' }}
            >
              {t('money.plusEmis')}
            </span>
          )}
          {n > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 min-w-6 rounded-full px-1.5 text-xs font-bold"
              style={{
                background: 'var(--dwc-primary)',
                color: 'var(--dwc-primary-contrast, #fff)',
              }}
            >
              ×{n}
            </span>
          )}
        </button>
        {n > 0 && (
          <button
            type="button"
            onClick={() => retirer(cle)}
            aria-label={t('money.retirer', {
              valeur: formaterCoupure(valeur, code, locale),
            })}
            className="flex size-8 items-center justify-center rounded-full border text-base"
            style={{ borderColor: 'var(--dwc-border-strong)' }}
          >
            −
          </button>
        )}
      </li>
    );
  };

  return (
    <>
      {composition && montant !== null && (
        <section
          aria-labelledby={idComposition}
          className="flex flex-col gap-2"
        >
          <h3 id={idComposition} className="m-0 text-base font-semibold">
            {t('money.composition', {
              montant: formaterMontant(montant, code, locale),
            })}
          </h3>
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
            {composition.lignes.map(ligne => {
              const b = systeme.billets.find(x => x.valeur === ligne.valeur);
              const p = systeme.pieces.find(x => x.valeur === ligne.valeur);
              return (
                <li
                  key={`${ligne.type}-${ligne.valeur}`}
                  className="flex items-center gap-2 text-sm"
                >
                  {ligne.type === 'piece' && p
                    ? piece(p, 32)
                    : b && billet(b, 56)}
                  {t('money.ajoute', {
                    nombre: ligne.nombre,
                    valeur: formaterCoupure(ligne.valeur, code, locale),
                  })}
                </li>
              );
            })}
          </ul>
          {composition.reste > 0 && (
            <p className="m-0 text-sm">
              {t('money.reste', {
                montant: formaterMontant(composition.reste, code, locale),
              })}
            </p>
          )}
        </section>
      )}

      <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
        {t('money.toucher')}
      </p>

      {systeme.billets.length > 0 && (
        <section aria-labelledby={idBillets} className="flex flex-col gap-2">
          <h3 id={idBillets} className="m-0 text-base font-semibold">
            {t('money.billets')}
          </h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0">
            {systeme.billets.map(b =>
              touche(
                `billet-${b.valeur}`,
                'billet',
                b.valeur,
                billet(b),
                b.plusEmis
              )
            )}
          </ul>
        </section>
      )}

      {systeme.pieces.length > 0 && (
        <section aria-labelledby={idPieces} className="flex flex-col gap-2">
          <h3 id={idPieces} className="m-0 text-base font-semibold">
            {t('money.pieces')}
          </h3>
          <ul className="m-0 grid list-none grid-cols-3 items-end gap-3 p-0">
            {systeme.pieces.map(p =>
              touche(
                `piece-${p.valeur}`,
                'piece',
                p.valeur,
                piece(p),
                p.plusEmis
              )
            )}
          </ul>
        </section>
      )}

      {/* La région vit toujours : un lecteur d'écran annonce le total dès la
          première coupure touchée, pas seulement à la deuxième. */}
      <div
        role="status"
        className="sticky bottom-0 flex flex-col gap-2 empty:hidden"
        style={{ background: 'var(--dwc-surface)' }}
      >
        {total > 0 && (
          <>
            <p data-testid="total-compose" className="m-0 pt-2 font-semibold">
              {contreTotal
                ? t('money.total', {
                    montant: formaterMontant(total, code, locale),
                    contre: contreTotal.lu,
                  })
                : t('money.totalSeul', {
                    montant: formaterMontant(total, code, locale),
                  })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onUtiliser(total)}>
                {t('money.utiliser')}
              </Button>
              <Button variant="ghost" onClick={() => setCompte({})}>
                {t('money.remettre')}
              </Button>
            </div>
          </>
        )}
      </div>

      <footer
        className="flex flex-col gap-1 text-xs"
        style={{ color: 'var(--dwc-text-soft)' }}
      >
        <p className="m-0">
          {t('money.source', { date: formaterDate(releveLe, locale) })}
        </p>
        <p className="m-0 flex flex-wrap gap-x-2">
          <span>{t('money.sources')} :</span>
          {systeme.sources.map(source => (
            <a key={source} href={source} target="_blank" rel="noreferrer">
              {new URL(source).hostname}
            </a>
          ))}
        </p>
      </footer>
    </>
  );
}

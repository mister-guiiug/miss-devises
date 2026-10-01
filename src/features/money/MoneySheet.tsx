import { useEffect, useId, useState, type ReactNode } from 'react';
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
import { decomposer } from '../../domain/decompose.ts';
import {
  arrondir,
  decimalesDe,
  formaterCoupure,
  formaterDate,
  formaterMontant,
  formaterValeur,
  nommerMontant,
} from '../../domain/money.ts';
import { Banknote } from './Banknote.tsx';
import { Coin } from './Coin.tsx';

interface Props {
  open: boolean;
  onClose: () => void;
  /** La devise étrangère de l'écran Convertir. */
  devise: string;
  /** Unités de la devise pour un euro ; sans lui, pas de contre-valeur. */
  taux: number | undefined;
  montantDevise: number | null;
  montantEuro: number | null;
}

/** Largeur du plus grand billet d'une devise, et diamètre de la plus grande pièce. */
const LARGEUR_BILLET = 136;
const DIAMETRE_PIECE = 56;

/**
 * Le volet des billets et des pièces (récit 2) : chaque coupure dessinée, du
 * plus petit au plus grand, avec sa contre-valeur ; la bascule vers les
 * coupures de l'euro ; la composition du montant saisi (EF-005, EF-007).
 */
export function MoneySheet({
  open,
  onClose,
  devise,
  taux,
  montantDevise,
  montantEuro,
}: Props) {
  const { t } = useI18n();
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

  const code = sens === 'devise' ? devise : 'EUR';
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
    contenu = (
      <Contenu
        code={code}
        autre={sens === 'devise' ? 'EUR' : devise}
        systeme={systeme}
        taux={taux}
        versEuro={sens === 'devise'}
        montant={sens === 'devise' ? montantDevise : montantEuro}
        releveLe={coupures.releveLe}
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
            { value: 'devise', label: t('money.voirDevise', { code: devise }) },
            { value: 'euro', label: t('money.voirEuro') },
          ]}
          ariaLabel={t('money.sens')}
          fullWidth
        />
        {contenu}
      </div>
    </Sheet>
  );
}

interface PropsContenu {
  /** La devise dont on montre les coupures. */
  code: string;
  /** Celle de la contre-valeur. */
  autre: string;
  systeme: DeviseCoupures;
  taux: number | undefined;
  /** `true` : les coupures de la devise, valant des euros. */
  versEuro: boolean;
  montant: number | null;
  releveLe: string;
}

function Contenu({
  code,
  autre,
  systeme,
  taux,
  versEuro,
  montant,
  releveLe,
}: PropsContenu) {
  const { t, locale } = useI18n();
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
      versEuro ? 'versEuro' : 'versDevise'
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

  const billet = (b: Billet, base?: number, avecLibelle = true) => (
    <Banknote
      couleur={b.couleur}
      texte={formaterValeur(b.valeur, code, locale)}
      code={code}
      largeurMm={b.largeurMm}
      hauteurMm={b.hauteurMm}
      largeur={largeurDe(b, base)}
      libelle={
        avecLibelle
          ? b.plusEmis
            ? `${libelle('billet', b.valeur)}, ${t('money.plusEmis')}`
            : libelle('billet', b.valeur)
          : undefined
      }
      plusEmis={b.plusEmis}
    />
  );
  const piece = (p: Piece, base?: number, avecLibelle = true) => (
    <Coin
      metal={p.metal}
      texte={formaterValeur(p.valeur, code, locale)}
      diametre={diametreDe(p, base)}
      libelle={avecLibelle ? libelle('piece', p.valeur) : undefined}
      plusEmis={p.plusEmis}
    />
  );

  const composition =
    montant !== null && montant > 0 ? decomposer(montant, systeme) : undefined;

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
                    ? piece(p, 32, false)
                    : b && billet(b, 56, false)}
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

      {systeme.billets.length > 0 && (
        <section aria-labelledby={idBillets} className="flex flex-col gap-2">
          <h3 id={idBillets} className="m-0 text-base font-semibold">
            {t('money.billets')}
          </h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0">
            {systeme.billets.map(b => (
              <li key={b.valeur} className="flex flex-col items-center gap-1">
                {billet(b)}
                {legende(b.valeur)}
                {b.plusEmis && (
                  <span
                    aria-hidden="true"
                    className="text-xs italic"
                    style={{ color: 'var(--dwc-text-soft)' }}
                  >
                    {t('money.plusEmis')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {systeme.pieces.length > 0 && (
        <section aria-labelledby={idPieces} className="flex flex-col gap-2">
          <h3 id={idPieces} className="m-0 text-base font-semibold">
            {t('money.pieces')}
          </h3>
          <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0">
            {systeme.pieces.map(p => (
              <li
                key={p.valeur}
                className="flex flex-col items-center justify-end gap-1"
              >
                {piece(p)}
                {legende(p.valeur)}
              </li>
            ))}
          </ul>
        </section>
      )}

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

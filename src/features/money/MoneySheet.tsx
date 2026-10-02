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
import {
  chargerPhotos,
  pageCommons,
  type DevisePhotos,
  type Photo,
  type Photos,
} from '../../data/photos.ts';
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
import { PhotoCoupure } from './PhotoCoupure.tsx';

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

/**
 * Largeur du plus grand billet d'une devise, et diamètre de la plus grande
 * pièce, en pixels CSS. Ce sont aussi les tailles maximales d'une photo : la
 * Banque d'Israël veut ses pièces montrées à 70 % de leur taille réelle au
 * plus, et un test le vérifie pour chaque pièce photographiée.
 */
export const LARGEUR_BILLET = 136;
export const DIAMETRE_PIECE = 56;

/**
 * Le volet des billets et des pièces (récit 2) : chaque coupure dessinée, du
 * plus petit au plus grand, avec sa contre-valeur ; la bascule vers les
 * coupures de la référence ; la composition du montant saisi (EF-005,
 * EF-007). À la demande, des photos libres de Wikimedia Commons remplacent
 * les dessins (spécification 002, récit 3) : jamais avant que l'utilisateur
 * les ait choisies, et après lui avoir dit ce que Wikimedia voit.
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
  const images = usePreferences(s => s.images);
  const avisLu = usePreferences(s => s.avisPhotos);
  const choisirImages = usePreferences(s => s.choisirImages);
  const accepterPhotos = usePreferences(s => s.accepterPhotos);
  const [coupures, setCoupures] = useState<Coupures>();
  const [echec, setEchec] = useState(false);
  const [photos, setPhotos] = useState<Photos>();
  const [avis, setAvis] = useState(false);
  const modePhotos = images === 'photos';

  // Le jeu des photos ne se charge qu'en mode photos : un morceau à part,
  // servi par l'application. Les vignettes, elles, partent de Commons.
  useEffect(() => {
    if (!open || !modePhotos || photos) return undefined;
    let actif = true;
    chargerPhotos()
      .then(lues => {
        if (actif) setPhotos(lues);
      })
      .catch(() => {
        // Sans jeu de photos, les dessins restent : rien à dire de plus.
      });
    return () => {
      actif = false;
    };
  }, [open, modePhotos, photos]);

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
        modePhotos={modePhotos}
        photos={photos?.devises[code]}
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
        <SegmentedControl
          size="sm"
          value={avis ? 'photos' : images}
          onChange={valeur => {
            if (valeur === 'photos' && !avisLu) setAvis(true);
            else {
              setAvis(false);
              choisirImages(valeur === 'photos' ? 'photos' : 'dessins');
            }
          }}
          options={[
            { value: 'dessins', label: t('money.dessins') },
            { value: 'photos', label: t('money.photos') },
          ]}
          ariaLabel={t('money.images')}
        />
        {avis && (
          <AvisPhotos
            onAccepter={() => {
              accepterPhotos();
              setAvis(false);
            }}
            onRefuser={() => setAvis(false)}
          />
        )}
        {contenu}
      </div>
    </Sheet>
  );
}

/**
 * L'avis avant la première photo (EF-010) : ce qui part chez Wikimedia, dit
 * une fois, avant toute requête. Une région du volet, pas une boîte modale.
 */
function AvisPhotos({
  onAccepter,
  onRefuser,
}: {
  onAccepter: () => void;
  onRefuser: () => void;
}) {
  const { t } = useI18n();
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-2 rounded-xl border p-3 text-sm"
      style={{
        borderColor: 'var(--dwc-border)',
        background: 'var(--dwc-surface-2)',
      }}
    >
      <h3 id={id} className="m-0 text-sm font-semibold">
        {t('money.avisTitre')}
      </h3>
      <p className="m-0">{t('money.avis')}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onAccepter}>
          {t('money.avisAfficher')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRefuser}>
          {t('money.avisGarder')}
        </Button>
      </div>
    </section>
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
  /** Les photos sont choisies : celles de `photos` remplacent les dessins. */
  modePhotos: boolean;
  /** Les photos de la devise, si le jeu en a. */
  photos: DevisePhotos | undefined;
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
  modePhotos,
  photos,
  onUtiliser,
}: PropsContenu) {
  const { t, m, fmt, locale } = useI18n();
  const photoDe = (genre: 'billet' | 'piece', valeur: number) =>
    modePhotos
      ? (genre === 'billet' ? photos?.billets : photos?.pieces)?.find(
          photo => photo.valeur === valeur
        )
      : undefined;
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

  /** « Billet de 50 € » : la coupure seule, sans sa contre-valeur. */
  const libelleCourt = (genre: 'billet' | 'piece', valeur: number) =>
    t(genre === 'billet' ? 'money.billetSeul' : 'money.pieceSeule', {
      valeur: formaterCoupure(valeur, code, locale),
    });

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
  // composition, dit déjà la coupure. Une photo, quand il y en a une et
  // qu'elle est choisie, prend leur place et leur taille.
  const billet = (b: Billet, base?: number) => {
    const dessin = (
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
    const photo = photoDe('billet', b.valeur);
    return photo ? (
      <PhotoCoupure
        photo={photo}
        forme="billet"
        largeur={largeurDe(b, base)}
        repli={dessin}
      />
    ) : (
      dessin
    );
  };
  const piece = (p: Piece, base?: number) => {
    const dessin = (
      <Coin
        metal={p.metal}
        texte={formaterValeur(p.valeur, code, locale)}
        diametre={diametreDe(p, base)}
        plusEmis={p.plusEmis}
      />
    );
    const photo = photoDe('piece', p.valeur);
    return photo ? (
      <PhotoCoupure
        photo={photo}
        forme="piece"
        largeur={diametreDe(p, base)}
        repli={dessin}
      />
    ) : (
      dessin
    );
  };

  // Les photos montrées, et ce qui reste en dessin (EF-011).
  const coupures = [
    ...systeme.billets.map(b => ({
      genre: 'billet' as const,
      valeur: b.valeur,
    })),
    ...systeme.pieces.map(p => ({ genre: 'piece' as const, valeur: p.valeur })),
  ];
  const montrees = coupures.flatMap(({ genre, valeur }) => {
    const photo = photoDe(genre, valeur);
    return photo ? [{ genre, valeur, photo }] : [];
  });
  const sansPhoto = coupures.length - montrees.length;

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
    const photo = photoDe(genre, valeur);
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
        {photo && (
          <a
            href={pageCommons(photo.fichier)}
            target="_blank"
            rel="noreferrer"
            aria-label={t('money.creditDe', {
              coupure: libelleCourt(genre, valeur),
            })}
            className="text-xs underline"
            style={{ color: 'var(--dwc-text-soft)' }}
          >
            {t('money.credit')}
          </a>
        )}
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

      {modePhotos && (
        <Credits
          montrees={montrees}
          sansPhoto={sansPhoto}
          total={coupures.length}
          libelleCourt={libelleCourt}
        />
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

/**
 * Ce que montre le mode photos (EF-009, EF-011) : combien de coupures
 * gardent leur dessin, et le crédit de chaque photo, à un geste. Chaque
 * coupure a aussi son lien « Crédit » vers sa page Commons.
 *
 * Une ligne par photo : la coupure, le TITRE du fichier (les licences CC 2.0
 * à 3.0 l'exigent), son auteur, sa licence liée à son texte quand elle en a
 * un (les CC veulent le lien, pas seulement le nom), et sa page Commons.
 */
function Credits({
  montrees,
  sansPhoto,
  total,
  libelleCourt,
}: {
  montrees: { genre: 'billet' | 'piece'; valeur: number; photo: Photo }[];
  sansPhoto: number;
  total: number;
  libelleCourt: (genre: 'billet' | 'piece', valeur: number) => string;
}) {
  const { t, m, fmt } = useI18n();
  return (
    <div className="flex flex-col gap-2 text-sm">
      {montrees.length === 0 ? (
        <p className="m-0">{t('money.aucunePhoto')}</p>
      ) : (
        sansPhoto > 0 && (
          <p className="m-0">
            {fmt.plural(sansPhoto, m.money.sansPhoto, {
              count: sansPhoto,
              total,
            })}
          </p>
        )
      )}
      {montrees.length > 0 && (
        <details>
          <summary className="cursor-pointer font-semibold">
            {t('money.credits')}
          </summary>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-xs">
            {montrees.map(({ genre, valeur, photo }) => (
              <li key={`${genre}-${valeur}`}>
                {libelleCourt(genre, valeur)}
                {' : « '}
                {photo.fichier}
                {' », '}
                {photo.auteur}
                {' · '}
                {photo.licenceUrl ? (
                  <a
                    href={photo.licenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {photo.licence}
                  </a>
                ) : (
                  photo.licence
                )}
                {' · '}
                <a
                  href={pageCommons(photo.fichier)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Wikimedia Commons
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

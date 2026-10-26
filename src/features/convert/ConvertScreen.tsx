import { lazy, Suspense, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Banknote as IconeBillets,
  Calculator,
  Languages,
  Plus,
} from 'lucide-react';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { Card } from '@mister-guiiug/dev-pwa-config/react/card';
import { useIdlePrefetch } from '@mister-guiiug/dev-pwa-config/react/use-prefetch';
import { TextField } from '@mister-guiiug/dev-pwa-config/react/field';
import { useI18n } from '../../i18n/index.ts';
import { useTaux } from '../../rates/store.ts';
import { codesConnus, tauxDuJour } from '../../rates/service.ts';
import { rafraichirTaux } from '../../shared/queries/taux.ts';
import { usePreferences } from '../../app/preferences.ts';
import { nomAuPluriel } from '../../domain/currencies.ts';
import { formaterMontant } from '../../domain/money.ts';
import { appuyer, type Touche } from '../../domain/calcul.ts';
import {
  deriver,
  texteDe as ecrireMontant,
  useConversion,
  type Champ,
  type ChampSaisi,
} from './conversion.ts';
import { Pave } from './Pave.tsx';
import { LigneFrais } from './LigneFrais.tsx';
import { languesProposees } from '../../data/langues.ts';
import { CurrencyPicker } from './CurrencyPicker.tsx';
import { RateLine } from './RateLine.tsx';
import { SaveForm } from './SaveForm.tsx';
import { CompositionLigne } from './CompositionLigne.tsx';

/**
 * LE VOLET DES BILLETS, À PART (#19), ET PRÉCHARGÉ. Un morceau chargé au
 * premier geste faisait attendre son ouverture le temps d'un aller-retour
 * réseau ; il part désormais dès que le navigateur est libre. La même
 * fonction sert `lazy()` et le préchargement : un seul morceau, jamais deux.
 */
const chargerVolet = () => import('../money/MoneySheet.tsx');
const MoneySheet = lazy(() =>
  chargerVolet().then(module => ({ default: module.MoneySheet }))
);

/**
 * LES MOTS UTILES, À PART AUSSI (spécification 004) : la feuille et son jeu de
 * phrases (9,1 kB gzip) forment un morceau, préchargé au repos comme le volet.
 */
const chargerMots = () => import('../phrases/MotsUtiles.tsx');
const MotsUtiles = lazy(() =>
  chargerMots().then(module => ({ default: module.MotsUtiles }))
);

/**
 * L'écran principal (récit 1) : deux champs liés, l'un saisi, l'autre
 * calculé — le calculé porte la lecture. Tient sans défilement sur un
 * téléphone (CR-005).
 *
 * Une SECONDE DEVISE, facultative, ajoute un troisième champ sous la paire
 * (spécification 003, récit 1) : les trois passent par la référence, et
 * chaque devise a sa ligne de taux. La CALCULATRICE (récit 2) remplace le
 * clavier du téléphone par un pavé qui écrit dans le dernier champ touché.
 */
export function ConvertScreen() {
  const { t, locale } = useI18n();
  useIdlePrefetch(chargerVolet);
  useIdlePrefetch(chargerMots);
  const etat = useTaux(s => s.etat);
  const pret = useTaux(s => s.pret);
  const echec = useTaux(s => s.echec);
  const reference = usePreferences(s => s.reference);
  const devise = usePreferences(s => s.devise);
  const recentes = usePreferences(s => s.recentes);
  const epinglees = usePreferences(s => s.epinglees);
  const epingler = usePreferences(s => s.epingler);
  const marge = usePreferences(s => s.marge);
  const decimales = usePreferences(s => s.decimales);
  const choisirDevise = usePreferences(s => s.choisirDevise);
  const seconde = usePreferences(s => s.seconde);
  const choisirSeconde = usePreferences(s => s.choisirSeconde);
  const retirerSeconde = usePreferences(s => s.retirerSeconde);
  const calculatrice = usePreferences(s => s.calculatrice);
  const frais = usePreferences(s => s.frais);
  const fraisChoisis = usePreferences(s => s.fraisChoisis);
  const choisirFrais = usePreferences(s => s.choisirFrais);
  const basculerCalculatrice = usePreferences(s => s.basculerCalculatrice);
  const saisie = useConversion(s => s.saisie);
  const haut = useConversion(s => s.haut);
  const saisir = useConversion(s => s.saisir);
  const inverser = useConversion(s => s.inverser);
  const [volet, setVolet] = useState(false);
  const [mots, setMots] = useState(false);
  /** Le dernier champ qui a reçu le focus : celui où le pavé écrit (R4). */
  const [cible, setCible] = useState<ChampSaisi>(saisie.champ);

  const codes = useMemo(() => codesConnus(etat), [etat]);
  const maintenant = new Date();
  const jour = tauxDuJour(reference, devise, etat, maintenant);
  const jourSeconde = seconde
    ? tauxDuJour(reference, seconde, etat, maintenant)
    : undefined;
  const avecSeconde = seconde
    ? { code: seconde, taux: jourSeconde?.taux }
    : null;
  const d = deriver(
    saisie,
    devise,
    reference,
    jour?.taux,
    locale,
    marge,
    decimales,
    avecSeconde
  );
  const indicatif =
    marge === 0
      ? d
      : deriver(
          saisie,
          devise,
          reference,
          jour?.taux,
          locale,
          0,
          decimales,
          avecSeconde
        );

  const bas: Champ = haut === 'devise' ? 'reference' : 'devise';
  // Les langues du pays de la devise, puis de la seconde, sans celle de
  // l'application : vide, pas de bouton (spécification 004, EF-001).
  const langues = languesProposees([devise, seconde], locale);
  const codeDe = (lequel: ChampSaisi) =>
    lequel === 'devise'
      ? devise
      : lequel === 'reference'
        ? reference
        : (seconde ?? reference);
  const texteDe = (lequel: ChampSaisi) =>
    lequel === 'devise'
      ? d.texteDevise
      : lequel === 'reference'
        ? d.texteReference
        : d.texteSeconde;
  const montantDe = (lequel: ChampSaisi) =>
    lequel === 'devise'
      ? d.montantDevise
      : lequel === 'reference'
        ? d.montantReference
        : d.montantSeconde;

  // Une cible retirée (la seconde devise) rend la main à la référence.
  const cibleActive: ChampSaisi =
    cible === 'seconde' && !seconde ? 'reference' : cible;

  /**
   * Une touche du pavé (recherche R4). Dans le champ saisi, elle prolonge sa
   * saisie ; dans un autre, un chiffre commence une saisie neuve et un
   * opérateur prolonge le montant affiché (« 3,40 + »).
   */
  const toucher = (touche: Touche) => {
    const neuve = /^\d$/.test(touche) || touche === 'decimal';
    const depart =
      cibleActive === saisie.champ
        ? saisie.texte
        : neuve || touche === 'effacer'
          ? ''
          : texteDe(cibleActive);
    saisir(cibleActive, appuyer(depart, touche, locale));
  };

  /** « = » : le calcul devient son résultat, aux décimales de la devise (R5). */
  const egal = () => {
    const montant = montantDe(saisie.champ);
    if (cibleActive !== saisie.champ || !d.calcul || montant === null) return;
    saisir(
      saisie.champ,
      ecrireMontant(montant, codeDe(saisie.champ), locale, null)
    );
  };

  const erreur =
    d.erreur === null
      ? undefined
      : d.erreur === 'division'
        ? t('convert.division')
        : d.erreur === 'negatif'
          ? t('convert.negatif')
          : d.calcul
            ? t('convert.calculIllisible')
            : t('convert.invalide');
  const resultat = (lequel: ChampSaisi) => {
    const montant = montantDe(lequel);
    return saisie.champ === lequel && d.calcul && montant !== null
      ? t('convert.resultat', {
          montant: formaterMontant(montant, codeDe(lequel), locale),
        })
      : undefined;
  };

  /**
   * Retirer la seconde devise ne perd pas un montant qui y était saisi : il
   * passe dans le champ de la référence, sans la marge, que le calcul
   * appliquera de nouveau.
   */
  const retirer = () => {
    if (saisie.champ === 'seconde') {
      saisir('reference', indicatif.texteReference);
    }
    retirerSeconde();
  };

  // Le carnet garde la paire du champ saisi : celle de la seconde devise
  // quand c'est là qu'on a tapé (spécification 003, EF-005).
  const enSeconde = saisie.champ === 'seconde' && seconde !== null;

  // « Montant en livres égyptiennes », « Montant en euros » : un montant se
  // compte au pluriel, dans les deux langues.
  const champ = (lequel: ChampSaisi, heros = false) => (
    <TextField
      key={lequel}
      className={
        heros
          ? '[&_[data-dwc=field-control]]:text-fluid-xl [&_[data-dwc=field-control]]:font-bold [&_[data-dwc=field-control]]:tabular-nums'
          : '[&_[data-dwc=field-control]]:tabular-nums'
      }
      label={t('convert.montant', {
        nom: nomAuPluriel(codeDe(lequel), locale),
      })}
      // Calculatrice allumée : le champ garde le focus et le curseur, le
      // téléphone n'ouvre pas son clavier (recherche R3).
      inputMode={calculatrice ? 'none' : 'decimal'}
      autoComplete="off"
      enterKeyHint="done"
      value={texteDe(lequel)}
      onFocus={() => setCible(lequel)}
      onChange={event => saisir(lequel, event.target.value)}
      hint={resultat(lequel)}
      error={saisie.champ === lequel ? erreur : undefined}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <h2 className="sr-only">{t('convert.title')}</h2>
      {/* LES DEUX DEVISES CÔTE À CÔTE, sans rangée de plus : l'écran tient
          sans défilement à 390 × 844 avec la seconde (CR-005). Sans elle,
          « + Devise » occupe la place, nommé en entier pour un lecteur
          d'écran. */}
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <CurrencyPicker
            code={devise}
            codes={codes}
            recentes={recentes}
            epinglees={epinglees}
            onEpingler={epingler}
            onChoisir={choisirDevise}
            exclure={reference}
            compact={seconde !== null}
          />
        </div>
        <div className={seconde ? 'min-w-0 flex-1' : 'shrink-0'}>
          <CurrencyPicker
            code={seconde}
            codes={codes.filter(c => c !== devise)}
            recentes={recentes}
            epinglees={epinglees}
            onEpingler={epingler}
            onChoisir={choisirSeconde}
            exclure={reference}
            etiquette={t('convert.choisirSeconde')}
            titre={t('convert.seconde')}
            compact
            retirer={
              seconde
                ? {
                    libelle: t('convert.retirerSeconde', { code: seconde }),
                    action: retirer,
                  }
                : undefined
            }
            declencheur={
              seconde
                ? undefined
                : ouvrir => (
                    // Une place libre, pas une action principale : le contour
                    // en tirets et la taille du bouton voisin, sans couleur.
                    <button
                      type="button"
                      onClick={ouvrir}
                      aria-label={t('convert.ajouterSeconde')}
                      className="flex h-full min-h-11 items-center gap-2 rounded-xl border border-dashed px-4 font-semibold"
                      style={{
                        borderColor: 'var(--dwc-border-strong)',
                        color: 'var(--dwc-text)',
                      }}
                    >
                      <Plus aria-hidden="true" className="size-5" />
                      {t('convert.ajouterCourt')}
                    </button>
                  )
            }
          />
        </div>
      </div>
      <Card className="flex flex-col gap-2">
        {champ(haut)}
        {/* Les deux gestes sur les champs, ensemble au milieu. */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={inverser}
            aria-label={t('convert.inverser')}
            title={t('convert.inverser')}
            className="flex size-10 items-center justify-center rounded-full border"
            style={{ borderColor: 'var(--dwc-border-strong)' }}
          >
            <ArrowUpDown aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            onClick={basculerCalculatrice}
            aria-label={t('convert.calculatrice')}
            aria-pressed={calculatrice}
            title={t('convert.calculatrice')}
            className="flex size-10 items-center justify-center rounded-full border"
            style={
              calculatrice
                ? {
                    borderColor: 'var(--dwc-primary)',
                    background: 'var(--dwc-primary)',
                    color: 'var(--dwc-primary-contrast)',
                  }
                : { borderColor: 'var(--dwc-border-strong)' }
            }
          >
            <Calculator aria-hidden="true" className="size-5" />
          </button>
        </div>
        {champ(bas, true)}
        {seconde && champ('seconde')}
      </Card>
      {calculatrice && (
        <Pave
          cible={nomAuPluriel(codeDe(cibleActive), locale)}
          onTouche={toucher}
          onEgal={egal}
        />
      )}
      <LigneFrais
        frais={frais}
        choisis={fraisChoisis}
        onChoisir={choisirFrais}
        reference={reference}
        montantReference={indicatif.montantReference}
        tauxFixe={
          tauxDuJour(
            reference,
            frais.find(f => f.id === fraisChoisis)?.deviseFixe ?? reference,
            etat,
            maintenant
          )?.taux
        }
      />
      <RateLine
        jour={jour}
        pret={pret}
        horsLigne={echec}
        marge={marge}
        onReessayer={() => void rafraichirTaux({ force: true })}
      />
      {seconde && (
        <RateLine
          jour={jourSeconde}
          pret={pret}
          horsLigne={echec}
          secondaire={{ code: seconde }}
          onReessayer={() => void rafraichirTaux({ force: true })}
        />
      )}
      <CompositionLigne montant={d.montantDevise} devise={devise} />
      <div className="flex flex-col gap-2">
        {/* Côte à côte dès que la place le permet, l'un sous l'autre sur un
            petit écran : aucun libellé ne se coupe. */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-w-0 flex-1 basis-40"
            onClick={() => setVolet(true)}
          >
            <IconeBillets aria-hidden="true" className="size-5" />
            {t('convert.billets')}
          </Button>
          {langues.length > 0 && (
            <Button
              variant="outline"
              className="min-w-0 flex-1 basis-40"
              onClick={() => setMots(true)}
            >
              <Languages aria-hidden="true" className="size-5" />
              {t('phrases.bouton')}
            </Button>
          )}
        </div>
        <SaveForm
          devise={enSeconde ? seconde : devise}
          reference={reference}
          jour={enSeconde ? jourSeconde : jour}
          derive={
            enSeconde
              ? { ...indicatif, montantDevise: indicatif.montantSeconde }
              : indicatif
          }
          champ={enSeconde ? 'devise' : (saisie.champ as Champ)}
          marge={marge}
          avecFrais={frais.some(f => f.id === fraisChoisis)}
        />
      </div>
      {mots && langues.length > 0 && (
        <Suspense fallback={null}>
          <MotsUtiles open onClose={() => setMots(false)} langues={langues} />
        </Suspense>
      )}
      {volet && (
        <Suspense fallback={null}>
          <MoneySheet
            open
            onClose={() => setVolet(false)}
            devise={devise}
            reference={reference}
            taux={jour?.taux}
            montantDevise={d.montantDevise}
            montantReference={d.montantReference}
          />
        </Suspense>
      )}
    </div>
  );
}

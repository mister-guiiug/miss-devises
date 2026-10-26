import { lazy, Suspense, useMemo, useState } from 'react';
import { ArrowUpDown, Banknote as IconeBillets, Plus, X } from 'lucide-react';
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
import {
  deriver,
  useConversion,
  type Champ,
  type ChampSaisi,
} from './conversion.ts';
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
 * L'écran principal (récit 1) : deux champs liés, l'un saisi, l'autre
 * calculé — le calculé porte la lecture. Tient sans défilement sur un
 * téléphone (CR-005).
 *
 * Une SECONDE DEVISE, facultative, ajoute un troisième champ sous la paire
 * (spécification 003, récit 1) : les trois passent par la référence, et
 * chaque devise a sa ligne de taux.
 */
export function ConvertScreen() {
  const { t, locale } = useI18n();
  useIdlePrefetch(chargerVolet);
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
  const saisie = useConversion(s => s.saisie);
  const haut = useConversion(s => s.haut);
  const saisir = useConversion(s => s.saisir);
  const inverser = useConversion(s => s.inverser);
  const [volet, setVolet] = useState(false);

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
      inputMode="decimal"
      autoComplete="off"
      enterKeyHint="done"
      value={texteDe(lequel)}
      onChange={event => saisir(lequel, event.target.value)}
      error={
        saisie.champ === lequel && d.invalide
          ? t('convert.invalide')
          : undefined
      }
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <h2 className="sr-only">{t('convert.title')}</h2>
      <CurrencyPicker
        code={devise}
        codes={codes}
        recentes={recentes}
        epinglees={epinglees}
        onEpingler={epingler}
        onChoisir={choisirDevise}
        exclure={reference}
      />
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
        declencheur={
          seconde
            ? undefined
            : ouvrir => (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={ouvrir}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  {t('convert.ajouterSeconde')}
                </Button>
              )
        }
      />
      <Card className="flex flex-col gap-2">
        {champ(haut)}
        <button
          type="button"
          onClick={inverser}
          aria-label={t('convert.inverser')}
          className="mx-auto flex size-10 items-center justify-center rounded-full border"
          style={{ borderColor: 'var(--dwc-border-strong)' }}
        >
          <ArrowUpDown aria-hidden="true" className="size-5" />
        </button>
        {champ(bas, true)}
        {seconde && (
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">{champ('seconde')}</div>
            <button
              type="button"
              onClick={retirer}
              aria-label={t('convert.retirerSeconde', { code: seconde })}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
        )}
      </Card>
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
        <Button variant="outline" block onClick={() => setVolet(true)}>
          <IconeBillets aria-hidden="true" className="size-5" />
          {t('convert.billets')}
        </Button>
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
        />
      </div>
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

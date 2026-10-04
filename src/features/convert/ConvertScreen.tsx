import { lazy, Suspense, useMemo, useState } from 'react';
import { ArrowUpDown, Banknote as IconeBillets } from 'lucide-react';
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
import { deriver, useConversion, type Champ } from './conversion.ts';
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
  const saisie = useConversion(s => s.saisie);
  const haut = useConversion(s => s.haut);
  const saisir = useConversion(s => s.saisir);
  const inverser = useConversion(s => s.inverser);
  const [volet, setVolet] = useState(false);

  const codes = useMemo(() => codesConnus(etat), [etat]);
  const jour = tauxDuJour(reference, devise, etat, new Date());
  const d = deriver(
    saisie,
    devise,
    reference,
    jour?.taux,
    locale,
    marge,
    decimales
  );
  const indicatif =
    marge === 0
      ? d
      : deriver(saisie, devise, reference, jour?.taux, locale, 0, decimales);

  const bas: Champ = haut === 'devise' ? 'reference' : 'devise';

  // « Montant en livres égyptiennes », « Montant en euros » : un montant se
  // compte au pluriel, dans les deux langues.
  const champ = (lequel: Champ, heros = false) => (
    <TextField
      key={lequel}
      className={
        heros
          ? '[&_[data-dwc=field-control]]:text-fluid-xl [&_[data-dwc=field-control]]:font-bold [&_[data-dwc=field-control]]:tabular-nums'
          : '[&_[data-dwc=field-control]]:tabular-nums'
      }
      label={t('convert.montant', {
        nom: nomAuPluriel(lequel === 'devise' ? devise : reference, locale),
      })}
      inputMode="decimal"
      autoComplete="off"
      enterKeyHint="done"
      value={lequel === 'devise' ? d.texteDevise : d.texteReference}
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
      </Card>
      <RateLine
        jour={jour}
        pret={pret}
        horsLigne={echec}
        marge={marge}
        onReessayer={() => void rafraichirTaux({ force: true })}
      />
      <CompositionLigne montant={d.montantDevise} devise={devise} />
      <div className="flex flex-col gap-2">
        <Button variant="outline" block onClick={() => setVolet(true)}>
          <IconeBillets aria-hidden="true" className="size-5" />
          {t('convert.billets')}
        </Button>
        <SaveForm
          devise={devise}
          reference={reference}
          jour={jour}
          derive={indicatif}
          champ={saisie.champ}
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

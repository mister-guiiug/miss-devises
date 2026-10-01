import { useMemo, useState } from 'react';
import { ArrowUpDown, Banknote as IconeBillets } from 'lucide-react';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { Card } from '@mister-guiiug/dev-pwa-config/react/card';
import { TextField } from '@mister-guiiug/dev-pwa-config/react/field';
import { useI18n } from '../../i18n/index.ts';
import { useTaux } from '../../rates/store.ts';
import { tauxDuJour, type EtatTaux } from '../../rates/service.ts';
import { usePreferences } from '../../app/preferences.ts';
import { nomDevise } from '../../domain/currencies.ts';
import { deriver, useConversion, type Champ } from './conversion.ts';
import { CurrencyPicker } from './CurrencyPicker.tsx';
import { RateLine } from './RateLine.tsx';
import { SaveForm } from './SaveForm.tsx';
import { MoneySheet } from '../money/MoneySheet.tsx';

/** Les devises que l'appareil sait convertir : celles des deux sources. */
function codesDe(etat: EtatTaux): string[] {
  return [
    ...new Set([
      ...Object.keys(etat.bce?.taux ?? {}),
      ...Object.keys(etat.marche?.taux ?? {}),
    ]),
  ];
}

/**
 * L'écran principal (récit 1) : deux champs liés, l'un saisi, l'autre
 * calculé, dans les deux sens et à chaque frappe (EF-001). Tient sans
 * défilement sur un téléphone (CR-005).
 */
export function ConvertScreen() {
  const { t, locale } = useI18n();
  const etat = useTaux(s => s.etat);
  const pret = useTaux(s => s.pret);
  const echec = useTaux(s => s.echec);
  const rafraichir = useTaux(s => s.rafraichir);
  const devise = usePreferences(s => s.devise);
  const recentes = usePreferences(s => s.recentes);
  const choisirDevise = usePreferences(s => s.choisirDevise);
  const saisie = useConversion(s => s.saisie);
  const haut = useConversion(s => s.haut);
  const saisir = useConversion(s => s.saisir);
  const inverser = useConversion(s => s.inverser);
  const [volet, setVolet] = useState(false);

  const codes = useMemo(() => codesDe(etat), [etat]);
  const jour = tauxDuJour(devise, etat, new Date());
  const d = deriver(saisie, devise, jour?.taux, locale);

  // « Montant en livre égyptienne » : en français, le nom de la devise se
  // lit en minuscules au milieu d'une phrase.
  const nom = nomDevise(devise, locale);
  const nomEnPhrase =
    locale === 'fr' ? nom.charAt(0).toLowerCase() + nom.slice(1) : nom;

  const champ = (lequel: Champ) => (
    <TextField
      key={lequel}
      label={
        lequel === 'devise'
          ? t('convert.montant', { nom: nomEnPhrase })
          : t('convert.montantEuro')
      }
      inputMode="decimal"
      autoComplete="off"
      enterKeyHint="done"
      value={lequel === 'devise' ? d.texteDevise : d.texteEuro}
      onChange={event => saisir(lequel, event.target.value)}
      error={
        saisie.champ === lequel && d.invalide
          ? t('convert.invalide')
          : undefined
      }
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="sr-only">{t('convert.title')}</h2>
      <CurrencyPicker
        code={devise}
        codes={codes}
        recentes={recentes}
        onChoisir={choisirDevise}
      />
      <Card className="flex flex-col gap-2">
        {champ(haut)}
        <button
          type="button"
          onClick={inverser}
          aria-label={t('convert.inverser')}
          className="mx-auto flex size-11 items-center justify-center rounded-full border"
          style={{ borderColor: 'var(--dwc-border-strong)' }}
        >
          <ArrowUpDown aria-hidden="true" className="size-5" />
        </button>
        {champ(haut === 'devise' ? 'euro' : 'devise')}
      </Card>
      <RateLine
        jour={jour}
        pret={pret}
        horsLigne={echec}
        onReessayer={() => void rafraichir({ force: true })}
      />
      <Button variant="outline" block onClick={() => setVolet(true)}>
        <IconeBillets aria-hidden="true" className="size-5" />
        {t('convert.billets')}
      </Button>
      <SaveForm devise={devise} jour={jour} derive={d} champ={saisie.champ} />
      <MoneySheet
        open={volet}
        onClose={() => setVolet(false)}
        devise={devise}
        taux={jour?.taux}
        montantDevise={d.montantDevise}
        montantEuro={d.montantEuro}
      />
    </div>
  );
}

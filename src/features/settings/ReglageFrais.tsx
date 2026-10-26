import { useMemo, useState, type FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import {
  SelectField,
  TextField,
} from '@mister-guiiug/dev-pwa-config/react/field';
import { Sheet } from '@mister-guiiug/dev-pwa-config/react/sheet';
import { useI18n } from '../../i18n/index.ts';
import {
  usePreferences,
  type FraisEnregistres,
} from '../../app/preferences.ts';
import { decrireFrais } from '../../domain/frais.ts';
import { lireMontant } from '../../domain/money.ts';
import { nomDevise } from '../../domain/currencies.ts';

const MAX_FRAIS = 6;

interface Props {
  /** La monnaie de référence : la devise proposée pour un montant fixe. */
  reference: string;
  /** Les devises connues, pour la devise du montant fixe. */
  codes: readonly string[];
}

/**
 * Les frais de banque ou de distributeur (spécification 005, récit 1) : une
 * liste, et une feuille pour les ajouter ou les modifier. L'écran Convertir
 * en applique un, et montre le coût frais compris.
 */
export function ReglageFrais({ reference, codes }: Props) {
  const { t, locale } = useI18n();
  const frais = usePreferences(s => s.frais);
  const supprimerFrais = usePreferences(s => s.supprimerFrais);
  // `null` : feuille fermée ; `'nouveaux'` : ajout ; sinon l'identifiant modifié.
  const [edition, setEdition] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      {frais.length === 0 ? (
        <p className="m-0 text-sm">{t('settings.fraisAucun')}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {frais.map(f => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded-lg border px-3 py-1"
              style={{ borderColor: 'var(--dwc-border)' }}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{f.libelle}</span>
                <span
                  className="text-sm tabular-nums"
                  style={{ color: 'var(--dwc-text-soft)' }}
                >
                  {decrireFrais(f, locale)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setEdition(f.id)}
                aria-label={t('settings.fraisModifier', { libelle: f.libelle })}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg"
              >
                <Pencil aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => supprimerFrais(f.id)}
                aria-label={t('settings.fraisSupprimer', {
                  libelle: f.libelle,
                })}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {frais.length < MAX_FRAIS ? (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setEdition('nouveaux')}
        >
          {t('settings.fraisAjouter')}
        </Button>
      ) : (
        <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
          {t('settings.fraisMax')}
        </p>
      )}
      {edition !== null && (
        <FeuilleFrais
          // Une feuille neuve par édition : ses champs repartent des valeurs.
          key={edition}
          frais={frais.find(f => f.id === edition) ?? null}
          reference={reference}
          codes={codes}
          onFermer={() => setEdition(null)}
        />
      )}
    </div>
  );
}

function FeuilleFrais({
  frais,
  reference,
  codes,
  onFermer,
}: {
  /** `null` : de nouveaux frais. */
  frais: FraisEnregistres | null;
  reference: string;
  codes: readonly string[];
  onFermer: () => void;
}) {
  const { t, locale } = useI18n();
  const ajouterFrais = usePreferences(s => s.ajouterFrais);
  const modifierFrais = usePreferences(s => s.modifierFrais);
  const nombre = (valeur: number) =>
    valeur === 0
      ? ''
      : formatNumber(valeur, locale, {
          maximumFractionDigits: 2,
          useGrouping: false,
        });
  const [libelle, setLibelle] = useState(frais?.libelle ?? '');
  const [pourcentage, setPourcentage] = useState(
    nombre(frais?.pourcentage ?? 0)
  );
  const [fixe, setFixe] = useState(nombre(frais?.fixe ?? 0));
  const [devise, setDevise] = useState(frais?.deviseFixe ?? reference);
  const [invalide, setInvalide] = useState(false);

  // La devise du montant fixe : une liste native, triée par code. Une
  // seconde feuille de recherche s'ouvrirait PAR-DESSUS celle-ci.
  const options = useMemo(
    () =>
      [...new Set([reference, devise, ...codes])]
        .sort()
        .map(code => ({ code, nom: nomDevise(code, locale) })),
    [codes, devise, locale, reference]
  );

  const lire = (texte: string) =>
    texte.trim() === '' ? 0 : lireMontant(texte, locale);

  function enregistrer(event: FormEvent) {
    event.preventDefault();
    const p = lire(pourcentage);
    const f = lire(fixe);
    const valides =
      libelle.trim() !== '' &&
      p !== null &&
      f !== null &&
      p <= 100 &&
      (p > 0 || f > 0);
    if (!valides) {
      setInvalide(true);
      return;
    }
    const saisis = {
      libelle: libelle.trim(),
      pourcentage: p,
      fixe: f,
      deviseFixe: devise,
    };
    if (frais) modifierFrais(frais.id, saisis);
    else ajouterFrais(saisis);
    onFermer();
  }

  return (
    <Sheet
      open
      title={
        frais ? t('settings.fraisModification') : t('settings.fraisNouveaux')
      }
      onClose={onFermer}
    >
      <form onSubmit={enregistrer} className="flex flex-col gap-3" noValidate>
        <TextField
          label={t('settings.fraisLibelle')}
          placeholder={t('settings.fraisLibelleExemple')}
          value={libelle}
          maxLength={40}
          onChange={event => setLibelle(event.target.value)}
        />
        <TextField
          label={t('settings.fraisPourcentage')}
          hint={t('settings.fraisPourcentageAide')}
          inputMode="decimal"
          autoComplete="off"
          value={pourcentage}
          onChange={event => setPourcentage(event.target.value)}
        />
        <TextField
          label={t('settings.fraisFixe')}
          inputMode="decimal"
          autoComplete="off"
          value={fixe}
          onChange={event => setFixe(event.target.value)}
        />
        <SelectField
          label={t('settings.fraisDevise')}
          value={devise}
          onChange={event => setDevise(event.target.value)}
        >
          {options.map(({ code, nom }) => (
            <option key={code} value={code}>
              {code} · {nom}
            </option>
          ))}
        </SelectField>
        {invalide && (
          <p
            role="alert"
            className="m-0 text-sm"
            style={{ color: 'var(--dwc-danger)' }}
          >
            {t('settings.fraisInvalide')}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onFermer}>
            {t('settings.fraisAnnuler')}
          </Button>
          <Button type="submit">{t('settings.fraisEnregistrer')}</Button>
        </div>
      </form>
    </Sheet>
  );
}

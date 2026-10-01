import { useState, type FormEvent } from 'react';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { TextField } from '@mister-guiiug/dev-pwa-config/react/field';
import { useToast } from '@mister-guiiug/dev-pwa-config/react/toast';
import { useI18n } from '../../i18n/index.ts';
import { formaterMontant } from '../../domain/money.ts';
import type { TauxDuJour } from '../../rates/service.ts';
import { useCarnet } from '../carnet/store.ts';
import type { Champ, Derive } from './conversion.ts';

interface Props {
  devise: string;
  jour: TauxDuJour | undefined;
  derive: Derive;
  /** Le champ saisi : il devient le départ de la conversion gardée. */
  champ: Champ;
}

/**
 * Garder la conversion affichée, avec un libellé (récit 4, EF-010). Le
 * montant tapé est le départ, l'autre l'arrivée ; le taux, sa source et sa
 * date sont ceux de l'écran. Sans libellé, la paire et le montant en
 * tiennent lieu : « 200,00 EGP → EUR ».
 */
export function SaveForm({ devise, jour, derive, champ }: Props) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const ajouter = useCarnet(s => s.add);
  const [libelle, setLibelle] = useState('');

  const enDevise = champ === 'devise';
  const saisi = enDevise ? derive.montantDevise : derive.montantEuro;
  const calcule = enDevise ? derive.montantEuro : derive.montantDevise;
  const possible =
    jour !== undefined &&
    saisi !== null &&
    saisi > 0 &&
    calcule !== null &&
    calcule > 0;

  async function enregistrer(event: FormEvent) {
    event.preventDefault();
    if (!jour || saisi === null || calcule === null || !possible) return;
    const codeSaisi = enDevise ? devise : 'EUR';
    const codeCalcule = enDevise ? 'EUR' : devise;
    await ajouter({
      libelle:
        libelle.trim() ||
        `${formaterMontant(saisi, codeSaisi, locale)} → ${codeCalcule}`,
      de: { code: codeSaisi, montant: saisi },
      vers: { code: codeCalcule, montant: calcule },
      taux: jour.taux,
      source: jour.source,
      dateTaux: jour.date,
    });
    // Une écriture refusée a déjà rétabli le carnet : on dit pourquoi.
    const erreur = useCarnet.getState().error;
    if (erreur) {
      toast.error(erreur);
      return;
    }
    setLibelle('');
    toast.success(t('convert.enregistre'));
  }

  return (
    <form onSubmit={enregistrer} className="flex items-end gap-2">
      <TextField
        className="min-w-0 flex-1"
        label={t('convert.libelle')}
        placeholder={t('convert.libelleExemple')}
        value={libelle}
        onChange={event => setLibelle(event.target.value)}
        maxLength={120}
        autoComplete="off"
        enterKeyHint="done"
      />
      <Button type="submit" aria-disabled={!possible}>
        {t('convert.enregistrer')}
      </Button>
    </form>
  );
}

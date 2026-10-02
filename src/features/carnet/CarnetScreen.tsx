import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotebookPen, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { Card } from '@mister-guiiug/dev-pwa-config/react/card';
import { EmptyState } from '@mister-guiiug/dev-pwa-config/react/empty-state';
import { TextField } from '@mister-guiiug/dev-pwa-config/react/field';
import { Sheet } from '@mister-guiiug/dev-pwa-config/react/sheet';
import { useToast } from '@mister-guiiug/dev-pwa-config/react/toast';
import { formatNumber } from '@mister-guiiug/dev-pwa-config/format';
import { useI18n } from '../../i18n/index.ts';
import { useTaux } from '../../rates/store.ts';
import { tauxDuJour } from '../../rates/service.ts';
import type { ConversionEnregistree } from '../../backend/ports.ts';
import {
  decimalesDe,
  formaterCoupure,
  formaterDate,
  formaterMontant,
  formaterPourcentage,
  formaterTaux,
} from '../../domain/money.ts';
import {
  auTauxDuJour,
  deviseEtrangere,
  reprise,
  totauxParPaire,
} from '../../domain/carnet.ts';
import { usePreferences } from '../../app/preferences.ts';
import { useConversion } from '../convert/conversion.ts';
import { Drapeau } from '../../ui/Drapeau.tsx';
import { useCarnet } from './store.ts';

/**
 * Le carnet (récit 4) : les conversions gardées, chacune refaite au taux du
 * jour, renommables, supprimables avec annulation, et leurs totaux par devise
 * (EF-010 à EF-012).
 */
export function CarnetScreen() {
  const { t, m, fmt } = useI18n();
  const conversions = useCarnet(s => s.conversions);
  const ready = useCarnet(s => s.ready);
  const load = useCarnet(s => s.load);
  const [aRenommer, setARenommer] = useState<ConversionEnregistree>();

  useEffect(() => {
    if (!ready) void load();
  }, [ready, load]);

  const navigate = useNavigate();

  if (ready && conversions.length === 0) {
    return (
      <EmptyState
        icon={<NotebookPen aria-hidden="true" />}
        title={t('carnet.vide')}
        description={t('carnet.videAide')}
        action={
          <Button onClick={() => navigate('/')}>{t('carnet.ouvrir')}</Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="sr-only">{t('carnet.title')}</h2>
      <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
        {fmt.plural(conversions.length, m.carnet.count, {
          count: conversions.length,
        })}
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {conversions.map(c => (
          <Ligne key={c.id} conversion={c} onRenommer={() => setARenommer(c)} />
        ))}
      </ul>
      <Totaux conversions={conversions} />
      <Renommer
        conversion={aRenommer}
        onFermer={() => setARenommer(undefined)}
      />
    </div>
  );
}

function Ligne({
  conversion: c,
  onRenommer,
}: {
  conversion: ConversionEnregistree;
  onRenommer: () => void;
}) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const remove = useCarnet(s => s.remove);
  const undoRemove = useCarnet(s => s.undoRemove);
  const navigate = useNavigate();
  const poserPaire = usePreferences(s => s.poserPaire);
  const reprendreSaisie = useConversion(s => s.reprendre);
  const etat = useTaux(s => s.etat);
  const decimales = usePreferences(s => s.decimales);
  const code = deviseEtrangere(c);
  // Refaite au taux du jour de SA paire : sa référence, pas celle du moment.
  const jour = tauxDuJour(c.reference, code, etat, new Date());
  const refaite = jour ? auTauxDuJour(c, jour.taux) : undefined;
  const montant = (m: { code: string; montant: number }) =>
    formaterMontant(
      m.montant,
      m.code,
      locale,
      decimales === null ? {} : { decimales }
    );

  function supprimer() {
    remove(c.id);
    toast.show(t('carnet.supprime'), {
      action: { label: t('carnet.annuler'), onAction: () => undoRemove(c.id) },
    });
  }

  return (
    <li>
      <Card className="flex flex-col gap-1">
        <div className="flex items-start gap-2">
          <h3 className="m-0 min-w-0 flex-1 text-base font-semibold break-words">
            {c.libelle}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const ligne = reprise(c);
              poserPaire(ligne.reference, ligne.devise);
              reprendreSaisie({
                champ: ligne.champ,
                texte: formatNumber(ligne.montant, locale, {
                  useGrouping: false,
                  maximumFractionDigits: decimales ?? decimalesDe(c.de.code),
                }),
              });
              navigate('/');
            }}
            aria-label={t('carnet.reprendreLigne', { libelle: c.libelle })}
          >
            {t('carnet.reprendre')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRenommer}
            aria-label={t('carnet.renommerLigne', { libelle: c.libelle })}
          >
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={supprimer}
            aria-label={t('carnet.supprimerLigne', { libelle: c.libelle })}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
        {/* Les drapeaux sont en ligne, dans le texte : celui-ci reste
            « 200,00 EGP → 3,40 € », espaces compris. */}
        <p className="m-0 font-semibold">
          <Drapeau
            code={c.de.code}
            hauteur={12}
            className="mr-1.5 inline-block align-[-1px]"
          />
          {montant(c.de)} →{' '}
          <Drapeau
            code={c.vers.code}
            hauteur={12}
            className="mr-1.5 inline-block align-[-1px]"
          />
          {montant(c.vers)}
        </p>
        <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
          {t('carnet.taux', {
            date: formaterDate(c.dateTaux, locale),
            un: formaterCoupure(1, c.reference, locale),
            taux: `${formaterTaux(c.taux, locale)} ${code}`,
          })}
          {' · '}
          {t(`convert.source.${c.source}`)}
        </p>
        {refaite && (
          <p className="m-0 text-sm">
            {t('carnet.aujourdhui', {
              montant: formaterMontant(
                refaite.montant,
                c.vers.code,
                locale,
                decimales === null ? {} : { decimales }
              ),
              ecart: formaterPourcentage(refaite.ecart, locale),
            })}
          </p>
        )}
      </Card>
    </li>
  );
}

/**
 * Les totaux par paire (devise étrangère et référence), dès qu'une paire a
 * deux lignes.
 */
function Totaux({
  conversions,
}: {
  conversions: readonly ConversionEnregistree[];
}) {
  const { t, locale } = useI18n();
  const decimales = usePreferences(s => s.decimales);
  const options = decimales === null ? {} : { decimales };
  const totaux = totauxParPaire(conversions).filter(total => total.nombre > 1);
  if (totaux.length === 0) return null;
  return (
    <section aria-labelledby="carnet-totaux" className="flex flex-col gap-1">
      <h3 id="carnet-totaux" className="m-0 text-base font-semibold">
        {t('carnet.totaux')}
      </h3>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
        {totaux.map(total => (
          <li key={`${total.code}/${total.reference}`}>
            {t('carnet.total', {
              montant: formaterMontant(
                total.devise,
                total.code,
                locale,
                options
              ),
              reference: formaterMontant(
                total.montantReference,
                total.reference,
                locale,
                options
              ),
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** La feuille de renommage : le libellé actuel, prêt à être corrigé. */
function Renommer({
  conversion,
  onFermer,
}: {
  conversion: ConversionEnregistree | undefined;
  onFermer: () => void;
}) {
  const { t } = useI18n();
  const rename = useCarnet(s => s.rename);
  const [libelle, setLibelle] = useState('');
  const [pour, setPour] = useState<string>();

  // Le champ repart du libellé de la ligne choisie, à chaque ouverture.
  if (conversion && conversion.id !== pour) {
    setPour(conversion.id);
    setLibelle(conversion.libelle);
  }

  async function valider(event: FormEvent) {
    event.preventDefault();
    if (!conversion || !libelle.trim()) return;
    await rename(conversion.id, libelle);
    setPour(undefined);
    onFermer();
  }

  return (
    <Sheet
      open={conversion !== undefined}
      title={t('carnet.renommerTitre')}
      onClose={() => {
        setPour(undefined);
        onFermer();
      }}
    >
      <form onSubmit={valider} className="flex flex-col gap-3">
        <TextField
          label={t('convert.libelle')}
          value={libelle}
          onChange={event => setLibelle(event.target.value)}
          maxLength={120}
          autoComplete="off"
          enterKeyHint="done"
        />
        <Button type="submit" aria-disabled={!libelle.trim()}>
          {t('carnet.valider')}
        </Button>
      </form>
    </Sheet>
  );
}

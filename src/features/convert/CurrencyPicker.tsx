import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Sheet } from '@mister-guiiug/dev-pwa-config/react/sheet';
import { TextField } from '@mister-guiiug/dev-pwa-config/react/field';
import { useI18n } from '../../i18n/index.ts';
import {
  chercherDevises,
  listerDevises,
  nomDevise,
} from '../../domain/currencies.ts';
import { Drapeau } from '../../ui/Drapeau.tsx';

interface Props {
  code: string;
  codes: readonly string[];
  recentes: readonly string[];
  onChoisir: (code: string) => void;
  /** La devise à ne pas proposer : la monnaie de référence. */
  exclure?: string;
  /** Ce que le bouton dit avant le code : « Changer de devise ». */
  etiquette?: string;
  /** Le titre de la feuille : « Devise ». */
  titre?: string;
}

/**
 * Le choix d'une devise : un bouton qui la nomme, une feuille du socle qui
 * cherche par code ou par nom (EF-002), les récentes en tête (EF-016). Il
 * sert à la devise de l'écran Convertir, qui ne propose jamais la référence,
 * et à la monnaie de référence des réglages (spécification 002).
 */
export function CurrencyPicker({
  code,
  codes,
  recentes,
  onChoisir,
  exclure,
  etiquette,
  titre,
}: Props) {
  const { t, locale } = useI18n();
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const liste = useMemo(
    () => listerDevises(codes, locale, recentes, exclure),
    [codes, locale, recentes, exclure]
  );
  const trouvees = chercherDevises(liste, requete);
  const nom = nomDevise(code, locale);

  const fermer = () => {
    setOuvert(false);
    setRequete('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label={`${etiquette ?? t('convert.choisir')} : ${code}, ${nom}`}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 py-2 text-left"
        style={{
          borderColor: 'var(--dwc-border)',
          background: 'var(--dwc-surface)',
        }}
      >
        <Drapeau code={code} hauteur={20} />
        <span className="text-fluid-lg font-bold">{code}</span>
        <span className="min-w-0 flex-1 truncate">{nom}</span>
        <ChevronDown aria-hidden="true" className="size-5 shrink-0" />
      </button>

      <Sheet
        open={ouvert}
        title={titre ?? t('convert.devise')}
        onClose={fermer}
      >
        <TextField
          label={t('convert.recherche')}
          type="search"
          autoComplete="off"
          value={requete}
          onChange={event => setRequete(event.target.value)}
        />
        {trouvees.length === 0 ? (
          <p className="m-0 mt-3">{t('convert.aucune')}</p>
        ) : (
          <ul className="m-0 mt-3 flex list-none flex-col p-0">
            {trouvees.map((devise, i) => (
              <li key={devise.code}>
                {/* L'intitulé du groupe, une seule fois, avant le premier de
                    chaque groupe : la liste reste une seule liste au clavier. */}
                {!requete && i === 0 && devise.recente && (
                  <h3 className="m-0 mb-1 text-sm font-semibold">
                    {t('convert.recentes')}
                  </h3>
                )}
                {!requete &&
                  !devise.recente &&
                  (i === 0 || trouvees[i - 1]?.recente) && (
                    <h3 className="m-0 mt-3 mb-1 text-sm font-semibold">
                      {t('convert.toutes')}
                    </h3>
                  )}
                <button
                  type="button"
                  aria-current={devise.code === code ? 'true' : undefined}
                  onClick={() => {
                    onChoisir(devise.code);
                    fermer();
                  }}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left"
                  style={
                    devise.code === code
                      ? { background: 'var(--dwc-primary-soft)' }
                      : undefined
                  }
                >
                  <Drapeau code={devise.code} />
                  <span className="w-12 font-semibold">{devise.code}</span>
                  <span className="min-w-0 flex-1 truncate">{devise.nom}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}

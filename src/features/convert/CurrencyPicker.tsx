import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Pin, X } from 'lucide-react';
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
  /** La devise choisie ; `null` quand il n'y en a pas encore. */
  code: string | null;
  codes: readonly string[];
  recentes: readonly string[];
  onChoisir: (code: string) => void;
  /** La devise à ne pas proposer : la monnaie de référence. */
  exclure?: string;
  epinglees?: readonly string[];
  onEpingler?: (code: string) => void;
  /** Ce que le bouton dit avant le code : « Changer de devise ». */
  etiquette?: string;
  /** Le titre de la feuille : « Devise ». */
  titre?: string;
  /**
   * Remplace le bouton qui nomme la devise : « Ajouter une devise » ouvre la
   * même feuille (spécification 003).
   */
  declencheur?: (ouvrir: () => void) => ReactNode;
  /**
   * Le drapeau et le code seuls : deux devises côte à côte n'ont pas la place
   * de leur nom, qui reste dans l'intitulé du bouton.
   */
  compact?: boolean;
  /**
   * Un « × » dans la même boîte que le bouton, qui retire la devise : la
   * seconde devise se retire là où elle se choisit, et son champ garde toute
   * la largeur, comme les autres.
   */
  retirer?: { libelle: string; action: () => void };
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
  epinglees = [],
  onEpingler,
  etiquette,
  titre,
  declencheur,
  compact = false,
  retirer,
}: Props) {
  const { t, locale } = useI18n();
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const corps = useRef<HTMLDivElement>(null);
  const liste = useMemo(
    () => listerDevises(codes, locale, recentes, exclure, epinglees),
    [codes, locale, recentes, exclure, epinglees]
  );
  const trouvees = chercherDevises(liste, requete);
  const nom = code ? nomDevise(code, locale) : '';

  const fermer = () => {
    setOuvert(false);
    setRequete('');
  };

  // La feuille pose le focus sur son panneau. On le reprend sur la recherche,
  // pour que le clavier s'ouvre avec elle.
  useEffect(() => {
    if (!ouvert) return;
    corps.current?.querySelector('input')?.focus();
  }, [ouvert]);

  return (
    <>
      {declencheur && declencheur(() => setOuvert(true))}
      {!declencheur && code && (
        <div
          className="flex h-full min-h-11 w-full items-stretch rounded-xl border"
          style={{
            borderColor: 'var(--dwc-border)',
            background: 'var(--dwc-surface)',
          }}
        >
          <button
            type="button"
            onClick={() => setOuvert(true)}
            aria-label={`${etiquette ?? t('convert.choisir')} : ${code}, ${nom}`}
            className={
              compact
                ? // Le bouton est un conteneur : son chevron ne paraît que
                  // s'il a la place. Mesuré : le contenu en demande 98 px
                  // avec lui ; la case de la seconde devise en laisse 109 à
                  // 390 px, 94 à 360 px, 74 à 320 px.
                  '@container flex min-w-0 flex-1 items-center gap-2 rounded-xl py-2 ps-3 pe-2 text-left'
                : 'flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-2 text-left'
            }
          >
            <Drapeau code={code} hauteur={20} />
            <span className="text-fluid-lg font-bold">{code}</span>
            {/* L'espace compte : sans elle, le texte du bouton se lit
                « EGPLivre égyptienne », que le nom accessible ne contient pas
                (WCAG 2.5.3 ; axe 4.14, le 29/10/2026). La marge ne sépare
                que l'affichage. */}
            {!compact && ' '}
            {!compact && <span className="min-w-0 flex-1 truncate">{nom}</span>}
            <ChevronDown
              aria-hidden="true"
              className={
                compact
                  ? 'ms-auto size-5 shrink-0 @max-[6.25rem]:hidden'
                  : 'size-5 shrink-0'
              }
            />
          </button>
          {retirer && (
            <button
              type="button"
              onClick={retirer.action}
              aria-label={retirer.libelle}
              className="flex w-11 shrink-0 items-center justify-center rounded-e-xl border-s"
              style={{ borderColor: 'var(--dwc-border)' }}
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          )}
        </div>
      )}

      <Sheet
        open={ouvert}
        title={titre ?? t('convert.devise')}
        onClose={fermer}
      >
        <div ref={corps}>
          <TextField
            label={t('convert.recherche')}
            type="search"
            autoComplete="off"
            value={requete}
            onChange={event => setRequete(event.target.value)}
          />
        </div>
        {trouvees.length === 0 ? (
          <p className="m-0 mt-3">{t('convert.aucune')}</p>
        ) : (
          <ul className="m-0 mt-3 flex list-none flex-col p-0">
            {trouvees.map((devise, i) => (
              <li key={devise.code}>
                {/* L'intitulé du groupe, une seule fois, avant le premier de
                    chaque groupe : la liste reste une seule liste au clavier. */}
                {!requete && devise.epinglee && !trouvees[i - 1]?.epinglee && (
                  <h3 className="m-0 mb-1 text-sm font-semibold">
                    {t('convert.epinglees')}
                  </h3>
                )}
                {!requete && devise.recente && !trouvees[i - 1]?.recente && (
                  <h3 className="m-0 mt-3 mb-1 text-sm font-semibold first:mt-0">
                    {t('convert.recentes')}
                  </h3>
                )}
                {!requete &&
                  !devise.epinglee &&
                  !devise.recente &&
                  (i === 0 ||
                    trouvees[i - 1]?.epinglee ||
                    trouvees[i - 1]?.recente) && (
                    <h3 className="m-0 mt-3 mb-1 text-sm font-semibold">
                      {t('convert.toutes')}
                    </h3>
                  )}
                <div className="flex items-center">
                  <button
                    type="button"
                    aria-current={devise.code === code ? 'true' : undefined}
                    onClick={() => {
                      onChoisir(devise.code);
                      fermer();
                    }}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left"
                    style={
                      devise.code === code
                        ? { background: 'var(--dwc-primary-soft)' }
                        : undefined
                    }
                  >
                    <Drapeau code={devise.code} />
                    <span className="w-12 font-semibold">{devise.code}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {devise.nom}
                    </span>
                  </button>
                  {onEpingler && (
                    <button
                      type="button"
                      aria-pressed={Boolean(devise.epinglee)}
                      aria-label={
                        devise.epinglee
                          ? t('convert.desepingler', { code: devise.code })
                          : t('convert.epingler', { code: devise.code })
                      }
                      onClick={() => onEpingler(devise.code)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg"
                    >
                      <Pin
                        aria-hidden="true"
                        className="size-4"
                        style={
                          devise.epinglee
                            ? { color: 'var(--dwc-primary)' }
                            : undefined
                        }
                      />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}

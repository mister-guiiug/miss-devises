import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Square, Volume2 } from 'lucide-react';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { Sheet } from '@mister-guiiug/dev-pwa-config/react/sheet';
import { SegmentedControl } from '@mister-guiiug/dev-pwa-config/react/segmented-control';
import { useI18n } from '../../i18n/index.ts';
import brut from '../../data/phrases.json';
import { GROUPES, type IdPhrase, type JeuPhrases } from '../../data/phrases.ts';
import { arreter, choisirVoix, dire, useVoix } from './voix.ts';
import { LANGUES_DES_DEVISES } from '../../data/langues.ts';
import { arrondir, decimalesDe, formaterCoupure } from '../../domain/money.ts';

/** Vérifié par `phrases.test.ts` : la feuille ne paie pas Zod à l'exécution. */
const JEU = brut as JeuPhrases;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Les langues proposées, la première par défaut (`languesProposees`). */
  langues: readonly string[];
  /**
   * Les montants de l'écran, la devise d'abord, puis la seconde : celui de la
   * devise dont la langue choisie est relevée se dit au vendeur
   * (spécification 006, récit 1).
   */
  montants?: readonly { devise: string; montant: number | null }[];
}

/** Ce que la feuille montre en grand : une phrase, ou le montant. */
type Montre = IdPhrase | 'montant';

/**
 * Le montant dans la langue du vendeur, avec le nom de la devise dans cette
 * langue : « ١٥٠ جنيهًا مصريًا », « 150 บาทไทย ». Un prix rond se dit sans
 * centimes ; sinon, aux décimales de la devise.
 */
function prixDans(langue: string, devise: string, montant: number): string {
  const arrondi = arrondir(montant, decimalesDe(devise));
  const decimales = Number.isInteger(arrondi) ? 0 : decimalesDe(devise);
  return new Intl.NumberFormat(langue, {
    style: 'currency',
    currency: devise,
    currencyDisplay: 'name',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(arrondi);
}

/**
 * Les mots utiles du pays (spécification 004) : seize phrases pour saluer,
 * marchander, faire la monnaie et demander l'addition, dans la langue du pays
 * de la devise, avec leur sens dans celle de l'application.
 *
 * Chaque phrase porte sa langue (`lang`) et son sens d'écriture (`dir`) : un
 * lecteur d'écran la prononce avec la bonne voix, et l'arabe s'écrit de droite
 * à gauche. Touchée, elle s'affiche en grand, pour être montrée (R4).
 *
 * « Écouter » la fait dire par la synthèse vocale de l'appareil, quand il a
 * une voix pour la langue (spécification 005, récit 2) ; sinon, la feuille le
 * dit, sans bouton qui ne ferait rien.
 */
export function MotsUtiles({ open, onClose, langues, montants = [] }: Props) {
  const { t, locale } = useI18n();
  const [choisie, setChoisie] = useState(langues[0] ?? '');
  const [montree, setMontree] = useState<Montre | null>(null);
  const grande = useRef<HTMLDivElement>(null);
  const derniere = useRef<Montre | null>(null);
  const liste = useRef<HTMLDivElement>(null);
  const voixDeLAppareil = useVoix();
  // La phrase en cours de lecture : son bouton dit « Arrêter ».
  const [dite, setDite] = useState<Montre | null>(null);

  // La langue choisie n'existe plus (autre devise) : la première revient.
  const code = langues.includes(choisie) ? choisie : (langues[0] ?? '');
  const langue = JEU.langues[code];
  // `null` tant que la liste des voix n'est pas arrivée : ni bouton, ni avis.
  const voix = voixDeLAppareil ? choisirVoix(code, voixDeLAppareil) : null;
  const nom = useMemo(() => {
    const noms = new Intl.DisplayNames([locale], { type: 'language' });
    return (c: string) => noms.of(c) ?? c;
  }, [locale]);

  // En grand : le focus sur la phrase. Revenu à la liste : sur le bouton
  // qui l'avait ouverte.
  useEffect(() => {
    if (montree) {
      grande.current?.focus();
    } else if (derniere.current) {
      liste.current
        ?.querySelector<HTMLButtonElement>(
          `[data-phrase="${derniere.current}"]`
        )
        ?.focus();
    }
  }, [montree]);

  // Une autre langue, ou la feuille fermée : la lecture s'arrête.
  useEffect(
    () => () => {
      if (typeof speechSynthesis !== 'undefined') arreter();
    },
    [code]
  );

  const fermer = () => {
    setMontree(null);
    derniere.current = null;
    onClose();
  };

  if (!langue) return null;

  // Le montant de la devise dont cette langue est relevée, s'il y en a un.
  const montantDeLaLangue = montants.find(
    m =>
      m.montant !== null &&
      m.montant > 0 &&
      LANGUES_DES_DEVISES[m.devise]?.includes(code)
  );
  const prix =
    montantDeLaLangue && montantDeLaLangue.montant !== null
      ? {
          texte: prixDans(
            code,
            montantDeLaLangue.devise,
            montantDeLaLangue.montant
          ),
          clair: formaterCoupure(
            arrondir(
              montantDeLaLangue.montant,
              decimalesDe(montantDeLaLangue.devise)
            ),
            montantDeLaLangue.devise,
            locale
          ),
        }
      : null;

  const phrase =
    montree === 'montant'
      ? prix && { texte: prix.texte, latin: prix.clair }
      : montree
        ? langue.phrases[montree]
        : null;
  const sensDe = (m: Montre) =>
    m === 'montant' ? t('phrases.montant') : t(`phrases.sens.${m}`);

  const ecouter = (id: Montre) => {
    const texte = id === 'montant' ? prix?.texte : langue.phrases[id]?.texte;
    if (!voix || !texte) return;
    if (dite === id) {
      arreter();
      setDite(null);
      return;
    }
    setDite(id);
    dire(texte, code, voix, () => setDite(d => (d === id ? null : d)));
  };
  const icone = (id: Montre) =>
    dite === id ? (
      <Square aria-hidden="true" className="size-4" />
    ) : (
      <Volume2 aria-hidden="true" className="size-5" />
    );

  return (
    <Sheet open={open} title={t('phrases.titre')} onClose={fermer}>
      {langues.length > 1 ? (
        <SegmentedControl
          size="sm"
          fullWidth
          ariaLabel={t('phrases.langue')}
          value={code}
          onChange={c => {
            setChoisie(c);
            setMontree(null);
            derniere.current = null;
          }}
          options={langues.map(c => ({ value: c, label: nom(c) }))}
        />
      ) : (
        <p className="m-0 font-semibold">
          {t('phrases.enLangue', { langue: nom(code) })}
        </p>
      )}
      {voixDeLAppareil !== null && !voix && (
        <p
          className="m-0 mt-2 text-sm"
          style={{ color: 'var(--dwc-text-soft)' }}
        >
          {t('phrases.sansVoix', { langue: nom(code) })}
        </p>
      )}

      {montree && phrase ? (
        <div
          ref={grande}
          tabIndex={-1}
          role="region"
          aria-label={sensDe(montree)}
          className="mt-4 flex flex-col items-center gap-3 text-center outline-none"
        >
          <p
            lang={code}
            dir={langue.direction}
            className="m-0 text-5xl leading-tight font-bold break-words"
          >
            {phrase.texte}
          </p>
          {phrase.latin && (
            <p
              className="m-0 text-xl"
              style={{ color: 'var(--dwc-text-soft)' }}
            >
              {phrase.latin}
            </p>
          )}
          <p className="m-0">{sensDe(montree)}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {voix && (
              <Button onClick={() => ecouter(montree)}>
                {icone(montree)}
                {dite === montree ? t('phrases.arreter') : t('phrases.ecouter')}
              </Button>
            )}
            <Button variant="outline" onClick={() => setMontree(null)}>
              {t('phrases.retour')}
            </Button>
          </div>
        </div>
      ) : (
        <div ref={liste}>
          {prix && (
            <section
              aria-label={t('phrases.montant')}
              className="mt-3 flex items-center gap-1 rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--dwc-border-strong)' }}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  {t('phrases.montant')}
                </span>
                <span
                  lang={code}
                  dir={langue.direction}
                  className="text-lg font-semibold break-words"
                >
                  {prix.texte}
                </span>
                <span
                  className="text-sm tabular-nums"
                  style={{ color: 'var(--dwc-text-soft)' }}
                >
                  {prix.clair}
                </span>
              </div>
              {voix && (
                <button
                  type="button"
                  onClick={() => ecouter('montant')}
                  aria-label={
                    dite === 'montant'
                      ? t('phrases.arreter')
                      : t('phrases.ecouterMontant')
                  }
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg border"
                  style={{ borderColor: 'var(--dwc-border)' }}
                >
                  {icone('montant')}
                </button>
              )}
              <button
                type="button"
                data-phrase="montant"
                onClick={() => {
                  derniere.current = 'montant';
                  setMontree('montant');
                }}
                aria-label={t('phrases.montrerMontant')}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg border"
                style={{ borderColor: 'var(--dwc-border)' }}
              >
                <Maximize2 aria-hidden="true" className="size-4" />
              </button>
            </section>
          )}
          <p
            className="m-0 mt-2 text-sm"
            style={{ color: 'var(--dwc-text-soft)' }}
          >
            {t('phrases.consigne')}
          </p>
          {GROUPES.map(groupe => (
            <section key={groupe} className="mt-4">
              <h3 className="m-0 mb-1 text-sm font-semibold">
                {t(`phrases.groupes.${groupe}`)}
              </h3>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {JEU.categories[groupe]?.map(id => {
                  const p = langue.phrases[id];
                  if (!p) return null;
                  return (
                    <li key={id} className="flex items-stretch gap-1">
                      <button
                        type="button"
                        data-phrase={id}
                        onClick={() => {
                          derniere.current = id;
                          setMontree(id);
                        }}
                        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left"
                        style={{ borderColor: 'var(--dwc-border)' }}
                      >
                        <span
                          lang={code}
                          dir={langue.direction}
                          className="w-full text-lg font-semibold break-words"
                          style={{
                            textAlign: langue.direction ? 'right' : undefined,
                          }}
                        >
                          {p.texte}
                        </span>
                        {p.latin && (
                          <span
                            className="text-sm"
                            style={{ color: 'var(--dwc-text-soft)' }}
                          >
                            {p.latin}
                          </span>
                        )}
                        <span className="text-sm">
                          {t(`phrases.sens.${id}`)}
                        </span>
                      </button>
                      {voix && (
                        <button
                          type="button"
                          onClick={() => ecouter(id)}
                          aria-label={t(
                            dite === id
                              ? 'phrases.arreterPhrase'
                              : 'phrases.ecouterPhrase',
                            { sens: t(`phrases.sens.${id}`) }
                          )}
                          className="flex w-11 shrink-0 items-center justify-center rounded-lg border"
                          style={{ borderColor: 'var(--dwc-border)' }}
                        >
                          {icone(id)}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Sheet>
  );
}

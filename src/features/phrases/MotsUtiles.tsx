import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { Sheet } from '@mister-guiiug/dev-pwa-config/react/sheet';
import { SegmentedControl } from '@mister-guiiug/dev-pwa-config/react/segmented-control';
import { useI18n } from '../../i18n/index.ts';
import brut from '../../data/phrases.json';
import { GROUPES, type IdPhrase, type JeuPhrases } from '../../data/phrases.ts';

/** Vérifié par `phrases.test.ts` : la feuille ne paie pas Zod à l'exécution. */
const JEU = brut as JeuPhrases;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Les langues proposées, la première par défaut (`languesProposees`). */
  langues: readonly string[];
}

/**
 * Les mots utiles du pays (spécification 004) : seize phrases pour saluer,
 * marchander, faire la monnaie et demander l'addition, dans la langue du pays
 * de la devise, avec leur sens dans celle de l'application.
 *
 * Chaque phrase porte sa langue (`lang`) et son sens d'écriture (`dir`) : un
 * lecteur d'écran la prononce avec la bonne voix, et l'arabe s'écrit de droite
 * à gauche. Touchée, elle s'affiche en grand, pour être montrée (R4).
 */
export function MotsUtiles({ open, onClose, langues }: Props) {
  const { t, locale } = useI18n();
  const [choisie, setChoisie] = useState(langues[0] ?? '');
  const [montree, setMontree] = useState<IdPhrase | null>(null);
  const grande = useRef<HTMLDivElement>(null);
  const derniere = useRef<IdPhrase | null>(null);
  const liste = useRef<HTMLDivElement>(null);

  // La langue choisie n'existe plus (autre devise) : la première revient.
  const code = langues.includes(choisie) ? choisie : (langues[0] ?? '');
  const langue = JEU.langues[code];
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

  const fermer = () => {
    setMontree(null);
    derniere.current = null;
    onClose();
  };

  if (!langue) return null;
  const phrase = montree ? langue.phrases[montree] : null;

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

      {montree && phrase ? (
        <div
          ref={grande}
          tabIndex={-1}
          role="region"
          aria-label={t(`phrases.sens.${montree}`)}
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
          <p className="m-0">{t(`phrases.sens.${montree}`)}</p>
          <Button variant="outline" onClick={() => setMontree(null)}>
            {t('phrases.retour')}
          </Button>
        </div>
      ) : (
        <div ref={liste}>
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
                    <li key={id}>
                      <button
                        type="button"
                        data-phrase={id}
                        onClick={() => {
                          derniere.current = id;
                          setMontree(id);
                        }}
                        className="flex w-full flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left"
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

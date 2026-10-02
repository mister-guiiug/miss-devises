import { useEffect, useId, useRef } from 'react';
import {
  ExternalLink,
  Image as IconePhoto,
  ImageOff as IconeSansPhoto,
} from 'lucide-react';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { useI18n } from '../../i18n/index.ts';

interface Props {
  /** Les coupures de la devise montrée qui ont une photo. */
  compte: number;
  /** Toutes ses coupures. */
  total: number;
  /** Le mode photos est choisi (préférence de l'appareil). */
  actif: boolean;
  /** L'avis sur Wikimedia est ouvert, en attente de réponse. */
  avisOuvert: boolean;
  /** L'article Wikipédia (en anglais) de la devise montrée, s'il est relevé. */
  wikipedia?: string | undefined;
  /** Un geste sur l'interrupteur. */
  onBasculer: () => void;
  onAccepter: () => void;
  onRefuser: () => void;
}

/**
 * LA BASCULE DES PHOTOS (spécification 002, récit 3) : une rangée « Vraies
 * photos » et son interrupteur, sous la bascule du sens.
 *
 * Elle remplace une seconde bascule à deux segments, de même allure que celle
 * du sens : on les confondait, et rien ne disait s'il y avait des photos à
 * voir avant d'avoir basculé. La rangée le dit d'avance (« 13 sur 15
 * coupures »), et quand la devise n'en a aucune, l'interrupteur est grisé et
 * dit pourquoi. S'il est déjà en mode photos, il reste actif : il faut pouvoir
 * en sortir.
 *
 * L'AVIS S'OUVRE DANS LA RANGÉE, au premier passage : ce que Wikimedia voit,
 * avant toute requête (EF-010). Le focus va au bouton qui l'accepte, et
 * revient à l'interrupteur si on garde les dessins.
 *
 * LES COUPURES RESTÉES DESSINÉES ONT LEUR LIEN, vers l'article Wikipédia de la
 * devise : les billets égyptiens, que le Code pénal égyptien interdit de
 * publier en image sans licence, s'y voient sans que l'application en publie
 * une. L'article est en anglais (l'édition qui admet les images non libres),
 * et le lien le dit.
 */
export function BasculePhotos({
  compte,
  total,
  actif,
  avisOuvert,
  wikipedia,
  onBasculer,
  onAccepter,
  onRefuser,
}: Props) {
  const { t } = useI18n();
  const idTitre = useId();
  const idDetail = useId();
  const idAvis = useId();
  const interrupteur = useRef<HTMLButtonElement>(null);
  const reponses = useRef<HTMLDivElement>(null);
  const sansPhoto = compte === 0;
  const inactif = sansPhoto && !actif;

  useEffect(() => {
    if (avisOuvert) reponses.current?.querySelector('button')?.focus();
  }, [avisOuvert]);

  const Icone = sansPhoto ? IconeSansPhoto : IconePhoto;

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border px-3 py-1"
      style={{
        borderColor: 'var(--dwc-border)',
        background: 'var(--dwc-surface-2)',
      }}
    >
      <div className="flex items-center gap-3">
        <Icone
          aria-hidden="true"
          className="size-5 shrink-0"
          style={{ color: 'var(--dwc-text-soft)' }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span id={idTitre} className="text-sm font-semibold">
            {t('money.vraiesPhotos')}
          </span>
          <span
            id={idDetail}
            className="text-xs"
            style={{ color: 'var(--dwc-text-soft)' }}
          >
            {sansPhoto
              ? t('money.aucunePhoto')
              : t('money.photosDisponibles', { count: compte, total })}
          </span>
          {wikipedia && compte < total && (
            <a
              href={wikipedia}
              target="_blank"
              rel="noreferrer"
              hrefLang="en"
              className="self-start py-1 text-xs underline"
              style={{ color: 'var(--dwc-text-soft)' }}
            >
              {t('money.wikipedia')}
              {/* Dans le fil du texte, pas en élément de grille : replié, le
                  texte garderait l'icône au bout de sa dernière ligne. */}
              <ExternalLink
                aria-hidden="true"
                className="ms-1 inline-block size-3 align-[-1px]"
              />
              <span className="sr-only">{t('money.nouvelOnglet')}</span>
            </a>
          )}
        </div>
        <button
          ref={interrupteur}
          type="button"
          role="switch"
          aria-checked={actif}
          aria-labelledby={idTitre}
          aria-describedby={idDetail}
          aria-disabled={inactif || undefined}
          aria-controls={avisOuvert ? idAvis : undefined}
          onClick={() => {
            if (!inactif) onBasculer();
          }}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full"
          data-interrupteur={actif ? 'oui' : 'non'}
        >
          {/* La piste et sa pastille : la couleur n'est pas seule à parler,
              la pastille change de côté. Éteinte, la piste doit se voir sur
              la rangée (3:1, WCAG 1.4.11) : c'est le contour d'un contrôle,
              `--dwc-border-strong`, que `src/palette.test.ts` mesure.
              La pastille prend la couleur qui contraste avec sa piste dans
              les deux thèmes, pas un blanc en dur : sur l'or du thème
              sombre, un blanc ne se distingue presque plus. */}
          <span
            aria-hidden="true"
            className="relative block h-6 w-10 rounded-full transition-colors"
            style={{
              background: actif
                ? 'var(--dwc-primary)'
                : 'var(--dwc-border-strong)',
              opacity: inactif ? 0.5 : 1,
            }}
          >
            <span
              className="absolute top-0.5 block size-5 rounded-full shadow transition-[left]"
              style={{
                left: actif ? 18 : 2,
                background: actif
                  ? 'var(--dwc-primary-contrast)'
                  : 'var(--dwc-surface)',
              }}
            />
          </span>
        </button>
      </div>
      {avisOuvert && (
        <section
          id={idAvis}
          aria-labelledby={`${idAvis}-titre`}
          className="flex flex-col gap-2 border-t pt-2 pb-2 text-sm"
          style={{ borderColor: 'var(--dwc-border)' }}
        >
          <h3 id={`${idAvis}-titre`} className="m-0 text-sm font-semibold">
            {t('money.avisTitre')}
          </h3>
          <p className="m-0">{t('money.avis')}</p>
          <div ref={reponses} className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onAccepter}>
              {t('money.avisAfficher')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onRefuser();
                interrupteur.current?.focus();
              }}
            >
              {t('money.avisGarder')}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

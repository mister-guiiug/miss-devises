import { useState, type PointerEvent } from 'react';
import { project, toPolyline } from '@mister-guiiug/dev-pwa-config/sparkline';
import { useI18n } from '../../i18n/index.ts';
import type { Point } from '../../domain/history.ts';
import {
  formaterCoupure,
  formaterDate,
  formaterTaux,
} from '../../domain/money.ts';

interface Props {
  /** Les taux de la paire, triés par date. */
  points: readonly Point[];
  reference: string;
  devise: string;
  /** L'alternative textuelle de la courbe entière. */
  description: string;
}

const LARGEUR = 320;
const HAUTEUR = 150;
const MARGE = 8;

/** Le fond des étiquettes posées sur la courbe : lisible, sans la cacher. */
const ETIQUETTE = {
  background: 'color-mix(in srgb, var(--dwc-surface) 85%, transparent)',
  color: 'var(--dwc-text-soft)',
};

/**
 * La courbe d'un taux (001, recherche R7), qui se lit point par point
 * (spécification 002, récit 5, recherche R7) : la géométrie `sparkline` du
 * socle, dessinée en grand ; ses axes en texte (plus haut et plus bas sur la
 * courbe, première et dernière date dessous) ; et un curseur natif, sous la
 * courbe, qui parcourt les points au doigt, à la souris et au clavier.
 *
 * LE CURSEUR PORTE LA LECTURE : son `aria-valuetext` dit la date et le taux,
 * et un lecteur d'écran l'annonce à chaque pas. Le SVG reste muet ; le
 * pointeur posé dessus déplace le même curseur. La lecture écrite au-dessus
 * est pour l'œil, cachée au lecteur d'écran qui l'entend déjà.
 *
 * Mise à l'échelle UNIFORME (`w-full h-auto`) : une déformation au rapport de
 * l'écran étirerait le point du jour en ellipse.
 */
export function Courbe({ points, reference, devise, description }: Props) {
  const { t, locale } = useI18n();
  const dernier = points.length - 1;
  const [index, setIndex] = useState(dernier);
  const choisi = Math.min(Math.max(index, 0), dernier);
  const geo = project(
    points.map(point => point.taux),
    { width: LARGEUR, height: HAUTEUR, padding: MARGE }
  );

  const taux = (valeur: number) => `${formaterTaux(valeur, locale)} ${devise}`;
  const lire = (i: number) => {
    const point = points[i];
    if (!point) return '';
    return t('history.point', {
      date: formaterDate(point.date, locale),
      un: formaterCoupure(1, reference, locale),
      taux: taux(point.taux),
    });
  };
  const valeurs = points.map(point => point.taux);
  const plusHaut = Math.max(...valeurs);
  const plusBas = Math.min(...valeurs);
  const marque = geo.points[choisi];

  /** Le point le plus proche du pointeur, en abscisse. */
  const suivre = (event: PointerEvent<SVGSVGElement>) => {
    const cadre = event.currentTarget.getBoundingClientRect();
    if (cadre.width === 0 || geo.points.length === 0) return;
    const x = ((event.clientX - cadre.left) / cadre.width) * LARGEUR;
    let proche = 0;
    geo.points.forEach((point, i) => {
      const meilleur = geo.points[proche];
      if (meilleur && Math.abs(point.x - x) < Math.abs(meilleur.x - x)) {
        proche = i;
      }
    });
    setIndex(proche);
  };

  return (
    <figure className="m-0 flex flex-col gap-1">
      <p
        aria-hidden="true"
        data-testid="courbe-lecture"
        className="m-0 text-sm font-semibold"
      >
        {lire(choisi)}
      </p>
      <div data-testid="courbe-axes" className="flex flex-col gap-1">
        <div className="relative">
          <svg
            viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
            className="block h-auto w-full touch-none"
            aria-hidden="true"
            focusable="false"
            style={{ color: 'var(--dwc-primary)' }}
            onPointerDown={event => {
              event.currentTarget.setPointerCapture(event.pointerId);
              suivre(event);
            }}
            onPointerMove={event => {
              if (event.pointerType === 'mouse' || event.buttons > 0) {
                suivre(event);
              }
            }}
          >
            {/* Les repères du plus haut et du plus bas, sous leurs étiquettes. */}
            {[MARGE, HAUTEUR - MARGE].map(y => (
              <line
                key={y}
                x1="0"
                x2={LARGEUR}
                y1={y}
                y2={y}
                stroke="var(--dwc-border)"
                strokeDasharray="4 4"
              />
            ))}
            {geo.segments.map((segment, i) =>
              segment.length === 1 && segment[0] ? (
                <circle
                  key={i}
                  cx={segment[0].x}
                  cy={segment[0].y}
                  r="2"
                  fill="currentColor"
                />
              ) : (
                <polyline
                  key={i}
                  points={toPolyline(segment)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )
            )}
            {geo.last && (
              <circle
                cx={geo.last.x}
                cy={geo.last.y}
                r="4"
                fill="currentColor"
                data-courbe="aujourdhui"
              />
            )}
            {marque && (
              <>
                <line
                  x1={marque.x}
                  x2={marque.x}
                  y1="0"
                  y2={HAUTEUR}
                  stroke="currentColor"
                  strokeOpacity="0.4"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={marque.x}
                  cy={marque.y}
                  r="5"
                  fill="var(--dwc-surface)"
                  stroke="currentColor"
                  strokeWidth="2"
                  data-courbe="curseur"
                />
              </>
            )}
          </svg>
          <span
            className="pointer-events-none absolute top-0 left-0 rounded px-1 text-xs"
            style={ETIQUETTE}
          >
            {taux(plusHaut)}
          </span>
          <span
            className="pointer-events-none absolute bottom-0 left-0 rounded px-1 text-xs"
            style={ETIQUETTE}
          >
            {taux(plusBas)}
          </span>
        </div>
        <div
          className="flex justify-between gap-2 text-xs"
          style={{ color: 'var(--dwc-text-soft)' }}
        >
          <span>{points[0] && formaterDate(points[0].date, locale)}</span>
          <span>
            {points[dernier] && formaterDate(points[dernier].date, locale)}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(dernier, 0)}
        step={1}
        value={choisi}
        onChange={event => setIndex(Number(event.target.value))}
        aria-label={t('history.curseur')}
        aria-valuetext={lire(choisi)}
        className="min-h-11 w-full"
        style={{ accentColor: 'var(--dwc-primary)' }}
      />
      <figcaption className="sr-only">{description}</figcaption>
    </figure>
  );
}

import { project, toPolyline } from '@mister-guiiug/dev-pwa-config/sparkline';

interface Props {
  valeurs: readonly number[];
  /** L'alternative textuelle : la courbe elle-même est muette. */
  description: string;
}

const LARGEUR = 320;
const HAUTEUR = 140;

/**
 * La courbe d'un taux (recherche R7) : la géométrie `sparkline` du socle,
 * dessinée en grand. Mise à l'échelle UNIFORME (`w-full h-auto`) : une
 * déformation au rapport de l'écran étirerait le point du jour en ellipse.
 */
export function Courbe({ valeurs, description }: Props) {
  const geo = project(valeurs, {
    width: LARGEUR,
    height: HAUTEUR,
    padding: 6,
  });
  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        className="block h-auto w-full"
        aria-hidden="true"
        focusable="false"
        style={{ color: 'var(--dwc-primary)' }}
      >
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
      </svg>
      <figcaption className="sr-only">{description}</figcaption>
    </figure>
  );
}

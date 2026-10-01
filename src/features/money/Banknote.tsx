import { encreSur } from '../../domain/contraste.ts';

interface Props {
  /** Couleur dominante du billet, `#rrggbb`. */
  couleur: string;
  /** La valeur écrite au centre, déjà formatée : « 200 ». */
  texte: string;
  code: string;
  largeurMm?: number;
  hauteurMm?: number;
  /** Largeur dessinée, en pixels CSS. */
  largeur: number;
  /**
   * Le nom lu par un lecteur d'écran : la valeur et son équivalent. Sans
   * lui, le dessin est décoratif : le texte voisin dit déjà tout.
   */
  libelle?: string;
  plusEmis?: boolean;
}

/** Sans dimensions connues, un rectangle de 2 pour 1. */
const RAPPORT_PAR_DEFAUT = 0.5;
/** Largeur du repère interne : le dessin se met à l'échelle par `viewBox`. */
const L = 200;

/**
 * Un billet STYLISÉ, jamais reproduit (recherche R6) : un rectangle arrondi
 * aux proportions réelles du billet, à sa couleur dominante, avec la valeur
 * et le code. L'encre, noire ou blanche, est celle qui contraste le plus.
 */
export function Banknote({
  couleur,
  texte,
  code,
  largeurMm,
  hauteurMm,
  largeur,
  libelle,
  plusEmis = false,
}: Props) {
  const rapport =
    largeurMm && hauteurMm ? hauteurMm / largeurMm : RAPPORT_PAR_DEFAUT;
  const h = L * rapport;
  const encre = encreSur(couleur);
  // La valeur tient dans le billet, même à six chiffres (100 000 IDR).
  const taille = Math.min(h * 0.42, (L - 48) / (texte.length * 0.62));

  return (
    <svg
      {...(libelle
        ? { role: 'img', 'aria-label': libelle }
        : { 'aria-hidden': true })}
      width={largeur}
      height={largeur * rapport}
      viewBox={`0 0 ${L} ${h}`}
      data-plus-emis={plusEmis ? 'true' : undefined}
      className="shrink-0"
    >
      <rect
        x="1"
        y="1"
        width={L - 2}
        height={h - 2}
        rx="10"
        fill={couleur}
        stroke={encre}
        strokeOpacity={plusEmis ? 0.6 : 0.2}
        strokeWidth="2"
        strokeDasharray={plusEmis ? '10 6' : undefined}
      />
      <rect
        x="10"
        y="10"
        width={L - 20}
        height={h - 20}
        rx="6"
        fill="none"
        stroke={encre}
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <text
        x={L / 2}
        y={h / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fill={encre}
        fontSize={taille}
        fontWeight="700"
      >
        {texte}
      </text>
      <text x="18" y="28" fill={encre} fontSize="15" fontWeight="600">
        {code}
      </text>
    </svg>
  );
}

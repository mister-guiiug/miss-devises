import { encreSur } from '../../domain/contraste.ts';
import { PARTIES, type Metal } from './metaux.ts';

interface Props {
  metal: Metal;
  /** La valeur écrite sur la pièce, déjà formatée : « 0,50 ». */
  texte: string;
  /** Diamètre dessiné, en pixels CSS. */
  diametre: number;
  libelle: string;
  plusEmis?: boolean;
}

/** Une pièce STYLISÉE : un disque à son diamètre relatif, d'une teinte par métal. */
export function Coin({
  metal,
  texte,
  diametre,
  libelle,
  plusEmis = false,
}: Props) {
  const { centre, anneau } = PARTIES[metal];
  const encre = encreSur(centre);
  const rayonCentre = anneau ? 33 : 49;
  const taille = Math.min(30, (rayonCentre * 1.7) / (texte.length * 0.6));

  return (
    <svg
      role="img"
      aria-label={libelle}
      width={diametre}
      height={diametre}
      viewBox="0 0 100 100"
      data-plus-emis={plusEmis ? 'true' : undefined}
      className="shrink-0"
    >
      {anneau && (
        <circle
          cx="50"
          cy="50"
          r="49"
          fill={anneau}
          stroke={encreSur(anneau)}
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />
      )}
      <circle
        cx="50"
        cy="50"
        r={rayonCentre}
        fill={centre}
        stroke={encre}
        strokeOpacity={plusEmis ? 0.6 : 0.25}
        strokeWidth="1.5"
        strokeDasharray={plusEmis ? '6 4' : undefined}
      />
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fill={encre}
        fontSize={taille}
        fontWeight="700"
      >
        {texte}
      </text>
    </svg>
  );
}

import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Photo } from '../../data/photos.ts';

interface Props {
  photo: Photo;
  forme: 'billet' | 'piece';
  /** Largeur affichée, en pixels CSS : celle du dessin qu'elle remplace. */
  largeur: number;
  /** Le dessin, qui revient si la photo ne se charge pas. */
  repli: ReactNode;
}

/**
 * La photo d'une coupure (spécification 002, récit 3), à la place de son
 * dessin et à sa taille : réduite, d'une seule face (constitution, principe
 * III).
 *
 * CE QUI PART CHEZ WIKIMEDIA EST RÉDUIT AU MINIMUM : `referrerPolicy`
 * `no-referrer` ne dit pas d'où vient la demande, et `crossOrigin` en mode
 * anonyme n'envoie aucun cookie et n'en garde aucun. Commons répond
 * `Access-Control-Allow-Origin: *` : la réponse n'est pas opaque, et le
 * service worker la garde sans la gonfler (une réponse opaque compte pour
 * plusieurs mégaoctets dans le quota du navigateur).
 *
 * MUETTE, COMME LE DESSIN : le bouton qui la porte dit la coupure et sa
 * contre-valeur ; un lecteur d'écran n'a pas à entendre un nom de fichier.
 *
 * Un fichier retiré de Commons, renommé ou injoignable rend son dessin, sans
 * message : la coupure reste lisible.
 */
export function PhotoCoupure({ photo, forme, largeur, repli }: Props) {
  const [echec, setEchec] = useState(false);
  if (echec) return <>{repli}</>;

  // Un billet vertical (9e série suisse) tourne d'un quart pour prendre la
  // place d'un billet couché ; une pièce tient dans un carré.
  const vertical = forme === 'billet' && photo.hauteur > photo.largeur;
  const rapport = vertical
    ? photo.largeur / photo.hauteur
    : photo.hauteur / photo.largeur;
  const hauteur = forme === 'piece' ? largeur : Math.round(largeur * rapport);

  const image = (style: CSSProperties) => (
    <img
      src={photo.vignette}
      alt=""
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setEchec(true)}
      data-photo={photo.fichier}
      style={style}
    />
  );

  if (vertical) {
    return (
      <span
        aria-hidden="true"
        className="relative block shrink-0 overflow-hidden rounded-[4px]"
        style={{ width: largeur, height: hauteur }}
      >
        {image({
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: hauteur,
          height: largeur,
          maxWidth: 'none',
          transform: 'translate(-50%, -50%) rotate(-90deg)',
        })}
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="block shrink-0">
      {image({
        display: 'block',
        width: largeur,
        height: hauteur,
        objectFit: 'contain',
        borderRadius: forme === 'billet' ? 4 : undefined,
      })}
    </span>
  );
}

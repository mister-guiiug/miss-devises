import { Globe } from 'lucide-react';
import { cn } from '@mister-guiiug/dev-pwa-config/cn';
import { drapeauDe, paysDe } from '../domain/drapeaux.ts';

interface Props {
  /** Le code ISO 4217 de la devise. */
  code: string;
  /** Hauteur en pixels CSS ; la largeur suit le rapport 3 : 2. */
  hauteur?: number;
  className?: string;
}

/**
 * Le drapeau d'une devise (spécification 002, récit 2).
 *
 * DÉCORATIF, TOUJOURS : le code et le nom de la devise sont écrits à côté, et
 * un lecteur d'écran qui annoncerait aussi « drapeau de l'Égypte » dirait deux
 * fois la même chose. D'où `alt=""` et `aria-hidden`.
 *
 * LE LISERÉ N'EST PAS UNE COQUETTERIE : sans lui, le blanc du Japon ou de la
 * Pologne se perd dans une carte blanche. Il est tiré de la couleur du texte,
 * donc visible dans les deux thèmes.
 *
 * Une devise de plusieurs pays (franc CFA, franc CFP…) montre un globe, à la
 * même place et à la même taille : la liste reste alignée.
 */
export function Drapeau({ code, hauteur = 16, className }: Props) {
  const url = drapeauDe(code);
  const largeur = Math.round(hauteur * 1.5);
  const cadre = {
    width: largeur,
    height: hauteur,
    boxShadow: '0 0 0 1px color-mix(in srgb, var(--dwc-text) 22%, transparent)',
  };

  if (!url) {
    return (
      <span
        aria-hidden="true"
        data-drapeau="neutre"
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-[3px]',
          className
        )}
        style={{
          ...cadre,
          background: 'var(--dwc-surface-2)',
          color: 'var(--dwc-text-soft)',
        }}
      >
        <Globe style={{ width: hauteur * 0.75, height: hauteur * 0.75 }} />
      </span>
    );
  }

  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      width={largeur}
      height={hauteur}
      loading="lazy"
      decoding="async"
      data-drapeau={paysDe(code)}
      className={cn('shrink-0 rounded-[3px] object-cover', className)}
      style={cadre}
    />
  );
}

import type { MouseEvent } from 'react';
import { Delete } from 'lucide-react';
import { Button } from '@mister-guiiug/dev-pwa-config/react/button';
import { useI18n } from '../../i18n/index.ts';
import type { Touche } from '../../domain/calcul.ts';

interface Props {
  /** Le champ où le pavé écrit, nommé : « euros », « livres égyptiennes ». */
  cible: string;
  onTouche: (touche: Touche) => void;
  onEgal: () => void;
}

const RANGEES: Touche[][] = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['decimal', '0', 'retour', '+'],
];

const NOMS = {
  '+': 'plus',
  '−': 'moins',
  '×': 'fois',
  '÷': 'divise',
  decimal: 'virgule',
  retour: 'retour',
  effacer: 'effacer',
} as const;

/**
 * Le pavé de la mini-calculatrice (spécification 003, récit 2). Il remplace
 * le clavier du téléphone, qui n'a pas d'opérateurs : les champs passent en
 * `inputMode="none"`, et le pavé écrit dans le dernier qui a reçu le focus.
 *
 * LE CHAMP GARDE SON FOCUS. Une touche empêche la prise du focus à la souris
 * et au doigt (`mousedown`) : l'anneau du champ montre où le pavé écrit, et
 * le curseur y reste. Au clavier, les touches se parcourent comme des
 * boutons ; la ligne du haut dit le champ visé (recherche R3, R4).
 */
export function Pave({ cible, onTouche, onEgal }: Props) {
  const { t, locale } = useI18n();
  const garderLeFocus = (event: MouseEvent) => event.preventDefault();

  const separateur = locale === 'fr' ? ',' : '.';
  const affiche = (touche: Touche) =>
    touche === 'decimal' ? (
      separateur
    ) : touche === 'retour' ? (
      <Delete aria-hidden="true" className="size-5" />
    ) : (
      touche
    );
  const nom = (touche: Touche) =>
    touche in NOMS
      ? t(`convert.pave.${NOMS[touche as keyof typeof NOMS]}`)
      : undefined;
  // Les chiffres neutres, les opérateurs en couleur, « = » plein : la
  // disposition d'une calculatrice, où l'œil trouve l'opération d'abord.
  const variante = (touche: Touche) =>
    touche === '+' || touche === '−' || touche === '×' || touche === '÷'
      ? 'outline'
      : 'secondary';

  return (
    <div
      role="group"
      aria-label={t('convert.calculatrice')}
      className="flex flex-col gap-1.5"
    >
      <p className="m-0 text-sm" style={{ color: 'var(--dwc-text-soft)' }}>
        {t('convert.pave.cible', { nom: cible })}
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {RANGEES.flat().map(touche => (
          <Button
            key={touche}
            variant={variante(touche)}
            className="min-h-11 text-lg tabular-nums"
            aria-label={nom(touche)}
            onMouseDown={garderLeFocus}
            onClick={() => onTouche(touche)}
          >
            {affiche(touche)}
          </Button>
        ))}
        <Button
          variant="secondary"
          className="col-span-2 min-h-11 text-lg"
          aria-label={t('convert.pave.effacer')}
          onMouseDown={garderLeFocus}
          onClick={() => onTouche('effacer')}
        >
          C
        </Button>
        <Button
          variant="primary"
          className="col-span-2 min-h-11 text-lg"
          aria-label={t('convert.pave.egal')}
          onMouseDown={garderLeFocus}
          onClick={onEgal}
        >
          =
        </Button>
      </div>
    </div>
  );
}

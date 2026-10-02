import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/index.ts';
import { chargerCoupures } from '../../data/coupures.ts';
import { decomposer } from '../../domain/decompose.ts';
import { formaterValeur } from '../../domain/money.ts';

interface Props {
  montant: number | null;
  devise: string;
}

interface Charge {
  montant: number;
  devise: string;
  texte: string | null;
}

/**
 * Une ligne sous le taux : « 1 billet de 200 EGP ». Le volet reste là pour
 * les dessins et pour composer en touchant. Rien si le montant n'est pas
 * exactement une coupure.
 */
export function CompositionLigne({ montant, devise }: Props) {
  const { t, locale } = useI18n();
  const [charge, setCharge] = useState<Charge | null>(null);
  const actif = montant !== null && montant > 0;

  useEffect(() => {
    if (!actif || montant === null) return;
    let annule = false;
    void chargerCoupures().then(coupures => {
      if (annule) return;
      const systeme = coupures.devises[devise];
      const lignes = systeme ? decomposer(montant, systeme).lignes : [];
      const ligne = lignes.length === 1 ? lignes[0] : undefined;
      const cle =
        ligne?.nombre === 1
          ? ligne.type === 'billet'
            ? 'convert.unBillet'
            : 'convert.unePiece'
          : undefined;
      setCharge({
        montant,
        devise,
        texte:
          cle && ligne
            ? t(cle, {
                valeur: formaterValeur(ligne.valeur, devise, locale),
                code: devise,
              })
            : null,
      });
    });
    return () => {
      annule = true;
    };
  }, [actif, montant, devise, locale, t]);

  if (!actif || charge?.montant !== montant || charge.devise !== devise) {
    return null;
  }
  if (!charge.texte) return null;
  return <p className="m-0 text-sm">{charge.texte}</p>;
}

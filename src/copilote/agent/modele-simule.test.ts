import { describe, expect, it } from 'vitest';
import type { BlocEnvoye } from './protocole.ts';
import {
  decouper,
  lireDevise,
  lireMontant,
  repondre,
} from './modele-simule.ts';
import type { Outil, Requete } from './modele.ts';

const outil = (name: string): Outil => ({
  name,
  input_schema: { type: 'object' },
});
const OUTILS = ['convertir', 'appliquer_frais', 'noter_depense'].map(outil);

function requete(
  contenu: string | BlocEnvoye[],
  outils = OUTILS,
  contexte = ''
): Requete {
  return {
    systeme: '',
    contexte,
    outils,
    messages: [{ role: 'user', content: contenu }],
  };
}

describe('le modèle simulé lit quelques tournures', () => {
  it('lit un montant, espaces et virgule compris, sans prendre un pourcentage', () => {
    expect(lireMontant('un ramen à 1 200 yens')).toBe(1200);
    expect(lireMontant('2 % de frais sur 4,50 dollars')).toBe(4.5);
    expect(lireMontant('bonjour')).toBeNull();
  });

  it('lit une devise par son code ou par son nom', () => {
    expect(lireDevise('1200 JPY')).toBe('JPY');
    expect(lireDevise('200 livres égyptiennes')).toBe('EGP');
    expect(lireDevise('3 000 yens')).toBe('JPY');
    expect(lireDevise('bonjour')).toBeNull();
  });

  it('« note un taxi à 3000 yens » appelle noter_depense', () => {
    const blocs = repondre(requete('note un taxi à 3000 yens'));
    expect(blocs.filter(b => b.type === 'tool_use')).toEqual([
      expect.objectContaining({
        name: 'noter_depense',
        input: { libelle: 'taxi', montant: 3000, devise: 'JPY' },
      }),
    ]);
  });

  it('des frais et un montant : deux appels en parallèle, les frais d’abord', () => {
    const blocs = repondre(requete('un café à 4,50 dollars avec 2 % de frais'));
    expect(blocs.map(b => b.type)).toEqual([
      'thinking',
      'text',
      'tool_use',
      'tool_use',
    ]);
    expect(
      blocs.filter(b => b.type === 'tool_use').map(b => [b.name, b.input])
    ).toEqual([
      ['appliquer_frais', { libelle: 'Carte', pourcentage: 2 }],
      ['convertir', { montant: 4.5, devise: 'USD' }],
    ]);
  });

  it('lit le résultat de l’outil et répond avec le montant de l’application', () => {
    const blocs = repondre({
      systeme: '',
      contexte: '',
      outils: OUTILS,
      messages: [
        { role: 'user', content: '1200 JPY' },
        {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 't1', name: 'convertir', input: {} },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 't1',
              content: JSON.stringify({
                ok: true,
                saisi: '1 200 JPY',
                resultats: [
                  { texte: '7,39 €', source: 'BCE', date: '06/11/2026' },
                ],
              }),
            },
          ],
        },
      ],
    });
    expect(blocs).toEqual([
      expect.objectContaining({
        type: 'text',
        text: 'D’après l’application : 1 200 JPY font 7,39 € (taux BCE, 06/11/2026).',
      }),
    ]);
  });

  it('lit le total dans le contexte, sans additionner', () => {
    const blocs = repondre(
      requete(
        'combien ai-je dépensé ?',
        OUTILS,
        '- Dépenses : {"totalTexte":"25,10 €"}'
      )
    );
    expect(blocs).toEqual([
      expect.objectContaining({
        text: 'D’après l’application, vos dépenses notées font 25,10 €.',
      }),
    ]);
  });

  it('une image : il dit qu’il ne la lit pas ; un outil absent : il le dit', () => {
    const image = repondre(
      requete([
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: 'AAAA' },
        },
      ])
    );
    expect(image[0]).toMatchObject({
      type: 'text',
      text: expect.stringContaining('je ne lis pas les images'),
    });
    const sansOutil = repondre(requete('1200 JPY', [outil('noter_depense')]));
    expect(sansOutil[0]).toMatchObject({
      text: 'L’outil « convertir » n’est pas disponible.',
    });
  });

  it('découpe comme le SDK : les morceaux de JSON recomposent l’entrée de l’outil', () => {
    const flux = [
      ...decouper([
        {
          type: 'tool_use',
          id: 't1',
          name: 'convertir',
          input: { montant: 1200, devise: 'JPY' },
        },
      ]),
    ];
    expect(flux[0]).toMatchObject({
      type: 'content_block_start',
      content_block: { type: 'tool_use', input: {} },
    });
    expect(flux.at(-1)).toEqual({ type: 'content_block_stop', index: 0 });
    const json = flux
      .map(e =>
        e.type === 'content_block_delta' && e.delta.type === 'input_json_delta'
          ? e.delta.partial_json
          : ''
      )
      .join('');
    expect(JSON.parse(json)).toEqual({ montant: 1200, devise: 'JPY' });
  });
});

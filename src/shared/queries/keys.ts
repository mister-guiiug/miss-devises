/** Clés de cache TanStack Query — source unique pour invalidation. */
export const queryKeys = {
  tauxJour: () => ['taux', 'jour'] as const,
  serie: (reference: string, code: string, periode: string) =>
    ['taux', 'serie', reference, code, periode] as const,
} as const;

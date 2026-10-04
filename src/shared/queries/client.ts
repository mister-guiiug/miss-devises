import { QueryClient } from '@tanstack/react-query';
import { UNE_HEURE } from '../../rates/store.ts';

function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: UNE_HEURE,
        gcTime: UNE_HEURE,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
    },
  });
}

let client: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  client ??= createAppQueryClient();
  return client;
}

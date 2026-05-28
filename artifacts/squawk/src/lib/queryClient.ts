import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchIntervalInBackground: true,
      refetchInterval: 15_000,
      staleTime: 10 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

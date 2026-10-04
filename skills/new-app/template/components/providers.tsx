"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * The read path is server-rendered, so TanStack Query is deliberately scoped to
 * two jobs: mutations (Server Actions, for pending/error/optimistic state) and
 * genuinely client-driven reads like a typeahead. Nothing here prefetches or
 * hydrates server-component data — that would duplicate state for no benefit.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

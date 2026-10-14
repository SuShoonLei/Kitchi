"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { getDeviceId } from "@/lib/device";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1 },
        },
      }),
  );

  useEffect(() => {
    getDeviceId();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

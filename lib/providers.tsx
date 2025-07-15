"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as JotaiProvider } from "jotai";
import { CookiesNextProvider } from "cookies-next";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthInitializer } from "./components/auth-initializer";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && error.message.includes("4")) {
                return false;
              }
              return failureCount < 3;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <CookiesNextProvider pollingOptions={{ enabled: true, intervalMs: 1000 }}>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <AuthInitializer />
          {children}
          <Toaster position="top-right" closeButton richColors expand visibleToasts={5} />
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          )}
        </JotaiProvider>
      </QueryClientProvider>
    </CookiesNextProvider>
  );
}

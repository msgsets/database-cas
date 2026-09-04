"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 8_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-center"
        offset={18}
        toastOptions={{
          classNames: {
            toast:
              "material text-fg shadow-float border-0 rounded-xl font-sans text-[15px]",
            title: "text-fg font-medium",
            description: "text-muted",
          },
        }}
      />
    </QueryClientProvider>
  );
}

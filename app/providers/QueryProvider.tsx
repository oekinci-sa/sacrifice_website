"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // SSR ve cache stratejileri
                        staleTime: 60 * 1000, // 1 dakika
                        gcTime: 5 * 60 * 1000, // 5 dakika
                        refetchOnWindowFocus: false,
                        refetchOnMount: false,
                        refetchOnReconnect: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
} 
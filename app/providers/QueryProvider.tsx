"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Default settings optimized for real-time data
                        staleTime: 0, // Consider data stale immediately
                        refetchOnMount: false, // Don't refetch when component mounts
                        refetchOnWindowFocus: false, // Don't refetch when window regains focus
                        refetchOnReconnect: false, // Don't refetch when reconnecting
                        retry: 1, // Retry once on failure
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
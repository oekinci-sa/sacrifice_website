"use client";

import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { useEffect, useRef } from "react";

export function ShareholderDataProvider({ children }: { children: React.ReactNode }) {
    const hasInitialized = useRef(false);

    // Get shareholder store methods
    const {
        fetchShareholders,
        enableRealtime,
        disableRealtime,
        isInitialized
    } = useShareholderStore();

    // Initial data fetch and real-time setup
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;

            // First fetch fresh data from the database if needed
            if (!isInitialized) {
                fetchShareholders().then(() => {
                    // Then set up real-time subscription
                    enableRealtime();
                });
            } else {
                // If data is already initialized, just set up subscription
                enableRealtime();
            }
        }

        // Cleanup on unmount
        return () => {
            disableRealtime();
        };
    }, [fetchShareholders, enableRealtime, disableRealtime, isInitialized]);

    return <>{children}</>;
} 
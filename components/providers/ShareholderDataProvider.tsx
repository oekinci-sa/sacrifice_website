"use client";

import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { useEffect, useRef } from "react";

export function ShareholderDataProvider({ children }: { children: React.ReactNode }) {
    const hasInitialized = useRef(false);

    // Get shareholder store methods
    const {
        fetchShareholders,
        subscribeToRealtime,
        unsubscribeFromRealtime,
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
                    subscribeToRealtime();
                });
            } else {
                // If data is already initialized, just set up subscription
                subscribeToRealtime();
            }
        }

        // Cleanup on unmount
        return () => {
            unsubscribeFromRealtime();
        };
    }, [fetchShareholders, subscribeToRealtime, unsubscribeFromRealtime, isInitialized]);

    return <>{children}</>;
} 
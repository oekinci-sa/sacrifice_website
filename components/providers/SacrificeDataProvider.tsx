"use client";

import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useEffect, useRef } from "react";

export function SacrificeDataProvider({ children }: { children: React.ReactNode }) {
    const hasInitialized = useRef(false);

    // Get sacrifice store methods
    const {
        refetchSacrifices,
        subscribeToRealtime,
        unsubscribeFromRealtime,
        isInitialized
    } = useSacrificeStore();

    // Initial data fetch and real-time setup
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;

            // First fetch fresh data from the database if needed
            if (!isInitialized) {
                refetchSacrifices().then(() => {
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
    }, [refetchSacrifices, subscribeToRealtime, unsubscribeFromRealtime, isInitialized]);

    return <>{children}</>;
} 
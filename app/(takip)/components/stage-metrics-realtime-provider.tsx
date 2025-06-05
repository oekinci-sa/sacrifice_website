"use client";

import { useStageMetricsStore } from "@/stores/global/useStageMetricsStore";
import { useEffect } from "react";

/**
 * StageMetricsRealtimeProvider - A component that initializes the centralized
 * stage metrics store with data and real-time subscriptions.
 */
export default function StageMetricsRealtimeProvider({
    children
}: {
    children: React.ReactNode
}) {

    const {
        fetchStageMetrics,
        subscribeToRealtime,
        unsubscribeFromRealtime,
        isInitialized,
        isLoading
    } = useStageMetricsStore();

    // Initialize store with data and real-time subscription
    useEffect(() => {
        // Fetch initial data if not already initialized and not currently loading
        if (!isInitialized && !isLoading) {
            console.log("[StageMetricsRealtimeProvider] Fetching initial stage metrics...");
            fetchStageMetrics().then(() => {
                console.log("[StageMetricsRealtimeProvider] Data loaded. Setting up realtime subscription...");
                // Add a small delay to ensure store is properly updated
                setTimeout(() => {
                    subscribeToRealtime();
                }, 100);
            });
        } else if (isInitialized) {
            // If already initialized, just set up subscription
            console.log("[StageMetricsRealtimeProvider] Data already initialized. Setting up realtime subscription...");
            subscribeToRealtime();
        }

        // Cleanup on unmount
        return () => {
            console.log("[StageMetricsRealtimeProvider] Cleaning up realtime subscription...");
            unsubscribeFromRealtime();
        };
    }, [fetchStageMetrics, subscribeToRealtime, unsubscribeFromRealtime, isInitialized, isLoading]);

    // Just render children, this is a context-less provider
    return <>{children}</>;
} 
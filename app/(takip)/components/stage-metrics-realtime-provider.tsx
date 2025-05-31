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
            fetchStageMetrics().then(() => {
                // Set up real-time subscription after data is loaded
                subscribeToRealtime();
            });
        } else if (isInitialized) {
            // If already initialized, just set up subscription
            subscribeToRealtime();
        }

        // Cleanup on unmount
        return () => {
            unsubscribeFromRealtime();
        };
    }, [fetchStageMetrics, subscribeToRealtime, unsubscribeFromRealtime, isInitialized, isLoading]);

    // Just render children, this is a context-less provider
    return <>{children}</>;
} 
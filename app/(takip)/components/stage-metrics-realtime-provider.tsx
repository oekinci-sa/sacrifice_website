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
        isInitialized
    } = useStageMetricsStore();

    // Initialize store with data and real-time subscription
    useEffect(() => {
        console.log('[StageMetricsRealtimeProvider] Initializing store...');

        // Fetch initial data
        if (!isInitialized) {
            fetchStageMetrics().then(() => {
                // Then set up real-time subscription
                subscribeToRealtime();
            });
        } else {
            // If already initialized, just set up subscription
            subscribeToRealtime();
        }

        // Cleanup on unmount
        return () => {
            console.log('[StageMetricsRealtimeProvider] Provider cleanup - unsubscribing from real-time');
            unsubscribeFromRealtime();
        };
    }, [fetchStageMetrics, subscribeToRealtime, unsubscribeFromRealtime, isInitialized]);

    // Just render children, this is a context-less provider
    return <>{children}</>;
} 
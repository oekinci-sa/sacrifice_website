import { StageMetrics, StageType } from '@/types/stage-metrics';
import RealtimeManager from '@/utils/RealtimeManager';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface StageMetricsState {
    // State - keyed by stage type
    stageMetrics: Record<StageType, StageMetrics>;
    isLoading: boolean;
    error: Error | null;
    isInitialized: boolean;

    // Methods
    fetchStageMetrics: () => Promise<void>;
    updateStageMetric: (stageMetric: StageMetrics) => void;
    getStageMetric: (stage: StageType) => StageMetrics | null;

    // Realtime methods
    subscribeToRealtime: () => void;
    unsubscribeFromRealtime: () => void;
}

export const useStageMetricsStore = create<StageMetricsState>()(
    devtools(
        (set, get) => ({
            // State
            stageMetrics: {} as Record<StageType, StageMetrics>,
            isLoading: false,
            error: null,
            isInitialized: false,

            // Methods
            fetchStageMetrics: async () => {
                if (get().isLoading) return;

                try {
                    set({ isLoading: true, error: null });

                    console.log('[StageMetricsStore] Fetching stage metrics...');
                    const response = await fetch("/api/get-stage-metrics");

                    if (!response.ok) {
                        throw new Error("Failed to fetch stage metrics");
                    }

                    const data: StageMetrics[] = await response.json();
                    console.log('[StageMetricsStore] Fetched data:', data);

                    // Convert array to keyed object
                    const stageMetrics: Record<StageType, StageMetrics> = {} as Record<StageType, StageMetrics>;

                    data.forEach(metric => {
                        stageMetrics[metric.stage] = metric;
                    });

                    set({
                        stageMetrics,
                        isLoading: false,
                        isInitialized: true,
                    });

                } catch (error) {
                    console.error('[StageMetricsStore] Error fetching stage metrics:', error);
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error : new Error(String(error))
                    });
                }
            },

            updateStageMetric: (stageMetric: StageMetrics) => {
                console.log('[StageMetricsStore] Updating stage metric:', stageMetric);

                set((state) => ({
                    stageMetrics: {
                        ...state.stageMetrics,
                        [stageMetric.stage]: stageMetric
                    }
                }));
            },

            getStageMetric: (stage: StageType) => {
                return get().stageMetrics[stage] || null;
            },

            // Realtime methods
            subscribeToRealtime: () => {
                console.log('[StageMetricsStore] Setting up real-time subscription...');

                // Clean up any existing subscriptions first
                RealtimeManager.cleanup();

                // Subscribe to stage_metrics table
                RealtimeManager.subscribeToTable(
                    "stage_metrics",
                    (payload) => {
                        console.log('[StageMetricsStore] Real-time update received:', payload);

                        const { eventType, new: newData, old: oldData } = payload;

                        if (eventType === "INSERT" || eventType === "UPDATE") {
                            const updatedMetric = newData as StageMetrics;
                            console.log('[StageMetricsStore] Updating metric for stage:', updatedMetric.stage);
                            get().updateStageMetric(updatedMetric);
                        }
                    }
                );
            },

            unsubscribeFromRealtime: () => {
                console.log('[StageMetricsStore] Unsubscribing from real-time...');
                RealtimeManager.cleanup();
            },
        }),
        { name: "stage-metrics-store" }
    )
); 
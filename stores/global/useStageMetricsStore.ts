import { StageMetrics, StageType } from '@/types/stage-metrics';
import { normalizeQueueDisplayNumber, QUEUE_NUMBER_MIN } from '@/lib/queue-display-number';
import RealtimeManager from '@/utils/RealtimeManager';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface StageMetricsState {
    // State - keyed by stage type
    stageMetrics: Record<StageType, StageMetrics>;
    maxSacrificeNumber: number;
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
            maxSacrificeNumber: QUEUE_NUMBER_MIN,
            isLoading: false,
            error: null,
            isInitialized: false,

            // Methods
            fetchStageMetrics: async () => {
                if (get().isLoading) return;

                try {
                    set({ isLoading: true, error: null });

                    const response = await fetch("/api/get-stage-metrics");

                    if (!response.ok) {
                        throw new Error("Failed to fetch stage metrics");
                    }

                    const json = await response.json();
                    const data: StageMetrics[] = Array.isArray(json)
                        ? json
                        : (json.metrics ?? []);
                    const maxSacrificeNumber = normalizeQueueDisplayNumber(
                        Array.isArray(json) ? undefined : json.max_sacrifice_number
                    );

                    // Convert array to keyed object
                    const stageMetrics: Record<StageType, StageMetrics> = {} as Record<StageType, StageMetrics>;

                    data.forEach(metric => {
                        stageMetrics[metric.stage] = {
                            ...metric,
                            current_sacrifice_number: normalizeQueueDisplayNumber(
                                metric.current_sacrifice_number
                            ),
                        };
                    });

                    set({
                        stageMetrics,
                        maxSacrificeNumber,
                        isLoading: false,
                        isInitialized: true,
                    });

                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error : new Error(String(error))
                    });
                }
            },

            updateStageMetric: (stageMetric: StageMetrics) => {
                set((state) => ({
                    stageMetrics: {
                        ...state.stageMetrics,
                        [stageMetric.stage]: {
                            ...stageMetric,
                            current_sacrifice_number: normalizeQueueDisplayNumber(
                                stageMetric.current_sacrifice_number
                            ),
                        },
                    },
                }));
            },

            getStageMetric: (stage: StageType) => {
                return get().stageMetrics[stage] || null;
            },

            // Realtime methods
            subscribeToRealtime: () => {
                // Clean up any existing subscriptions first
                RealtimeManager.cleanup();

                // Subscribe to stage_metrics table
                RealtimeManager.subscribeToTable(
                    "stage_metrics",
                    (payload) => {
                        const { eventType, new: newData, old: oldData } = payload;

                        if (eventType === "INSERT" || eventType === "UPDATE") {
                            const updatedMetric = newData as StageMetrics;
                            get().updateStageMetric(updatedMetric);
                        }
                    }
                );
            },

            unsubscribeFromRealtime: () => {
                RealtimeManager.cleanup();
            },
        }),
        { name: "stage-metrics-store" }
    )
); 
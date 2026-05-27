import { resolveTenantIdFromHost } from '@/lib/tenant-resolver';
import { StageMetrics, StageType } from '@/types/stage-metrics';
import { normalizeQueueDisplayNumber, QUEUE_NUMBER_MIN } from '@/lib/queue-display-number';
import RealtimeManager from '@/utils/RealtimeManager';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** Realtime (anon) tüm tenant’lardaki satır değişimlerini iletir; API ise tek tenant filtreler. */
function matchesStageMetricsRealtimeScope(
    row: { tenant_id?: string } | null | undefined,
    state: { realtimeScopeTenantId: string | null }
): boolean {
    if (!row?.tenant_id) return false;
    const expectedTenant =
        state.realtimeScopeTenantId ??
        (typeof window !== "undefined" ? resolveTenantIdFromHost(window.location.host) : null);
    if (!expectedTenant || row.tenant_id !== expectedTenant) return false;
    return true;
}

function resolveStageMetricsTenantScope(metrics: StageMetrics[]): string | null {
    const fromRow = metrics.find((metric) => metric.tenant_id)?.tenant_id;
    if (fromRow) return fromRow;
    if (typeof window !== "undefined") {
        return resolveTenantIdFromHost(window.location.host);
    }
    return null;
}

export interface StageMetricsState {
    // State - keyed by stage type
    stageMetrics: Record<StageType, StageMetrics>;
    maxSacrificeNumber: number;
    isLoading: boolean;
    error: Error | null;
    isInitialized: boolean;
    /** Son başarılı fetch / host ile uyumlu tenant (realtime filtre) */
    realtimeScopeTenantId: string | null;

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
            realtimeScopeTenantId: null,

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
                    const tenantScope = resolveStageMetricsTenantScope(data);

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
                        realtimeScopeTenantId: tenantScope,
                    });

                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error : new Error(String(error))
                    });
                }
            },

            updateStageMetric: (stageMetric: StageMetrics) => {
                if (!matchesStageMetricsRealtimeScope(stageMetric, get())) {
                    return;
                }

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
                RealtimeManager.cleanup();

                const tenantId =
                    get().realtimeScopeTenantId ??
                    (typeof window !== "undefined"
                        ? resolveTenantIdFromHost(window.location.host)
                        : null);
                const filter = tenantId ? `tenant_id=eq.${tenantId}` : undefined;

                RealtimeManager.subscribeToTable(
                    "stage_metrics",
                    (payload) => {
                        const { eventType, new: newData } = payload;

                        if (eventType === "INSERT" || eventType === "UPDATE") {
                            if (!matchesStageMetricsRealtimeScope(newData as StageMetrics, get())) {
                                return;
                            }
                            get().updateStageMetric(newData as StageMetrics);
                        }
                    },
                    filter ? { filter } : undefined
                );
            },

            unsubscribeFromRealtime: () => {
                RealtimeManager.cleanup();
            },
        }),
        { name: "stage-metrics-store" }
    )
);

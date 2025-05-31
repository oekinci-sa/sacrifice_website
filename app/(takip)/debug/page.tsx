'use client';

import { Button } from "@/components/ui/button";
import { useStageMetricsStore } from "@/stores/global/useStageMetricsStore";
import { useState } from "react";

export default function DebugPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // ✅ FIX: Direct store subscription for proper React re-renders
    const { stageMetrics, isLoading: storeLoading, isInitialized, error } = useStageMetricsStore(
        state => ({
            stageMetrics: state.stageMetrics,
            isLoading: state.isLoading,
            isInitialized: state.isInitialized,
            error: state.error
        })
    );

    const testStageUpdate = async (stage: string) => {
        setLoading(true);
        try {
            console.log(`[Debug] Testing stage update for: ${stage}`);

            const response = await fetch('/api/test-stage-metrics-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stage,
                    increment: 1
                })
            });

            const data = await response.json();
            console.log(`[Debug] Response:`, data);
            setResult(data);
        } catch (error) {
            console.error(`[Debug] Error:`, error);
            setResult({ error: error instanceof Error ? error.message : String(error) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-8">Real-Time Debug Page</h1>

            <div className="space-y-6">
                <p className="text-muted-foreground">
                    Test the real-time system by clicking the buttons below.
                    Open the browser console to see detailed logs.
                </p>

                {/* Store State Monitor */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Store State Monitor</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Initialized:</strong> {isInitialized ? '✅ Yes' : '❌ No'}
                        </div>
                        <div>
                            <strong>Loading:</strong> {storeLoading ? '🔄 Loading...' : '✅ Ready'}
                        </div>
                        <div className="col-span-2">
                            <strong>Error:</strong> {error ? `❌ ${error.message}` : '✅ None'}
                        </div>
                        <div className="col-span-2">
                            <strong>Current Numbers:</strong>
                            <ul className="ml-4 mt-1">
                                <li>Kesim: {stageMetrics.slaughter_stage?.current_sacrifice_number ?? 'N/A'}</li>
                                <li>Parçalama: {stageMetrics.butcher_stage?.current_sacrifice_number ?? 'N/A'}</li>
                                <li>Teslimat: {stageMetrics.delivery_stage?.current_sacrifice_number ?? 'N/A'}</li>
                            </ul>
                        </div>
                        <div className="col-span-2">
                            <strong>Store Data (Raw):</strong>
                            <pre className="text-xs bg-white p-2 rounded mt-1 max-h-32 overflow-auto">
                                {JSON.stringify(stageMetrics, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => testStageUpdate('slaughter_stage')}
                        disabled={loading}
                    >
                        Test Kesim Sırası
                    </Button>

                    <Button
                        onClick={() => testStageUpdate('butcher_stage')}
                        disabled={loading}
                    >
                        Test Parçalama Sırası
                    </Button>

                    <Button
                        onClick={() => testStageUpdate('delivery_stage')}
                        disabled={loading}
                    >
                        Test Teslimat Sırası
                    </Button>
                </div>

                {result && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-2">Last API Result:</h3>
                        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
} 
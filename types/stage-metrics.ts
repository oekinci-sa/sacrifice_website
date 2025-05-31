export interface StageMetrics {
    stage: 'slaughter_stage' | 'butcher_stage' | 'delivery_stage';
    current_sacrifice_number: number;
    avg_progress_duration: number;
}

export type StageType = 'slaughter_stage' | 'butcher_stage' | 'delivery_stage';

export interface StageMetricsUpdate {
    stage: StageType;
    current_sacrifice_number: number;
}
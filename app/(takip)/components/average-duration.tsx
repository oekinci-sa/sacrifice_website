'use client';

import { useStageMetricsStore } from '@/stores/global/useStageMetricsStore';
import { StageType } from '@/types/stage-metrics';
import React, { useEffect, useState } from 'react';

interface AverageDurationProps {
  stage: StageType;
}

const AverageDuration: React.FC<AverageDurationProps> = ({ stage }) => {
  const [avgDurationMinutes, setAvgDurationMinutes] = useState<number>(0);

  // Direct store subscription - this will trigger React re-renders
  const currentStageMetric = useStageMetricsStore(state => state.stageMetrics[stage]);
  const isStoreInitialized = useStageMetricsStore(state => state.isInitialized);

  // Update average duration when store data changes
  useEffect(() => {
    if (currentStageMetric && currentStageMetric.avg_progress_duration !== undefined) {
      const avgDurationSeconds = currentStageMetric.avg_progress_duration;
      const avgDurationMinutes = Math.round(avgDurationSeconds / 60);
      setAvgDurationMinutes(avgDurationMinutes);
    }
  }, [currentStageMetric?.avg_progress_duration, stage]);

  // Show loading if store is not initialized yet
  const displayDuration = isStoreInitialized ? `${avgDurationMinutes} dakika` : '...';

  return (
    <div className='text-center md:text-lg tracking-wide'>
      İlerleme Süresi: <br className='md:hidden' />
      {displayDuration}
    </div>
  );
};

export default AverageDuration;
'use client';

import { useStageMetricsStore } from '@/stores/global/useStageMetricsStore';
import { StageType } from '@/types/stage-metrics';
import React, { useEffect, useState } from 'react';

interface AverageDurationProps {
  stage: StageType;
}

const AverageDuration: React.FC<AverageDurationProps> = ({ stage }) => {
  const [avgDurationMinutes, setAvgDurationMinutes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Direct store subscription - this will trigger React re-renders
  const currentStageMetric = useStageMetricsStore(state => state.stageMetrics[stage]);

  // Update average duration when store data changes
  useEffect(() => {
    if (currentStageMetric && currentStageMetric.avg_progress_duration !== undefined) {
      const avgDurationSeconds = currentStageMetric.avg_progress_duration;
      const avgDurationMinutes = Math.round(avgDurationSeconds / 60);
      console.log(`[AverageDuration] Store updated for ${stage}: ${avgDurationMinutes} minutes`);
      setAvgDurationMinutes(avgDurationMinutes);
      setLoading(false);
    }
  }, [currentStageMetric?.avg_progress_duration, stage]); // ✅ FIX: More specific dependency

  return (
    <div className='text-center md:text-lg tracking-wide'>
      İlerleme Süresi: <br className='md:hidden' />
      {loading ? '...' : `${avgDurationMinutes} dakika`}
    </div>
  );
};

export default AverageDuration;
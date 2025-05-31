'use client';

import { useStageMetricsStore } from '@/stores/global/useStageMetricsStore';
import { StageType } from '@/types/stage-metrics';
import React, { useEffect, useState } from 'react';
import AverageDuration from './average-duration';

interface QueueCardProps {
  title: string;
  stage: StageType;
}

const QueueCard: React.FC<QueueCardProps> = ({ title, stage }) => {
  const [currentNumber, setCurrentNumber] = useState<number>(0);

  // Direct store subscription - this will trigger React re-renders
  const currentStageMetric = useStageMetricsStore(state => state.stageMetrics[stage]);
  const isStoreInitialized = useStageMetricsStore(state => state.isInitialized);

  // Update local number when store data changes
  useEffect(() => {
    if (currentStageMetric && currentStageMetric.current_sacrifice_number !== undefined) {
      const newNumber = currentStageMetric.current_sacrifice_number;
      setCurrentNumber(newNumber);
    }
  }, [currentStageMetric, stage]);

  // Show loading if store is not initialized yet
  const displayNumber = isStoreInitialized ? currentNumber : '...';

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Queue Card */}
      <div className='flex flex-col items-center justify-center w-40 md:w-60'>
        <div className="bg-sac-primary py-1 md:py-2 text-center text-white w-full text-lg md:text-2xl font-bold">
          {title}
        </div>
        <div className="bg-black/90 py-4 md:py-8 text-center text-white w-full text-6xl md:text-8xl font-bold">
          {displayNumber}
        </div>
      </div>

      {/* Average Duration */}
      <AverageDuration stage={stage} />
    </div>
  );
};

export default QueueCard;
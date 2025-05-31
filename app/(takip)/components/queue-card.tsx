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
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Direct store subscription - this will trigger React re-renders
  const currentStageMetric = useStageMetricsStore(state => state.stageMetrics[stage]);

  // Update local number when store data changes
  useEffect(() => {
    if (currentStageMetric && currentStageMetric.current_sacrifice_number !== undefined) {
      const newNumber = currentStageMetric.current_sacrifice_number;
      console.log(`[QueueCard] Store updated for ${stage}: ${currentNumber} -> ${newNumber}`);
      setCurrentNumber(newNumber);
      setLoading(false);
    }
  }, [currentStageMetric?.current_sacrifice_number, stage]); // ✅ FIX: More specific dependency

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Queue Card */}
      <div className='flex flex-col items-center justify-center w-40 md:w-60'>
        <div className="bg-sac-primary py-1 md:py-2 text-center text-white w-full text-lg md:text-2xl font-bold">
          {title}
        </div>
        <div className="bg-black/90 py-4 md:py-8 text-center text-white w-full text-6xl md:text-8xl font-bold">
          {loading ? '...' : currentNumber}
        </div>
      </div>

      {/* Average Duration */}
      <AverageDuration stage={stage} />
    </div>
  );
};

export default QueueCard;
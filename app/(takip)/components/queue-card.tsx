'use client';

import { StageMetrics, StageType } from '@/types/stage-metrics';
import RealtimeManager from '@/utils/RealtimeManager';
import React, { useEffect, useState } from 'react';
import AverageDuration from './average-duration';

interface QueueCardProps {
  title: string;
  stage: StageType;
}

const QueueCard: React.FC<QueueCardProps> = ({ title, stage }) => {
  const [currentNumber, setCurrentNumber] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`/api/get-stage-metrics?stage=${stage}`);
        const data: StageMetrics[] = await response.json();

        if (data && data.length > 0) {
          setCurrentNumber(data[0].current_sacrifice_number || 0);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [stage]);

  // Setup realtime subscription
  useEffect(() => {
    const channel = RealtimeManager.subscribeToTable('stage_metrics', (payload) => {
      if (payload.new && payload.new.stage === stage) {
        setCurrentNumber(payload.new.current_sacrifice_number || 0);
      }
    });

    return () => {
      if (channel) {
        RealtimeManager.cleanup();
      }
    };
  }, [stage]);

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
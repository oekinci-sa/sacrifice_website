'use client';

import { StageMetrics, StageType } from '@/types/stage-metrics';
import RealtimeManager from '@/utils/RealtimeManager';
import React, { useEffect, useState } from 'react';

interface AverageDurationProps {
  stage: StageType;
}

const AverageDuration: React.FC<AverageDurationProps> = ({ stage }) => {
  const [avgDurationMinutes, setAvgDurationMinutes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`/api/get-stage-metrics?stage=${stage}`);
        const data: StageMetrics[] = await response.json();

        if (data && data.length > 0) {
          const avgDurationSeconds = data[0].avg_progress_duration || 0;
          const avgDurationMinutes = Math.round(avgDurationSeconds / 60);
          setAvgDurationMinutes(avgDurationMinutes);
        }
      } catch (error) {
        console.error('Error fetching average duration:', error);
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
        const avgDurationSeconds = payload.new.avg_progress_duration || 0;
        const avgDurationMinutes = Math.round(avgDurationSeconds / 60);
        setAvgDurationMinutes(avgDurationMinutes);
      }
    });

    return () => {
      if (channel) {
        RealtimeManager.cleanup();
      }
    };
  }, [stage]);

  return (
    <div className='text-center md:text-lg tracking-wide'>
      İlerleme Süresi: <br className='md:hidden' />
      {loading ? '...' : `${avgDurationMinutes} dakika`}
    </div>
  );
};

export default AverageDuration;
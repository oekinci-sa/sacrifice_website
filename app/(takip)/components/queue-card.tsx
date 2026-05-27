'use client';

import { normalizeQueueDisplayNumber, QUEUE_NUMBER_MIN } from '@/lib/queue-display-number';
import { useStageMetricsStore } from '@/stores/global/useStageMetricsStore';
import { StageType } from '@/types/stage-metrics';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import AverageDuration from './average-duration';

interface QueueCardProps {
  title: string;
  stage: StageType;
  showAverageDuration?: boolean;
}

const QueueCard: React.FC<QueueCardProps> = ({ title, stage, showAverageDuration = true }) => {
  const [currentNumber, setCurrentNumber] = useState<number>(QUEUE_NUMBER_MIN);
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  const currentStageMetric = useStageMetricsStore(state => state.stageMetrics[stage]);
  const isStoreInitialized = useStageMetricsStore(state => state.isInitialized);
  const isStoreLoading = useStageMetricsStore(state => state.isLoading);

  useEffect(() => {
    if (!isStoreInitialized) return;

    if (currentStageMetric?.current_sacrifice_number !== undefined) {
      setCurrentNumber(normalizeQueueDisplayNumber(currentStageMetric.current_sacrifice_number));
    } else {
      setCurrentNumber(QUEUE_NUMBER_MIN);
    }
    setIsLocalLoading(false);
  }, [currentStageMetric, isStoreInitialized, isStoreLoading, stage]);

  const shouldShowLoading = !isStoreInitialized || isStoreLoading || isLocalLoading;
  const displayNumber = shouldShowLoading ? '...' : currentNumber;

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4"
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeInOut" }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {showAverageDuration && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <AverageDuration stage={stage} />
        </motion.div>
      )}

      <motion.div
        className='flex flex-col items-center justify-center w-40 md:w-60'
        initial={{ rotateY: -5 }}
        animate={{ rotateY: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.div
          className="bg-primary py-1 md:py-2 text-center text-white w-full text-lg md:text-2xl font-bold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {title}
        </motion.div>
        <motion.div
          className="bg-black/90 py-4 md:py-8 text-center text-white w-full text-6xl md:text-8xl font-bold"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.span
            key={displayNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {displayNumber}
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default QueueCard;

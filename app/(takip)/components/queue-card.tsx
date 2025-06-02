'use client';

import { useStageMetricsStore } from '@/stores/global/useStageMetricsStore';
import { StageType } from '@/types/stage-metrics';
import { motion } from 'framer-motion';
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
    <motion.div
      className="flex flex-col items-center justify-center gap-4"
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeInOut" }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Queue Card */}
      <motion.div
        className='flex flex-col items-center justify-center w-40 md:w-60'
        initial={{ rotateY: -5 }}
        animate={{ rotateY: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.div
          className="bg-sac-primary py-1 md:py-2 text-center text-white w-full text-lg md:text-2xl font-bold"
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

      {/* Average Duration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <AverageDuration stage={stage} />
      </motion.div>
    </motion.div>
  );
};

export default QueueCard;
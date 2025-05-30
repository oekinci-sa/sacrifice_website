import React from 'react'
import AverageDuration from './average-duration'

const QueueCard = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Queue Card */}
      <div className='flex flex-col items-center justify-center w-36 md:w-60'>
        <div className="bg-sac-primary py-1 md:py-2 text-center text-white w-full text-lg md:text-2xl font-bold">Teslimat Sırası</div>
        <div className="bg-black/90 py-4 md:py-8 text-center text-white w-full text-6xl md:text-8xl font-bold">150</div>
      </div>

      {/* Average Duration */}
      <AverageDuration />
    </div>
  )
}

export default QueueCard
import React from 'react';

interface CountdownTimerProps {
  expirationTime: string;
  remainingTime: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expirationTime, remainingTime }) => {
  const formatRemainingTime = () => {
    if (remainingTime <= 0) return "00:00:00";
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg md:my-8 flex flex-row justify-center items-center gap-8">
      <div className="flex flex-col items-center">
        <p className="text-sm md:text-base text-gray-500">İşlem Bitiş Zamanı</p>
        <p className="font-bold text-base md:text-2xl lg:text-3xl">{expirationTime}</p>
      </div>
      <div className="w-px h-10 bg-gray-300 hidden md:block"></div>
      <div className="flex flex-col items-center">
        <p className="text-sm md:text-base text-gray-500">Kalan Süre</p>
        <p className={`font-bold text-base md:text-2xl lg:text-3xl ${remainingTime < 60 ? 'text-red-600 animate-pulse' : remainingTime < 180 ? 'text-yellow-600' : 'text-sac-primary'}`}>
          {formatRemainingTime()}
        </p>
      </div>
    </div>
  );
};

export default CountdownTimer; 
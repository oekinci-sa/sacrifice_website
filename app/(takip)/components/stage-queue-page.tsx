"use client";

import AverageDuration from "@/app/(takip)/components/average-duration";
import { QueueAccessGate } from "@/app/(takip)/components/queue-access-gate";
import QueueCardWithButtons from "@/app/(takip)/components/queue-card-with-buttons";
import { ShareholderSearchBar } from "@/app/(takip)/components/shareholder-search-bar";
import { QUEUE_NUMBER_MIN } from "@/lib/queue-display-number";
import { PageKey } from "@/lib/queue-access-hash";
import { StageType } from "@/types/stage-metrics";
import { useState } from "react";

interface StageQueuePageProps {
  title: string;
  stage: StageType;
  pageKey: PageKey;
}

const StageQueuePage: React.FC<StageQueuePageProps> = ({ title, stage, pageKey }) => {
  const [currentNumber, setCurrentNumber] = useState<number>(QUEUE_NUMBER_MIN);

  return (
    <QueueAccessGate pageKey={pageKey}>
      <div className="container flex flex-col items-center justify-center gap-8 md:gap-10">
        <AverageDuration stage={stage} />

        {/* Hissedar arama çubuğu */}
        <ShareholderSearchBar
          pageKey={pageKey}
          onSelectSacrificeNo={(no) => setCurrentNumber(no)}
        />

        <QueueCardWithButtons
          title={title}
          stage={stage}
          enableAnimation={false}
          externalNumber={currentNumber}
          onLocalNumberChange={setCurrentNumber}
        />
      </div>
    </QueueAccessGate>
  );
};

export default StageQueuePage;

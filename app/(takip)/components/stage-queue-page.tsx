import AverageDuration from "@/app/(takip)/components/average-duration";
import QueueCardWithButtons from "@/app/(takip)/components/queue-card-with-buttons";
import { StageType } from "@/types/stage-metrics";

interface StageQueuePageProps {
    title: string;
    stage: StageType;
}

const StageQueuePage: React.FC<StageQueuePageProps> = ({ title, stage }) => {
    return (
        <div className="container flex flex-col items-center justify-center gap-8 md:gap-10">
            <AverageDuration stage={stage} />
            <QueueCardWithButtons
                title={title}
                stage={stage}
                enableAnimation={false}
            />
        </div>
    );
};

export default StageQueuePage; 
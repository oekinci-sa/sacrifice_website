import StageQueuePage from "@/app/(takip)/components/stage-queue-page";

const page = () => {
  return (
    <div className="my-36 lg:my-44">
      <StageQueuePage
        title="Kesim Sırası"
        stage="slaughter_stage"
      />
    </div>
  );
};

export default page;

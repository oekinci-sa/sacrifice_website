import StageQueuePage from "@/app/(takip)/components/stage-queue-page";

const page = () => {
  return (
    <div className="my-36">
      <StageQueuePage
        title="Teslimat Sırası"
        stage="delivery_stage"
      />
    </div>

  );
};

export default page;

import StageQueuePage from "@/app/(takip)/components/stage-queue-page";

const page = () => {
  return (
    <div className="my-24 md:my-36">
      <StageQueuePage
        title="Parçalama Sırası"
        stage="butcher_stage"
      />
    </div>
  );
};

export default page;

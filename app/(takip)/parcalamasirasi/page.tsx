import React from "react";
import QueueCardWithButtons from "../components/queue-card-with-buttons";

const page = () => {
  return (
    <div className="container flex flex-col items-center justify-center gap-12 md:gap-16">
      <QueueCardWithButtons></QueueCardWithButtons>
    </div>
  );
};

export default page;

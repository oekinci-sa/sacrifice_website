import Title from "@/components/common/Title";
import Message from "@/components/takip/message";
import QueueCard from "@/components/takip/queue-card";
import React from "react";

const page = () => {
  return (
    <div>
      <Title></Title>
      <QueueCard></QueueCard>
      <QueueCard></QueueCard>
      <QueueCard></QueueCard>
      <Message></Message>
    </div>
  );
};

export default page;

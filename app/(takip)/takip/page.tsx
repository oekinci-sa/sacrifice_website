import Title from "@/components/public/common/title";
import Message from "@/components/public/takip/message";
import QueueCard from "@/components/public/takip/queue-card";
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

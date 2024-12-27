import Title from "@/components/common/title";
import Message from "@/app/(takip)/components/message";
import QueueCard from "@/app/(takip)/components/queue-card";
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

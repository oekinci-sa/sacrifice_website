import Title from '@/components/common/Title'
import Message from '@/components/takip/Message';
import QueueCard from '@/components/takip/QueueCard'
import React from 'react'

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
}

export default page
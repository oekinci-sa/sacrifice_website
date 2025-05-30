import FeedbackForm from "@/app/(takip)/components/feedback-form";
import QueueCard from "@/app/(takip)/components/queue-card";
import React from "react";
import Ayah from "@/app/(public)/(anasayfa)/components/ayah";

const page = () => {
  return (
    <div className="container flex flex-col items-center justify-center gap-12 md:gap-16">
      <h1 className="text-3xl md:text-4xl font-bold mt-8 text-center">Kurbanlık Takip<br className="md:hidden" /> Sayfası</h1>
      <div className="-mt-8">
        <Ayah />
      </div>
      <div className="grid grid-cols-2 gap-8 md:flex md:flex-row md:gap-16">
        <QueueCard />

        <QueueCard />
        <div className="col-span-2 flex justify-center">
          <QueueCard />
        </div>
      </div>
      <FeedbackForm></FeedbackForm>



    </div>
  );
};

export default page;

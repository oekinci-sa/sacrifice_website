import React, { Fragment } from "react";
import Info from "./components/info";
import Reminders from "./components/reminders";

const page = () => {
  return (
    <>
      <div className="container flex flex-col space-y-12">
        {/* Title */}
        <div className="font-heading font-bold text-4xl text-center mb-4">
          Hisse Sorgula
        </div>
        <Info></Info>
        <Reminders></Reminders>
      </div>
    </>
  );
};

export default page;

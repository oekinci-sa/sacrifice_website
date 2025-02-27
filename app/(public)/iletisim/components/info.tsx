import React from "react";
import { contact_infos } from "../../(anasayfa)/constants";
import Image from "next/image";

const Info = () => {
  return (
    <div className="flex flex-col gap-8 lg:gap-12">
      {contact_infos.map((item) => (
        <div key={item.icon} className="flex gap-4 lg:gap-6 items-start">
          <Image
            src={`/icons/${item.icon}`}
            alt="Example SVG"
            width={24}
            height={24}
            className="w-6 h-6 mt-1 lg:w-6 lg:h-6"
          />
          <div className="flex flex-col gap-1">
            <p className="font-heading font-bold text-lg lg:text-xl">{item.header}</p>
            <p className="font text-sm lg:text-base text-black/75">
              {item.info}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Info;

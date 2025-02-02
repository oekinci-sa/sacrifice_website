import React from "react";
import { contact_infos } from "../../(anasayfa)/constants";
import Image from "next/image";

const Info = () => {
  return (
    <div className="flex flex-col gap-12">
      {contact_infos.map((item) => (
        <div key={item.icon} className="flex gap-8 items-start">
          <Image
            src={`/icons/${item.icon}`}
            alt="Example SVG"
            width={32}
            height={32} // Genişlik ve yükseklik değerlerini ayarlayın
          />
          <div className="flex flex-col gap-1">
            <p className="font-heading font-bold text-2xl">{item.header}</p>
            <p className="font text-lg text-black/75">
              {" "}
              {item.info}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Info;

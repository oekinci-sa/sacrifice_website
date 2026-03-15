"use client";

import Image from "next/image";
import { useTenantBranding } from "@/hooks/useTenantBranding";

const contactItems = [
  { icon: "location.svg", header: "Adres", key: "address" as const },
  { icon: "mail.svg", header: "E-maillerinize 24 saat içerisinde dönüş sağlıyoruz.", key: "email" as const },
  { icon: "phone.svg", header: "Bizi arayın.", key: "phone" as const },
];

const Info = () => {
  const branding = useTenantBranding();

  const getInfo = (key: "address" | "email" | "phone") => {
    switch (key) {
      case "address":
        return branding.contact_address;
      case "email":
        return branding.contact_email;
      case "phone":
        return branding.contact_phone;
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-8 lg:gap-12">
      {contactItems.map((item) => (
        <div key={item.icon} className="flex gap-4 lg:gap-6 items-start">
          <Image
            src={`/icons/${item.icon}`}
            alt=""
            width={24}
            height={24}
            className="w-6 h-6 mt-1 lg:w-6 lg:h-6"
          />
          <div className="flex flex-col gap-1">
            <p className="font-bold text-lg lg:text-xl">{item.header}</p>
            <p
              className={`font text-sm lg:text-base text-black/75 leading-relaxed ${
                item.key === "address"
                  ? "w-full md:max-w-[min(100%,26rem)] break-words"
                  : ""
              }`}
            >
              {getInfo(item.key)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Info;

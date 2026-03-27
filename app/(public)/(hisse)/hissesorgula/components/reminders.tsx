"use client";

import React from "react";
import { reminders } from "../../constants";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { formatIbanForDisplay } from "@/utils/formatters";
import Image from "next/image";

const Reminders = () => {
  const branding = useTenantBranding();
  const remindersWithBranding = reminders.map((r, i) =>
    i === 1 ? { ...r, description: formatIbanForDisplay(branding.iban) } : r
  );

  return (
    <div className="container flex flex-wrap justify-between">
      {remindersWithBranding.map((item) => (
        <div key={item.src} className="flex flex-col items-center w-80 gap-4">
          <Image
            src={`/icons/${item.src}`}
            alt="Example SVG"
            width={32}
            height={32}
            className='min-h-12'
          />
          <div className="flex flex-col justify-between items-center gap-1">
            <p className="text-xl font-bold text-center">{item.header}</p>
            <p
              className="text-foreground/75 text-center"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Reminders
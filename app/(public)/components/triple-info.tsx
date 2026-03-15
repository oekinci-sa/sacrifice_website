"use client";

import { reminders } from "@/app/(public)/(hisse)/constants";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import Image from "next/image";

export function TripleInfo() {
  const branding = useTenantBranding();

  const processHtml = (html: string) => {
    if (!html) return html;
    const website = branding.website_url;
    if (website && html.includes(website)) {
      return html.replace(
        new RegExp(website.replace(/\./g, "\\."), "g"),
        `<a href="https://www.${website}/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${website}</a>`
      );
    }
    return html;
  };

  const remindersWithBranding = reminders.map((r, i) =>
    i === 1 ? { ...r, description: branding.iban } : r
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-32 mt-8 md:mt-12">
      {remindersWithBranding.map((reminder, index) => (
        <div key={index} className="flex flex-col items-center text-center space-y-2 md:space-y-3">
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
            <Image
              src={`/icons/${reminder.src}`}
              alt={reminder.header}
              width={24}
              height={24}
              className="w-6 h-6 md:w-[30px] md:h-[30px]"
            />
          </div>
          <h3 className="font-semibold text-base md:text-lg">{reminder.header}</h3>
          <p
            className="text-muted-foreground text-sm md:text-base"
            dangerouslySetInnerHTML={{ __html: processHtml(reminder.description) }}
          />
        </div>
      ))}
    </div>
  )
} 
"use client"

import { reminders } from "@/app/(public)/(hisse)/constants";
import Image from "next/image";

export function TripleInfo() {
  // Function to process HTML and convert links to open in new tab
  const processHtml = (html: string) => {
    // If there's no HTML or no link text, return as is
    if (!html || !html.includes('ankarakurban.com.tr')) return html;

    // Replace ankarakurban.com.tr with a link that opens in a new tab
    return html.replace(
      /ankarakurban\.com\.tr/g,
      '<a href="https://www.ankarakurban.com.tr/" target="_blank" rel="noopener noreferrer" class="text-sac-primary hover:underline">ankarakurban.com.tr</a>'
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-32 mt-8 md:mt-12">
      {reminders.map((reminder, index) => (
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
"use client"

import Image from "next/image"
import { reminders } from "@/app/(public)/(hisse)/constants"

export function TripleInfo() {
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
            dangerouslySetInnerHTML={{ __html: reminder.description }}
          />
        </div>
      ))}
    </div>
  )
} 
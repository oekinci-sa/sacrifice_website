"use client"

import Image from "next/image"
import { reminders } from "@/app/(public)/(hisse)/constants"

export function TripleInfo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-32 mt-12">
      {reminders.map((reminder, index) => (
        <div key={index} className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 flex items-center justify-center">
            <Image
              src={`/icons/${reminder.src}`}
              alt={reminder.header}
              width={30}
              height={30}
            />
          </div>
          <h3 className="font-semibold text-lg">{reminder.header}</h3>
          <p 
            className="text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: reminder.description }}
          />
        </div>
      ))}
    </div>
  )
} 
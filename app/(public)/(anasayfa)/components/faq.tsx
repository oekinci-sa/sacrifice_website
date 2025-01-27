import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";

import * as AccordionPrimitive from "@radix-ui/react-accordion";

import { Plus } from "lucide-react";

import { faq_items } from "../constants";

const Faq = () => {
  return (
    <div className="container w-1/2 space-y-12">
      <h2 className="font-heading font-bold text-4xl text-center">
        Sıkça Sorulan Sorular
      </h2>
      <Accordion type="single" collapsible className="w-full" defaultValue="1">
        {faq_items.map((item, index) => (
          <AccordionItem 
            value={item.id} 
            key={item.id} 
            className={`${index !== faq_items.length - 1 ? 'border-b' : ''} py-2`}
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-2 font-heading text-left text-xl font-bold leading-6 transition-all [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 [&[data-state=open]>svg]:rotate-180">
                {item.title}
                <Plus
                  size={16}
                  strokeWidth={2}
                  className="shrink-0 opacity-60 transition-transform duration-200"
                  aria-hidden="true"
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionContent className="text-lg text-muted-foreground">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Faq;

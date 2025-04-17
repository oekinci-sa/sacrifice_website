import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { useRef, useState } from "react";

import * as AccordionPrimitive from "@radix-ui/react-accordion";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { faq_categories } from "../constants";

// Accordion içeriği
function FaqAccordionContent({ items, categoryId }: { items: typeof faq_categories[0]['items'], categoryId: string }) {
  const ref = useRef(null);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={categoryId}
        ref={ref}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={container}
        className="w-full md:w-3/4 -mt-4"
      >
        <Accordion type="single" collapsible className="w-full -mt-4 px-4 md:mt-0 md:px-0" defaultValue={items[0]?.id}>
          {items.map((faqItem, index) => (
            <motion.div key={faqItem.id} variants={item}>
              <AccordionItem
                value={faqItem.id}
                className={`py-2 ${index === items.length - 1 ? 'border-b-0' : 'border-b'}`}
              >
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-2 text-left text-base md:text-xl font-bold leading-6 transition-all [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 [&[data-state=open]>svg]:rotate-180">
                    {faqItem.title}
                    <Plus
                      size={16}
                      strokeWidth={2}
                      className="shrink-0 opacity-60 transition-transform duration-200"
                      aria-hidden="true"
                    />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionContent className="text-base md:text-lg text-muted-foreground">
                  {faqItem.content}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
    </AnimatePresence>
  );
}

// Desktop view: Vertical tabs
function DesktopFaqContent() {
  const [activeCategory, setActiveCategory] = useState(faq_categories[0].id);
  const activeCategoryItems = faq_categories.find(cat => cat.id === activeCategory)?.items || [];

  return (
    <div className="flex flex-row space-x-6">
      {/* Vertical tabs */}
      <div className="flex flex-col space-y-2 w-full md:w-1/4 pr-0 md:pr-6">
        {faq_categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`text-left px-4 py-3 rounded-md transition-all duration-300 font-medium ${activeCategory === category.id
              ? "bg-sac-primary text-white"
              : "bg-black/5 text-black hover:bg-black/10"
              }`}
          >
            {category.title}
          </button>
        ))}
      </div>
      <FaqAccordionContent items={activeCategoryItems} categoryId={activeCategory} />
    </div>
  );
}

// Mobile view: Expandable category sections
function MobileFaqContent() {
  const [activeCategory, setActiveCategory] = useState(faq_categories[0].id);

  const toggleCategory = (categoryId: string) => {
    setActiveCategory(prev => prev === categoryId ? "" : categoryId);
  };

  // Animation for expandable sections
  const contentAnimation = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.3, delay: 0.1 }
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2 }
      }
    }
  };

  return (
    <div className="space-y-4 mb-12">
      {faq_categories.map(category => (
        <div key={category.id} className="w-full mb-4">
          <button
            onClick={() => toggleCategory(category.id)}
            className={`w-full text-left px-4 py-3 rounded-md transition-all duration-300 font-medium ${activeCategory === category.id
              ? "bg-sac-primary text-white"
              : "bg-black/5 text-black hover:bg-black/10"
              }`}
          >
            {category.title}
          </button>

          <AnimatePresence>
            {activeCategory === category.id && (
              <motion.div
                className="mt-4 overflow-hidden"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentAnimation}
              >
                <FaqAccordionContent items={category.items} categoryId={category.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// Main FAQ component
const Faq = () => {
  return (
    <div id="faq" className="container w-full space-y-8 md:space-y-12">
      <h2 className="font-bold text-3xl md:hidden text-center">
        Sıkça Sorulan Sorular
      </h2>

      {/* Responsive content switching */}
      <div className="block md:hidden">
        <MobileFaqContent />
      </div>
      <div className="hidden md:block">
        <DesktopFaqContent />
      </div>
    </div>
  );
};

export default Faq;

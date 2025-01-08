import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // ShadCN Input component
import { Label } from "@/components/ui/label"; // ShadCN Label component

const Checkout = ({ shareCount }: { shareCount: number }) => {
  const [formData, setFormData] = useState(
    Array(shareCount).fill({
      name: "",
      phone: "",
      delivery: false,
      point: "",
    })
  );

  const handleInputChange = (index: number, field: string, value: string | boolean) => {
    const updatedData = [...formData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setFormData(updatedData);
    console.log(updatedData)
  };

  const shareholders = [
    { id: 1, basePrice: 40000, deliveryCost: 500 },
    { id: 2, basePrice: 40000, deliveryCost: 500 },
  ];

  const totalCost = shareholders.reduce(
    (acc, shareholder) =>
      acc + shareholder.basePrice + shareholder.deliveryCost,
    0
  );

  return (
    <div className="flex gap-8">
      <Button>
        <i className="bi bi-plus-lg"></i>Bu kurbanlık için yeni hisse ekle
      </Button>
      <Accordion type="multiple" className="w-4/6" defaultValue={["0"]}>
        {Array.from({ length: shareCount }).map((_, index) => (
          <AccordionItem value={`${index}`} key={index} className="py-2">
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-2 font-heading text-left text-xl font-bold leading-6 transition-all [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 [&[data-state=open]>svg]:rotate-180">
                {`Form ${index + 1}`}
                <Plus
                  size={16}
                  strokeWidth={2}
                  className="shrink-0 opacity-60 transition-transform duration-200"
                  aria-hidden="true"
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionContent className="text-lg text-muted-foreground">
              {/* Form İçeriği */}
              <form className="flex flex-col space-y-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Ad Soyad</Label>
                  <Input
                    id={`name-${index}`}
                    placeholder="Ad Soyad"
                    value={formData[index]?.name || ""}
                    onChange={(e) =>
                      handleInputChange(index, "name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`phone-${index}`}>Telefon Numarası</Label>
                  <Input
                    id={`phone-${index}`}
                    placeholder="Telefon Numarası"
                    value={formData[index]?.phone || ""}
                    onChange={(e) =>
                      handleInputChange(index, "phone", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id={`delivery-${index}`}
                    type="checkbox"
                    checked={formData[index]?.delivery || false}
                    onChange={(e) =>
                      handleInputChange(index, "delivery", e.target.checked)
                    }
                    className="h-4 w-4 rounded border border-gray-300 bg-transparent text-primary focus:ring-2 focus:ring-primary"
                  />
                  <Label htmlFor={`delivery-${index}`}>
                    Hisse teslimat noktasından almak istiyorum.
                  </Label>
                </div>
                {formData[index]?.delivery && (
                  <div>
                    <Label htmlFor={`point-${index}`}>Teslimat Noktası</Label>
                    <Input
                      id={`point-${index}`}
                      placeholder="Teslimat Noktası"
                      value={formData[index]?.point || ""}
                      onChange={(e) =>
                        handleInputChange(index, "point", e.target.value)
                      }
                    />
                  </div>
                )}
              </form>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="border-l border-gray-400 h-full"></div>
      <div className="w-2/6 space-y-4">
        <div className="font-heading font-bold text-2xl text-left mb-8">
          Hesap Özeti
        </div>
        <div className="space-y-8">
          {shareholders.map((shareholder) => (
            <div key={shareholder.id} className="flex flex-col gap-2">
              <p className="font-bold text-xl text-secondary dark:text-primary">
                Hissedar {shareholder.id}
              </p>
              <div className="flex font-bold text-lg justify-between">
                <div>
                  <p>Hisse Bedeli</p>
                  <p>Eve Teslim</p>
                </div>
                <div className="font-heading text-right">
                  <p className="font-heading">{shareholder.basePrice} TL</p>
                  <p className="font-heading">{shareholder.deliveryCost} TL</p>
                </div>
              </div>
            </div>
          ))}

          {/* Toplam Tutar */}
          <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between items-center font-bold text-gray-800">
            <p>Ödeme Tutarı</p>
            <p>{totalCost} TL</p>
          </div>
        </div>

        {/* Onay Butonu */}
        <Button className="w-full bg-green-500 hover:bg-primary text-white py-2 rounded-md font-semibold">
          <i className="bi bi-check-lg"></i>
          Onayla
        </Button>
      </div>
    </div>
  );
};

export default Checkout;

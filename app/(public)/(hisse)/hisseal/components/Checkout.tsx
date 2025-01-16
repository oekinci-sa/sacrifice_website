import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sacrificeSchema } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/utils/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

interface CheckoutProps {
  sacrifice: sacrificeSchema | null;
  formData: any;
  setFormData: (data: any) => void;
  onApprove: () => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
  delivery_type?: string;
  delivery_location?: string;
}

const Checkout = ({ sacrifice, formData, setFormData, onApprove }: CheckoutProps) => {
  const [localFormData, setLocalFormData] = useState<any[]>([]);
  const [currentEmptyShare, setCurrentEmptyShare] = useState<number>(0);
  const [formErrors, setFormErrors] = useState<FormErrors[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (formData) {
      setLocalFormData(formData);
      setFormErrors(Array(formData.length).fill({}));
    } else if (sacrifice) {
      setLocalFormData(Array(1).fill({
        name: "",
        phone: "",
        delivery_type: "kesimhane",
        delivery_location: "",
      }));
      setFormErrors([{}]);
    }

    // Set up realtime subscription for empty_share updates
    if (sacrifice) {
      const subscription = supabase
        .channel(`sacrifice_${sacrifice.sacrifice_id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sacrifice_animals',
            filter: `sacrifice_id=eq.${sacrifice.sacrifice_id}`
          },
          async (payload: any) => {
            if (payload.new) {
              setCurrentEmptyShare(payload.new.empty_share);
            }
          }
        )
        .subscribe();

      // Initial empty_share value
      setCurrentEmptyShare(sacrifice.empty_share);

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [sacrifice, formData]);

  const validateField = (index: number, field: string, value: string) => {
    const errors = { ...formErrors[index] };
    
    switch (field) {
      case 'name':
        if (!value) {
          errors.name = "Ad soyad zorunludur";
        } else {
          delete errors.name;
        }
        break;
      case 'phone':
        if (!value) {
          errors.phone = "Telefon numarası zorunludur";
        } else if (!/^0[0-9]{10}$/.test(value)) {
          errors.phone = "Geçerli bir telefon numarası giriniz";
        } else {
          delete errors.phone;
        }
        break;
      case 'delivery_type':
        if (!value) {
          errors.delivery_type = "Teslimat tercihi zorunludur";
        } else {
          delete errors.delivery_type;
        }
        break;
      case 'delivery_location':
        if (localFormData[index]?.delivery_type === "toplu-teslim-noktasi" && !value) {
          errors.delivery_location = "Teslimat noktası seçiniz";
        } else {
          delete errors.delivery_location;
        }
        break;
    }

    const newFormErrors = [...formErrors];
    newFormErrors[index] = errors;
    setFormErrors(newFormErrors);
  };

  const handleInputChange = (index: number, field: string, value: string | boolean) => {
    const updatedData = [...localFormData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setLocalFormData(updatedData);
    setFormData(updatedData);
    validateField(index, field, value as string);
  };

  const handleAddShareholder = async () => {
    if (!sacrifice) return;

    console.log("Adding new shareholder for sacrifice:", sacrifice.sacrifice_id);

    const { data: latestSacrifice, error } = await supabase
      .from("sacrifice_animals")
      .select("*")
      .eq("sacrifice_id", sacrifice.sacrifice_id)
      .single();

    if (error || !latestSacrifice) {
      console.error("Error fetching sacrifice data:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
      });
      return;
    }

    console.log("Current empty_share:", latestSacrifice.empty_share);

    if (latestSacrifice.empty_share <= 0) {
      console.log("No empty shares available");
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bu kurbanlıkta yeterli boş hisse kalmamış.",
      });
      return;
    }

    // Decrease empty_share in the database
    const newEmptyShare = latestSacrifice.empty_share - 1;
    console.log("Decreasing empty_share to:", newEmptyShare);

    const { error: updateError } = await supabase
      .from("sacrifice_animals")
      .update({ empty_share: newEmptyShare })
      .eq("sacrifice_id", sacrifice.sacrifice_id);

    if (updateError) {
      console.error("Error updating empty_share:", updateError);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hisse eklenirken bir hata oluştu. Lütfen tekrar deneyin.",
      });
      return;
    }

    console.log("Successfully updated empty_share to:", newEmptyShare);

    // Update the state after successful database update
    const newData = [...localFormData, {
      name: "",
      phone: "",
      delivery_type: "kesimhane",
      delivery_location: "",
    }];
    setLocalFormData(newData);
    setFormData(newData);
    console.log("Added new shareholder form, total forms:", newData.length);
  };

  if (!sacrifice) {
    return null;
  }

  const basePrice = sacrifice.share_price;
  const deliveryCost = 500;

  return (
    <div className="flex gap-8">
      <div className="w-4/6">
        <Accordion type="multiple" className="w-full" defaultValue={["0"]}>
          {localFormData.map((_, index) => (
            <AccordionItem value={`${index}`} key={index} className="py-2">
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-2 font-heading text-left text-xl font-bold leading-6 transition-all [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 [&[data-state=open]>svg]:rotate-180">
                  {`Hissedar ${index + 1}`}
                  <Plus
                    size={16}
                    strokeWidth={2}
                    className="shrink-0 opacity-60 transition-transform duration-200"
                    aria-hidden="true"
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionContent className="text-lg text-muted-foreground">
                <form className="flex flex-col space-y-4">
                  <div>
                    <Label htmlFor={`name-${index}`}>Ad Soyad</Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="Ad Soyad"
                      value={localFormData[index]?.name || ""}
                      onChange={(e) =>
                        handleInputChange(index, "name", e.target.value)
                      }
                      className={formErrors[index]?.name ? "border-red-500" : ""}
                    />
                    {formErrors[index]?.name && (
                      <p className="text-sm text-red-500 mt-1">{formErrors[index].name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`phone-${index}`}>Telefon Numarası</Label>
                    <Input
                      id={`phone-${index}`}
                      placeholder="05555555555"
                      value={localFormData[index]?.phone || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        if (value.length <= 11) {
                          handleInputChange(index, "phone", value);
                        }
                      }}
                      className={formErrors[index]?.phone ? "border-red-500" : ""}
                    />
                    {formErrors[index]?.phone && (
                      <p className="text-sm text-red-500 mt-1">{formErrors[index].phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`delivery-${index}`}>Teslimat Tercihi</Label>
                    <Select
                      value={localFormData[index]?.delivery_type || "kesimhane"}
                      onValueChange={(value) => handleInputChange(index, "delivery_type", value)}
                    >
                      <SelectTrigger className={formErrors[index]?.delivery_type ? "border-red-500" : ""}>
                        <SelectValue placeholder="Teslimat türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kesimhane">Kesimhane'de Teslim</SelectItem>
                        <SelectItem value="toplu-teslim-noktasi">Toplu Teslimat Noktasında Teslim</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors[index]?.delivery_type && (
                      <p className="text-sm text-red-500 mt-1">{formErrors[index].delivery_type}</p>
                    )}
                  </div>
                  {localFormData[index]?.delivery_type === "toplu-teslim-noktasi" && (
                    <div>
                      <Label htmlFor={`location-${index}`}>Teslimat Noktası</Label>
                      <Select
                        value={localFormData[index]?.delivery_location || ""}
                        onValueChange={(value) => handleInputChange(index, "delivery_location", value)}
                      >
                        <SelectTrigger className={formErrors[index]?.delivery_location ? "border-red-500" : ""}>
                          <SelectValue placeholder="Teslimat noktası seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yenimahalle-pazar-yeri">Yenimahalle Pazar Yeri</SelectItem>
                          <SelectItem value="kecioren-otoparki">Keçiören Otoparkı</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors[index]?.delivery_location && (
                        <p className="text-sm text-red-500 mt-1">{formErrors[index].delivery_location}</p>
                      )}
                    </div>
                  )}
                </form>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {currentEmptyShare > 0 && (
          <Button 
            onClick={handleAddShareholder}
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hissedar Ekle
          </Button>
        )}
      </div>
      <div className="border-l border-gray-400 h-full"></div>
      <div className="w-2/6 space-y-4">
        <div className="font-heading font-bold text-2xl text-left mb-8">
          Hesap Özeti
        </div>
        <div className="space-y-8">
          {localFormData.map((data, index) => (
            <div key={index} className="flex flex-col gap-2">
              <p className="font-bold text-xl text-secondary dark:text-primary">
                Hissedar {index + 1}
              </p>
              <div className="flex font-bold text-lg justify-between">
                <div>
                  <p>Hisse Bedeli</p>
                  {data.delivery_type === "toplu-teslim-noktasi" && (
                    <p>Teslimat Ücreti</p>
                  )}
                </div>
                <div className="font-heading text-right">
                  <p>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(basePrice)}</p>
                  {data.delivery_type === "toplu-teslim-noktasi" && (
                    <p>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(deliveryCost)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between items-center font-bold text-gray-800">
            <p>Toplam Tutar</p>
            <p>
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                localFormData.reduce((total, data) => 
                  total + basePrice + (data.delivery_type === "toplu-teslim-noktasi" ? deliveryCost : 0), 
                0)
              )}
            </p>
          </div>
        </div>

        <Button 
          onClick={onApprove}
          className="w-full bg-green-500 hover:bg-primary text-white py-2 rounded-md font-semibold"
        >
          Onayla
        </Button>
      </div>
    </div>
  );
};

export default Checkout;

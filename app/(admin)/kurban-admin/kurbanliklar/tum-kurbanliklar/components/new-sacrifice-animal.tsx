"use client";

import { priceInfo } from '@/app/(public)/(anasayfa)/constants';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/useUsers";
import { triggerSacrificeRefresh } from "@/utils/data-refresh";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Kesim zamanı için özel input bileşeni
const TimeInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ onChange, value, ...props }, ref) => {
    const [time, setTime] = useState<string>(value as string || "");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/\D/g, '').substring(0, 4);
      let formattedValue = "";

      if (input.length > 2) {
        const hours = input.substring(0, 2);
        const minutes = input.substring(2, 4);
        formattedValue = `${hours}:${minutes}`;
      } else {
        formattedValue = input;
      }

      setTime(formattedValue);

      if (onChange) {
        const event = {
          target: { value: formattedValue }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
        placeholder="12:36"
        value={time}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
TimeInput.displayName = "TimeInput";

const formSchema = z.object({
  sacrifice_no: z.string().min(1, "Kurbanlık sırası zorunludur"),
  sacrifice_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Geçerli bir saat giriniz (ÖR: 12:36)"),
  weight_price: z.string({
    required_error: "Lütfen hisse ağırlığı/bedeli seçin",
  }),
  empty_share: z.coerce.number().min(0).max(7).default(7),
  notes: z.string().optional(),
});

export function NewSacrificeAnimal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPriceInfo, setSelectedPriceInfo] = useState(priceInfo[0] || { kg: '', price: '' });
  const { toast } = useToast();
  const { data: session } = useSession();
  const { data: userData } = useUser(session?.user?.email);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sacrifice_no: "",
      sacrifice_time: "",
      weight_price: "",
      empty_share: 7,
      notes: "",
    },
  });

  // Function to create a new sacrifice
  const createSacrifice = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (!userData?.name) {
        throw new Error("Kullanıcı bilgisi bulunamadı");
      }

      const newSacrifice = {
        sacrifice_no: values.sacrifice_no,
        sacrifice_time: values.sacrifice_time,
        share_weight: parseFloat(selectedPriceInfo.kg.replace(/[^\d.]/g, '')),
        share_price: parseInt(selectedPriceInfo.price.replace(/\./g, ''), 10),
        empty_share: values.empty_share,
        notes: values.notes || null,
        last_edited_time: new Date().toISOString(),
        last_edited_by: userData.name
      };

      const response = await fetch('/api/create-sacrifice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSacrifice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create sacrifice');
      }

      const result = await response.json();

      // Show success message
      toast({
        title: "Başarılı! ✅",
        description: "Yeni kurbanlık başarıyla eklendi!",
        variant: "default",
      });

      // Reset form and close dialog
      form.reset();
      setIsOpen(false);

      // Trigger a data refresh to update all components that display sacrifice data
      triggerSacrificeRefresh();

      return result;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata! ❌",
        description: `Kurbanlık eklenirken bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`,
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createSacrifice(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Yeni Kurbanlık
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Kurbanlık Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir kurbanlık eklemek için aşağıdaki formu doldurun.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sacrifice_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kurbanlık Sırası</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sacrifice_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kesim Zamanı</FormLabel>
                  <FormControl>
                    <TimeInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hisse Ağırlığı/Bedeli</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selected = priceInfo.find(item => item.kg === value);
                      if (selected) setSelectedPriceInfo(selected);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Hisse ağırlığı/bedeli seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priceInfo.map((item) => (
                        <SelectItem key={item.kg} value={item.kg}>
                          {item.kg} - {item.price} TL
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="empty_share"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Boş Hisse Sayısı</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={7}
                      {...field}
                      onChange={(e) => {
                        // Ensure the value is between 0 and 7
                        const value = parseInt(e.target.value);
                        if (value >= 0 && value <= 7) {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kurbanlık hakkında ekstra bilgiler..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
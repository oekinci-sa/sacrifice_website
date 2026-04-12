"use client";

import { adminPrimaryCtaClassName } from "@/lib/admin-tenant-accent";
import { loadAdminPriceInfoOptions } from "@/lib/admin-price-info-cache";
import { cn } from "@/lib/utils";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { Button } from "@/components/ui/button";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
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
import { triggerSacrificeRefresh } from "@/utils/data-refresh";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useEffect, useState } from "react";
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
  animal_type: z.string().optional(),
  notes: z.string().optional(),
});

export function NewSacrificeAnimal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceOptions, setPriceOptions] = useState<{ kg: string; price: string }[]>([]);
  const [selectedPriceInfo, setSelectedPriceInfo] = useState<{ kg: string; price: string }>({ kg: "", price: "" });
  const { toast } = useToast();
  const { data: session } = useSession();
  const branding = useTenantBranding();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);

  useEffect(() => {
    let cancelled = false;
    const slug = branding.logo_slug ?? "ankara-kurban";
    loadAdminPriceInfoOptions(selectedYear, slug).then((rows) => {
      if (cancelled) return;
      const opts = rows.map((d) => ({
        kg: `${d.kg} kg`,
        price: String(d.price).replace(/\B(?=(\d{3})+(?!\d))/g, "."),
      }));
      if (opts.length > 0) {
        setPriceOptions(opts);
        setSelectedPriceInfo(opts[0]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [branding.logo_slug, selectedYear]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sacrifice_no: "",
      sacrifice_time: "",
      weight_price: "",
      empty_share: 7,
      animal_type: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (priceOptions.length > 0 && !form.getValues("weight_price")) {
      form.setValue("weight_price", priceOptions[0].kg);
      setSelectedPriceInfo(priceOptions[0]);
    }
  }, [priceOptions, form]);

  // Function to create a new sacrifice
  const createSacrifice = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const userEmail = session?.user?.email;
      if (!userEmail) {
        throw new Error("Kullanıcı bilgisi bulunamadı");
      }

      const newSacrifice = {
        sacrifice_no: values.sacrifice_no,
        sacrifice_time: values.sacrifice_time,
        share_weight: parseFloat(selectedPriceInfo.kg.replace(/[^\d.]/g, '')),
        share_price: parseInt(selectedPriceInfo.price.replace(/\./g, ''), 10),
        empty_share: values.empty_share,
        animal_type: values.animal_type || null,
        notes: values.notes || null,
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
      <Button
        onClick={() => setIsOpen(true)}
        className={cn("gap-2", adminPrimaryCtaClassName(branding.logo_slug))}
      >
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
                      const selected = priceOptions.find(item => item.kg === value);
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
                      {priceOptions.map((item) => (
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
                  <Select
                    value={field.value != null ? String(field.value) : "7"}
                    onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Boş hisse sayısı seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
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
              name="animal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hayvan Cinsi (Opsiyonel)</FormLabel>
                  <Select
                    value={field.value || "_empty"}
                    onValueChange={(v) => field.onChange(v === "_empty" ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Cins seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_empty">-</SelectItem>
                      <SelectItem value="Dana">Dana</SelectItem>
                      <SelectItem value="Düve">Düve</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(adminPrimaryCtaClassName(branding.logo_slug))}
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
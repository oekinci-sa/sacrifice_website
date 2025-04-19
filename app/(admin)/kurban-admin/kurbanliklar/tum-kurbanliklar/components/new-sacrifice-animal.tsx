"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  weight_price: z.string().min(1, "Ağırlık ve fiyat seçimi zorunludur"),
  notes: z.string().optional(),
});

// Sabit ağırlık ve fiyat seçenekleri
const WEIGHT_PRICE_OPTIONS = [
  { id: "1", share_weight: 26, price: 30000 },
  { id: "2", share_weight: 30, price: 36000 },
  { id: "3", share_weight: 35, price: 42000 },
  { id: "4", share_weight: 40, price: 48000 },
  { id: "5", share_weight: 45, price: 54000 },
  { id: "6", share_weight: 50, price: 60000 },
  { id: "7", share_weight: 55, price: 66000 },
  { id: "8", share_weight: 60, price: 72000 },
  { id: "9", share_weight: 65, price: 78000 },
];

export function NewSacrificeAnimal() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: userData } = useUser(session?.user?.email);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sacrifice_no: "",
      sacrifice_time: "",
      weight_price: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!userData?.name) {
        throw new Error("Kullanıcı bilgisi bulunamadı");
      }

      const selectedOption = WEIGHT_PRICE_OPTIONS.find(
        option => option.id === values.weight_price
      );

      if (!selectedOption) throw new Error("Geçersiz ağırlık/fiyat seçimi");

      const newSacrifice = {
        sacrifice_no: values.sacrifice_no,
        sacrifice_time: values.sacrifice_time,
        share_weight: Number(selectedOption.share_weight),
        share_price: Number(selectedOption.price),
        empty_share: 7,
        notes: values.notes || null,
        last_edited_by: userData.name
      };

      const response = await fetch('/api/sacrifices', {
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

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı! ✅",
        description: "Yeni kurbanlık başarıyla eklendi!",
        variant: "default",
      });
      form.reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['sacrifices'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata! ❌",
        description: `Kurbanlık eklenirken bir hata oluştu: ${error instanceof Error ? error.message : String(error)
          }`,
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
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
                  <FormLabel>Hisse Bedeli ve Ağırlığı</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Hisse bedeli ve ağırlık seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WEIGHT_PRICE_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.price.toLocaleString('tr-TR')} TL / {option.share_weight} kg
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
              >
                İptal
              </Button>
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
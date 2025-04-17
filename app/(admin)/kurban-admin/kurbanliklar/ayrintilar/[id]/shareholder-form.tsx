import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ShareholderFormValues } from "@/types";
import { formatPhoneForDB } from "@/utils/formatters";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ShareholderFormProps {
  shareholder: {
    shareholder_id: string;
    shareholder_name: string;
    phone_number: string;
    delivery_fee: number;
    delivery_location: string;
    sacrifice_consent: boolean;
    paid_amount: number;
    total_amount: number;
    notes?: string;
    purchase_time?: string;
    last_edited_by?: string;
  };
  index: number;
  onSubmit: (values: ShareholderFormValues, shareholderId: string) => Promise<void>;
}

const formSchema = z.object({
  name: z.string().min(1, "Ad soyad zorunludur"),
  phone: z.string()
    .regex(/^0/, "Telefon numarası 0 ile başlamalıdır")
    .refine(
      (val) => val.replace(/\s/g, '').length === 11,
      "Telefon numarası 11 haneli olmalıdır"
    ),
  delivery_location: z.string().min(1, "Teslimat noktası seçiniz"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ShareholderForm({
  shareholder,
  onSubmit,
}: ShareholderFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: shareholder.shareholder_name,
      phone: shareholder.phone_number.startsWith("+90")
        ? "0" + shareholder.phone_number.slice(3)
        : shareholder.phone_number,
      delivery_location: shareholder.delivery_location,
      notes: shareholder.notes || "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const formattedValues: ShareholderFormValues = {
      shareholder_name: values.name,
      phone_number: formatPhoneForDB(values.phone),
      delivery_location: values.delivery_location as "Kesimhane" | "Ulus",
      notes: values.notes || "",
      // Preserve existing values from the shareholder
      total_amount: shareholder.total_amount,
      paid_amount: shareholder.paid_amount,
      remaining_payment: shareholder.total_amount - shareholder.paid_amount,
      delivery_fee: values.delivery_location === "Kesimhane" ? 0 : 750,
      sacrifice_consent: shareholder.sacrifice_consent
    };
    onSubmit(formattedValues, shareholder.shareholder_id);
  });

  return (
    <div className="space-y-16">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Hissedar Bilgileri */}
          <div>
            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-3">
                <h3 className="font-semibold text-lg">
                  Hissedar Bilgileri
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Kayıt Tarihi: {shareholder.purchase_time ? new Date(shareholder.purchase_time).toLocaleString("tr-TR") : "-"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Son düzenleyen: {shareholder.last_edited_by || "-"}
                </p>
              </div>
              <div className="col-span-9 grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hissedar Adı</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon Numarası</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="05XX XXX XX XX"
                          onKeyPress={(e) => {
                            // Sadece rakam ve backspace'e izin ver
                            if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            // Sadece rakamları al
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Separator />
          </div>

          {/* Teslimat Bilgileri */}
          <div>
            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-3">
                <h3 className="font-semibold text-lg">
                  Teslimat Bilgileri
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Mevcut Teslimat Türü: {shareholder.delivery_location === "Kesimhane" ? "Kesimhane" : "Ulus (+750 TL)"}
                </p>
              </div>
              <div className="col-span-9">
                <FormField
                  control={form.control}
                  name="delivery_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teslimat Noktası</FormLabel>
                      <div className="flex gap-4 mt-1">
                        <Button
                          type="button"
                          onClick={() => field.onChange("Kesimhane")}
                          className={cn(
                            "flex-1 border border-gray-200 transition-all",
                            field.value === "Kesimhane"
                              ? "bg-primary text-white"
                              : "bg-background hover:bg-muted text-foreground"
                          )}
                        >
                          Kesimhane
                        </Button>
                        <Button
                          type="button"
                          onClick={() => field.onChange("Ulus")}
                          className={cn(
                            "flex-1 border border-gray-200 transition-all",
                            field.value === "Ulus"
                              ? "bg-primary text-white"
                              : "bg-background hover:bg-muted text-foreground"
                          )}
                        >
                          Ulus (+750 TL)
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Separator />
          </div>

          {/* Diğer Bilgiler */}
          <div>
            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-3">
                <h3 className="font-semibold text-lg">
                  Diğer Bilgiler
                </h3>
              </div>
              <div className="col-span-9 space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Değişiklikleri Kaydet
          </Button>
        </form>
      </Form>
    </div>
  );
}

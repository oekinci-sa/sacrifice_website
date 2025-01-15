import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { ShareholderFormValues, shareholderFormSchema } from "@/types";
import { formatPhoneForDB, formatPhoneForDisplay } from "@/utils/formatters";
import { Separator } from "@/components/ui/separator";

interface ShareholderFormProps {
  shareholder: any;
  index: number;
  onSubmit: (
    values: ShareholderFormValues,
    shareholderId: string
  ) => Promise<void>;
}

export function ShareholderForm({
  shareholder,
  index,
  onSubmit,
}: ShareholderFormProps) {
  const form = useForm<ShareholderFormValues>({
    resolver: zodResolver(shareholderFormSchema),
    defaultValues: {
      shareholder_name: shareholder.shareholder_name || "",
      phone_number: formatPhoneForDisplay(shareholder.phone_number) || "",
      total_amount: Number(shareholder.total_amount) || 0,
      paid_amount: Number(shareholder.paid_amount) || 0,
      remaining_payment: Number(shareholder.remaining_payment) || 0,
      delivery_fee: Number(shareholder.delivery_fee) || 0,
      delivery_type: shareholder.delivery_type || "kesimhane",
      delivery_location: shareholder.delivery_location || "yenimahalle-camii",
      sacrifice_consent:
        typeof shareholder.sacrifice_consent === "boolean"
          ? shareholder.sacrifice_consent
          : false,
      notes: shareholder.notes || "",
    },
  });

  // Watch for delivery type changes to update delivery fee
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "delivery_type") {
        const deliveryFee = value.delivery_type === "toplu-teslimat" ? 500 : 0;
        form.setValue("delivery_fee", deliveryFee);
        
        // Update total amount
        const newTotalAmount = (shareholder.share_price || 0) + deliveryFee;
        form.setValue("total_amount", newTotalAmount);
        
        // Update remaining payment
        const paidAmount = form.getValues("paid_amount");
        form.setValue("remaining_payment", newTotalAmount - paidAmount);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, shareholder.share_price]);

  const handleSubmit = form.handleSubmit((values) => {
    const formattedValues = {
      ...values,
      phone_number: formatPhoneForDB(values.phone_number),
    };
    onSubmit(formattedValues, shareholder.shareholder_id);
  });

  const getPaymentStatus = (paid: number, remaining: number) => {
    if (paid < 2000) return "Kapora bekleniyor.";
    if (remaining > 0) return "Kapora ödendi. Kalan ödeme bekleniyor.";
    return "Ödeme tamamlandı.";
  };

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
                  Kayıt Tarihi: {new Date(shareholder.purchase_time || "").toLocaleString("tr-TR")}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Son düzenleyen: {shareholder.last_edited_by}
                </p>
              </div>
              <div className="col-span-9 grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="shareholder_name"
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
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon Numarası</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="05555555555"
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

          {/* Ödeme Bilgileri */}
          <div>
            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-3">
                <h3 className="font-semibold text-lg">
                  Ödeme Bilgileri
                </h3>
                <div className="space-y-2 mt-2 text-sm text-muted-foreground">
                  <p>Toplam Tutar: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(form.getValues("total_amount"))}</p>
                  <p>Kalan Ödeme: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(form.getValues("remaining_payment"))}</p>
                  <p>Ödeme Durumu: {getPaymentStatus(form.getValues("paid_amount"), form.getValues("remaining_payment"))}</p>
                </div>
              </div>
              <div className="col-span-9">
                <FormField
                  control={form.control}
                  name="paid_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ödenen Tutar</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const paidAmount = Number(e.target.value);
                            field.onChange(paidAmount);
                            const totalAmount = form.getValues("total_amount");
                            form.setValue("remaining_payment", totalAmount - paidAmount);
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
                  Mevcut Teslimat Türü: {shareholder.delivery_type === "kesimhane" ? "Kesimhane'de Teslim" : "Toplu Teslimat Noktasında Teslim"}
                </p>
                {shareholder.delivery_type === "toplu-teslimat" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Teslimat Noktası: {shareholder.delivery_location === "yenimahalle-camii" ? "Yenimahalle Camii" : "Keçiören Pazar Yeri"}
                  </p>
                )}
              </div>
              <div className="col-span-9">
                <FormField
                  control={form.control}
                  name="delivery_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teslimat Türü</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              {field.value === "kesimhane" ? "Kesimhane'de Teslim" : "Toplu Teslimat Noktasında Teslim"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kesimhane">
                            Kesimhane'de Teslim
                          </SelectItem>
                          <SelectItem value="toplu-teslimat">
                            Toplu Teslimat Noktasında Teslim
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("delivery_type") === "toplu-teslimat" && (
                  <FormField
                    control={form.control}
                    name="delivery_location"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Teslimat Noktası</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue>
                                {field.value === "yenimahalle-camii" ? "Yenimahalle Camii" : "Keçiören Pazar Yeri"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yenimahalle-camii">
                              Yenimahalle Camii
                            </SelectItem>
                            <SelectItem value="kecioren-pazar">
                              Keçiören Pazar Yeri
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                  name="sacrifice_consent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vekalet</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "verildi")
                        }
                        value={field.value ? "verildi" : "bekleniyor"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vekalet durumu seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="verildi">Verildi</SelectItem>
                          <SelectItem value="bekleniyor">Bekleniyor</SelectItem>
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

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
import { Card, CardContent } from "@/components/ui/card";
import { ShareholderFormValues, shareholderFormSchema } from "@/types";
import { Separator } from "@/components/ui/separator";

interface ShareholderFormProps {
  shareholder: any;
  index: number;
  onSubmit: (values: ShareholderFormValues, shareholderId: string) => Promise<void>;
}

export function ShareholderForm({ shareholder, index, onSubmit }: ShareholderFormProps) {
  const form = useForm<ShareholderFormValues>({
    resolver: zodResolver(shareholderFormSchema),
    defaultValues: {
      shareholder_name: shareholder.shareholder_name || "",
      phone_number: shareholder.phone_number || "",
      total_amount_to_pay: Number(shareholder.total_amount_to_pay) || 0,
      deposit_payment: Number(shareholder.deposit_payment) || 0,
      remaining_payment: Number(shareholder.remaining_payment) || 0,
      payment_status: shareholder.payment_status || "pending",
      delivery_fee: Number(shareholder.delivery_fee) || 0,
      delivery_type: shareholder.delivery_type || "kesimhane",
      delivery_location: shareholder.delivery_location || "yenimahalle-camii",
      vekalet: typeof shareholder.vekalet === 'boolean' ? shareholder.vekalet : false,
      notes: shareholder.notes || "",
    },
  });

  return (
    <div className="space-y-12">
      {/* Statik Bilgiler */}
      <Card className="bg-muted/50 shadow-none border-none">
        <CardContent className="grid grid-cols-3 gap-4 p-6">
          <div>
            <p className="text-sm font-medium">Kayıt Tarihi</p>
            <p className="text-sm text-muted-foreground">
              {new Date(shareholder.purchase_time || "").toLocaleString("tr-TR")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Hissedar ID</p>
            <p className="text-sm text-muted-foreground">{shareholder.shareholder_id}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Son Düzenleyen</p>
            <p className="text-sm text-muted-foreground">{shareholder.last_edited_by}</p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => onSubmit(values, shareholder.shareholder_id))} className="space-y-16">
          {/* Hissedar Bilgileri */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <h3 className="font-semibold text-lg sticky top-0">Hissedar Bilgileri</h3>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator className="my-12" />

          {/* Ödeme Bilgileri */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <h3 className="font-semibold text-lg sticky top-0">Ödeme Bilgileri</h3>
            </div>
            <div className="col-span-9 grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="total_amount_to_pay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toplam Tutar</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deposit_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kapora</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remaining_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kalan Ödeme</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ödeme Durumu</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Ödeme durumu seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paid">Ödendi</SelectItem>
                        <SelectItem value="pending">Bekliyor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator className="my-12" />

          {/* Teslimat Bilgileri */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <h3 className="font-semibold text-lg sticky top-0">Teslimat Bilgileri</h3>
            </div>
            <div className="col-span-9 grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="delivery_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teslimat Türü</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Teslimat türü seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kesimhane">Kesimhane'de Teslim</SelectItem>
                        <SelectItem value="toplu-teslimat">Toplu Teslimat Noktasında Teslim</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teslimat Noktası</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Teslimat noktası seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yenimahalle-camii">Yenimahalle Camii</SelectItem>
                        <SelectItem value="kecioren-pazar">Keçiören Pazar Yeri</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teslimat Ücreti</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator className="my-12" />

          {/* Diğer Bilgiler */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <h3 className="font-semibold text-lg sticky top-0">Diğer Bilgiler</h3>
            </div>
            <div className="col-span-9 grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="vekalet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vekalet Durumu</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "verildi")} 
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

          <Button type="submit" className="w-full mt-12">
            Değişiklikleri Kaydet
          </Button>
        </form>
      </Form>
    </div>
  );
} 
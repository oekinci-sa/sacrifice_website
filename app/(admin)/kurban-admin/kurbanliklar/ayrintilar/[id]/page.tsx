"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ShareholderFormValues, shareholderFormSchema } from "@/types";
import { supabase } from "@/utils/supabaseClient";

interface Shareholder extends ShareholderFormValues {
  shareholder_id: string;
  purchase_time: string;
  last_edited_by: string;
}

export default function DetailsPage() {
  const { id } = useParams();
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(true);

  // Veri yükleme
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from("shareholders")
        .select("*")
        .eq("sacrifice_no", id);

      if (error) {
        toast.error("Veri yüklenirken hata oluştu");
        console.error(error);
      } else if (data) {
        setShareholders(data);
      }
      setLoading(false);
    }

    fetchData();
  }, [id]);

  // Form gönderimi
  async function onSubmit(values: ShareholderFormValues, shareholderId: string) {
    try {
      const { error } = await supabase
        .from("shareholders")
        .update(values)
        .eq("shareholder_id", shareholderId);

      if (error) throw error;
      toast.success("Bilgiler başarıyla güncellendi");
    } catch (error) {
      toast.error("Güncelleme sırasında bir hata oluştu");
      console.error(error);
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Kurban No: {id} - Hissedar Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {shareholders.map((shareholder, index) => (
              <ShareholderForm 
                key={shareholder.shareholder_id}
                shareholder={shareholder}
                index={index + 1}
                onSubmit={onSubmit}
              />
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

interface ShareholderFormProps {
  shareholder: Shareholder;
  index: number;
  onSubmit: (values: ShareholderFormValues, shareholderId: string) => Promise<void>;
}

function ShareholderForm({ shareholder, index, onSubmit }: ShareholderFormProps) {
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
    <AccordionItem value={`item-${index}`}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-medium">{index}. Hissedar</span>
          <span className="text-sm text-muted-foreground">
            {shareholder.shareholder_name || "İsimsiz Hissedar"}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {/* Statik Bilgiler */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-lg">
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
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => onSubmit(values, shareholder.shareholder_id))} className="space-y-8">
            {/* Hissedar Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Hissedar Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4">
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

            {/* Ödeme Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ödeme Bilgileri</h3>
              <div className="grid grid-cols-3 gap-4">
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

            {/* Teslimat Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Teslimat Bilgileri</h3>
              <div className="grid grid-cols-3 gap-4">
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

            {/* Diğer Bilgiler */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Diğer Bilgiler</h3>
              <div className="grid grid-cols-2 gap-4">
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

            <Button type="submit" className="w-full">
              Değişiklikleri Kaydet
            </Button>
          </form>
        </Form>
      </AccordionContent>
    </AccordionItem>
  );
}

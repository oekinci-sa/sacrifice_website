"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Search } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { formatPhoneForDisplay } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { TripleInfo } from "@/app/(public)/components/triple-info";

interface ShareholderInfo {
  shareholder_name: string;
  phone_number: string;
  delivery_type: string;
  delivery_location: string;
  sacrifice_id: string;
  total_amount: number;
  paid_amount: number;
  remaining_payment: number;
  purchase_time: string;
  sacrifice: {
    sacrifice_no: string;
    sacrifice_time: string;
    share_price: number;
  };
}

export default function HisseSorgula() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareholderInfo, setShareholderInfo] =
    useState<ShareholderInfo | null>(null);

  const { toast } = useToast();

  const handleSearch = async () => {
    if (!phone) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen bir telefon numarası girin",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setShareholderInfo(null);

    try {
      // Telefon numarasını formatlama
      let formattedPhone = phone;

      // Başındaki 0'ı kaldır
      if (formattedPhone.startsWith("0")) {
        formattedPhone = formattedPhone.substring(1);
      }

      // +90 veya 90'ı kaldır
      formattedPhone = formattedPhone.replace(/^(\+90|90)/, "");

      // Sadece rakamları al
      formattedPhone = formattedPhone.replace(/\D/g, "");

      // Final format: +90 ile başlayan 12 haneli numara
      formattedPhone = `+90${formattedPhone}`;

      console.log("Arama yapılan numara:", formattedPhone); // Debug için

      // Önce tüm kayıtları al ve purchase_time'a göre sırala
      const { data, error: queryError } = await supabase
        .from("shareholders")
        .select(
          `
          *,
          sacrifice:sacrifice_animals (
            sacrifice_no,
            sacrifice_time,
            share_price
          )
        `
        )
        .eq("phone_number", formattedPhone)
        .order("purchase_time", { ascending: false });

      if (queryError) throw queryError;
      if (!data || data.length === 0) {
        setError("Bu telefon numarasına ait kayıt bulunamadı.");
        return;
      }

      // En son kaydı al
      setShareholderInfo(data[0] as ShareholderInfo);

      // Eğer birden fazla kayıt varsa bilgilendirme yap
      if (data.length > 1) {
        console.log(
          `Bu telefon numarasına ait ${data.length} kayıt bulundu. En son kayıt gösteriliyor.`
        );
      }

      toast({
        title: "Başarılı",
        description: "Hissedar bilgileri güncellendi.",
      });
    } catch (err) {
      console.error("Error fetching shareholder:", err);
      setError("Bilgiler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");

      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bilgiler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // PDF indirme işlemi burada yapılacak
    console.log("PDF indiriliyor...");
  };

  const getDeliveryLocationText = (location: string) => {
    switch (location) {
      case "kesimhane":
        return "Kesimhanede Teslim";
      case "yenimahalle-pazar-yeri":
        return "Yenimahalle Pazar Yeri";
      case "kecioren-otoparki":
        return "Keçiören Otoparkı";
      default:
        return location;
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col items-center justify-center max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">Hisse Sorgula</h1>
          <p className="text-muted-foreground">
            Hisse bilgilerinizi sorgulamak için telefon numaranızı giriniz.
          </p>
        </div>

        <div className="w-full space-y-4">
          <Input
            type="tel"
            placeholder="05555555555"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="text-center text-lg"
          />
          <Button
            onClick={handleSearch}
            className="w-full"
            disabled={!phone || loading}
          >
            {loading ? (
              "Yükleniyor..."
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Sorgula
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-destructive mt-2 text-sm">{error}</p>}

        {shareholderInfo && (
          <div className="space-y-8">
            {/* Üst Navigasyon ve Başlık */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Orders</span>
                <span>/</span>
                <span>Invoice</span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-sac-primary/10 p-2 rounded">
                    <div className="w-8 h-8 bg-sac-primary/20 rounded" />
                  </div>
                  <h1 className="text-2xl font-semibold">
                    Invoice #{shareholderInfo.sacrifice.sacrifice_no}
                  </h1>
                </div>
                <Button
                  variant="outline"
                  className="bg-sac-primary text-primary-foreground hover:bg-sac-primary/90"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Ana İçerik */}
            <div className="grid grid-cols-3 gap-8">
              {/* Sol Kolon - Hissedar Bilgileri */}
              <div>
                <h3 className="font-heading text-xl font-bold text-sac-primary mb-4">
                  Hissedar Bilgileri
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Ad Soyad:</p>
                    <p>{shareholderInfo.shareholder_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Telefon:</p>
                    <p>{formatPhoneForDisplay(shareholderInfo.phone_number)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Teslim Yeri:</p>
                    <p>
                      {getDeliveryLocationText(
                        shareholderInfo.delivery_location
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Orta Kolon - Ödeme Bilgileri */}
              <div>
                <h3 className="font-heading text-xl font-bold text-sac-primary mb-4">
                  Ödeme Bilgileri
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Toplam Tutar:</p>
                    <p>
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(shareholderInfo.total_amount)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Ödenen Tutar:</p>
                    <p>
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(shareholderInfo.paid_amount)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Kalan Ödeme:</p>
                    <p>
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(shareholderInfo.remaining_payment)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Ödeme Durumu:</p>
                    <p>
                      {shareholderInfo.paid_amount < 2000
                        ? "Kapora bekleniyor."
                        : shareholderInfo.remaining_payment > 0
                        ? "Kalan ödeme bekleniyor."
                        : "Ödeme tamamlandı."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sağ Kolon - Kurbanlık Bilgileri */}
              <div>
                <h3 className="font-heading text-xl font-bold text-sac-primary mb-4">
                  Kurbanlık Bilgileri
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Kurban No:</p>
                    <p>{shareholderInfo.sacrifice.sacrifice_no}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Hisse Bedeli:</p>
                    <p>
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(shareholderInfo.sacrifice.share_price)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Kesim Saati:</p>
                    <p>
                      {new Date(
                        shareholderInfo.sacrifice.sacrifice_time
                      ).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Hisse Alım Tarihi:</p>
                    <p>
                      {new Date(
                        shareholderInfo.purchase_time
                      ).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Alt Bilgiler */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  Önemli Bilgiler
                </h3>
                <p className="text-sm text-muted-foreground">
                  Kurban kesim yerimiz, Kahramankazan&apos;a bağlı Ciğir köyündedir.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  Hatırlatmalar
                </h3>
                <p className="text-sm text-muted-foreground">
                  Kesim günü geldiğinde size SMS ile bilgilendirme yapılacaktır.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  İletişim
                </h3>
                <p className="text-sm text-muted-foreground">
                  Herhangi bir sorunuz olursa lütfen bizimle iletişime geçin.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <TripleInfo />
    </div>
  );
}

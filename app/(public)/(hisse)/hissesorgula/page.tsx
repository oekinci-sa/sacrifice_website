"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Search } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { formatPhoneForDisplay } from "@/utils/formatters";

interface ShareholderInfo {
  shareholder_name: string;
  phone_number: string;
  delivery_type: string;
  delivery_location: string;
  sacrifice_id: string;
  total_amount: number;
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
  const [shareholderInfo, setShareholderInfo] = useState<ShareholderInfo | null>(null);

  const handleSearch = async () => {
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
        .select(`
          *,
          sacrifice:sacrifice_id (
            sacrifice_no,
            sacrifice_time,
            share_price
          )
        `)
        .eq("phone_number", formattedPhone)
        .order('purchase_time', { ascending: false });

      if (queryError) throw queryError;
      if (!data || data.length === 0) {
        setError("Bu telefon numarasına ait kayıt bulunamadı.");
        return;
      }

      // En son kaydı al
      setShareholderInfo(data[0] as ShareholderInfo);
      
      // Eğer birden fazla kayıt varsa bilgilendirme yap
      if (data.length > 1) {
        console.log(`Bu telefon numarasına ait ${data.length} kayıt bulundu. En son kayıt gösteriliyor.`);
      }

    } catch (err) {
      console.error("Error fetching shareholder:", err);
      setError("Bilgiler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // PDF indirme işlemi burada yapılacak
    console.log("PDF indiriliyor...");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        {/* Title */}
        <div className="font-heading font-bold text-4xl text-center mb-4">
          Hisse Sorgula
        </div>

        {/* Arama Alanı */}
        <div className="flex gap-4">
          <Input
            placeholder="Telefon numaranızı girin (05555555555)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Sorgula
          </Button>
        </div>
        {error && (
          <p className="text-destructive mt-2 text-sm">{error}</p>
        )}

        {/* Üçlü Bilgi Alanı */}
        <div className="grid grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading text-xl font-bold text-primary mb-4">
              Kapora Adresi
            </h3>
            <div className="space-y-2 text-muted-foreground">
              <p>Kahramankazan Ciğir Köyü</p>
              <p>Kesimhane Binası</p>
              <p>No: 123</p>
            </div>
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-primary mb-4">
              Kapora
            </h3>
            <div className="space-y-2 text-muted-foreground">
              <p>Minimum kapora tutarı: 2.000₺</p>
              <p>Kapora ödemesi yapılmayan hisseler iptal edilecektir.</p>
            </div>
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-primary mb-4">
              Tüm Ödemeler
            </h3>
            <div className="space-y-2 text-muted-foreground">
              <p>Tüm ödemeler en geç kurban kesim gününe kadar tamamlanmalıdır.</p>
              <p>Kesim günü nakit ödeme kabul edilmeyecektir.</p>
            </div>
          </div>
        </div>

        {/* Sonuç Alanı */}
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
                  <div className="bg-primary/10 p-2 rounded">
                    <div className="w-8 h-8 bg-primary/20 rounded" />
                  </div>
                  <h1 className="text-2xl font-semibold">Invoice #{shareholderInfo.sacrifice.sacrifice_no}</h1>
                </div>
                <Button variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Ana İçerik */}
            <div className="grid grid-cols-3 gap-8">
              {/* Sol Kolon - Hissedar Bilgileri */}
              <div>
                <h3 className="font-heading text-xl font-bold text-primary mb-4">
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
                      {shareholderInfo.delivery_type === "kesimhane"
                        ? "Kesimhane"
                        : shareholderInfo.delivery_location === "yenimahalle-camii"
                        ? "Yenimahalle Camii"
                        : "Keçiören Pazar Yeri"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Orta Kolon - Ödeme Bilgileri */}
              <div>
                <h3 className="font-heading text-xl font-bold text-primary mb-4">
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
                <h3 className="font-heading text-xl font-bold text-primary mb-4">
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
                      {new Date(shareholderInfo.sacrifice.sacrifice_time).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="font-semibold">Hisse Alım Tarihi:</p>
                    <p>
                      {new Date(shareholderInfo.purchase_time).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Alt Bilgiler */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="font-heading text-lg font-semibold mb-2">Önemli Bilgiler</h3>
                <p className="text-sm text-muted-foreground">
                  Kurban kesim yerimiz, Kahramankazan'a bağlı Ciğir köyündedir.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold mb-2">Hatırlatmalar</h3>
                <p className="text-sm text-muted-foreground">
                  Kesim günü geldiğinde size SMS ile bilgilendirme yapılacaktır.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold mb-2">İletişim</h3>
                <p className="text-sm text-muted-foreground">
                  Herhangi bir sorunuz olursa lütfen bizimle iletişime geçin.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

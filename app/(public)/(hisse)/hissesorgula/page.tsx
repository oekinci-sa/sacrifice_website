"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ShareholderDetails } from "./components/shareholder-details";

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
  sacrifice_consent: boolean;
  sacrifice: {
    sacrifice_no: string;
    sacrifice_time: string;
    share_price: number;
  };
}

// Telefon numarası formatlama fonksiyonu
const formatPhoneNumber = (value: string) => {
  // Sadece rakamları al
  const numbers = value.replace(/\D/g, '');
  
  // Eğer numara boşsa, boş string döndür
  if (!numbers) return '';

  // Başında 0 varsa
  if (numbers.startsWith('0')) {
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
    if (numbers.length <= 10) return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`;
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
  }
  
  // Başında 0 yoksa, otomatik ekle
  const withZero = '0' + numbers;
  if (withZero.length <= 4) return withZero;
  if (withZero.length <= 7) return `${withZero.slice(0, 4)} ${withZero.slice(4)}`;
  if (withZero.length <= 10) return `${withZero.slice(0, 4)} ${withZero.slice(4, 7)} ${withZero.slice(7)}`;
  return `${withZero.slice(0, 4)} ${withZero.slice(4, 7)} ${withZero.slice(7, 9)} ${withZero.slice(9, 11)}`;
};

// Telefon numarası doğrulama fonksiyonu
const validatePhoneNumber = (phone: string) => {
  const digitsOnly = phone.replace(/\D/g, '');
  if (!phone.startsWith('0')) return false;
  if (digitsOnly.length !== 11) return false;
  if (!digitsOnly.startsWith('05')) return false;
  return true;
};

export default function HisseSorgula() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareholderInfo, setShareholderInfo] = useState<ShareholderInfo | null>(null);
  const { toast } = useToast();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setPhone(formattedValue);
    setError(null); // Kullanıcı yazmaya başladığında hata mesajını temizle
  };

  const handleSearch = async () => {
    // Telefon numarası doğrulama
    if (!validatePhoneNumber(phone)) {
      setError("Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX)");
      return;
    }

    setLoading(true);
    setError(null);
    setShareholderInfo(null);

    try {
      // Telefon numarasını formatlama
      let formattedPhone = phone.replace(/\D/g, '');
      formattedPhone = `+90${formattedPhone.substring(1)}`; // Başındaki 0'ı kaldır ve +90 ekle

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

  return (
    <div>
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
              placeholder="05XX XXX XX XX"
              value={phone}
              onChange={handlePhoneChange}
              className={cn(
                "text-center text-sm md:text-lg",
                error ? "border-destructive focus-visible:ring-destructive" : ""
              )}
            />
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
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
        </div>

        {/* Hissedar Detayları */}
        {shareholderInfo && (
          <div className="max-w-5xl mx-auto">
            <ShareholderDetails shareholderInfo={shareholderInfo} />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useShareholderLookup } from "@/hooks/useShareholderLookup";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { motion } from "framer-motion"; // Import motion for animations
import { Search } from "lucide-react";
import { useState } from "react";
import OTPOriginUI from "../hisseal/components/confirmation-step/otp-origin-ui";
import { ShareholderDetails } from "./components/shareholder-details";

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
  if (!digitsOnly.startsWith('0')) return false;
  if (digitsOnly.length !== 11) return false;
  if (!digitsOnly.startsWith('05')) return false;
  return true;
};

export default function HisseSorgula() {
  const [phone, setPhone] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shareholderInfoList, setShareholderInfoList] = useState<shareholderSchema[]>([]);
  const { toast } = useToast();

  // Use the shareholder lookup mutation
  const shareholderLookup = useShareholderLookup();

  // Animation variants for results, matching the process.tsx animation style
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setPhone(formattedValue);
    setError(null); // Kullanıcı yazmaya başladığında hata mesajını temizle
  };

  const handleSecurityCodeChange = (value: string) => {
    setSecurityCode(value);
    setError(null);
  };

  const handleSearch = async () => {
    // Telefon numarası kontrolü
    if (!phone) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen telefon numarası giriniz.",
      });
      return;
    }

    // Telefon numarası doğrulama
    if (!validatePhoneNumber(phone)) {
      setError("Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX)");
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX)",
      });
      return;
    }

    // Güvenlik kodu kontrolü
    if (!securityCode || securityCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen 6 haneli güvenlik kodunu giriniz.",
      });
      return;
    }

    try {
      setError(null);
      setShareholderInfoList([]);

      // Use our mutation to lookup shareholders
      const result = await shareholderLookup.mutateAsync({
        phone,
        securityCode
      });

      // If we get here, the lookup was successful
      const shareholders = result.shareholders;

      setShareholderInfoList(shareholders);

      toast({
        title: "Başarılı",
        description: `${shareholders.length} adet hissedar kaydı bulundu.`,
      });
    } catch (err) {
      console.error("Error fetching shareholder:", err);

      // Show the error message from the API or a fallback
      const errorMessage = err instanceof Error
        ? err.message
        : "Bilgiler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.";

      setError(errorMessage);

      toast({
        variant: "destructive",
        title: "Hata",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="container">
      <div className="flex flex-col items-start justify-center">
        {/* Form Section - No animation */}
        <div className="flex flex-col items-center justify-center w-full">
          {/* Başlık ve açıklama */}
          <div className="text-center space-y-6 md:space-y-12 w-full">
            <h1 className="text-3xl font-semibold mt-8">Hisse Sorgula</h1>
            <div className="text-black/75 font-medium md:text-lg">
              Hisse bilgilerinizi sorgulamak için telefon numaranızı ve güvenlik kodunuzu giriniz.
            </div>
          </div>

          {/* Telefon numarası ve güvenlik kodu alanları */}
          <div className="flex flex-col gap-8 md:mt-12 border border-black/10 rounded-lg p-8 mt-8 w-full max-w-md mx-auto">
            <div className="space-y-4">
              <label htmlFor="phone" className="font-medium">
                Telefon Numarası
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChange={handlePhoneChange}
                className={cn(
                  "text-center text-sm md:text-lg",
                  error ? "border-destructive focus-visible:ring-destructive" : ""
                )}
              />
            </div>

            {/* Güvenlik kodu alanı - OTPOriginUI kullanarak */}
            <div className="space-y-4">
              <label htmlFor="securityCode" className="font-medium">
                Güvenlik Kodu (6 Haneli)
              </label>
              <div className="flex justify-center">
                <OTPOriginUI
                  value={securityCode}
                  onChange={handleSecurityCodeChange}
                  maxLength={6}
                />
              </div>
            </div>
            {/* Sorgula butonu */}
            <Button
              onClick={handleSearch}
              className="w-full"
              disabled={shareholderLookup.isPending}
            >
              {shareholderLookup.isPending ? (
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

        {/* Results Section - with animation matching process.tsx */}
        {shareholderInfoList.length > 0 && (
          <motion.div
            className="w-full mt-12 md:mt-16"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <div className="grid grid-cols-1 gap-y-8">
              {shareholderInfoList.map((info, index) => (
                <motion.div
                  key={info.shareholder_id}
                  className="w-full"
                  variants={item}
                >
                  {shareholderInfoList.length > 1 && (
                    <h3 className="md:text-lg text-center font-medium mb-2 md:mb-4">
                      {index + 1}. Kayıt - {new Date(info.purchase_time).toLocaleDateString('tr-TR')}
                    </h3>
                  )}
                  <ShareholderDetails shareholderInfo={info} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

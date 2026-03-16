import { TripleInfo } from "@/app/(public)/components/triple-info";
import { Button } from "@/components/ui/button";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { formatDate } from "@/lib/date-utils";
import { getDeliveryFeeForLocation, getDeliverySelectionFromLocation } from "@/lib/delivery-options";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SuccessViewErrorMessage } from "./success-view/SuccessViewErrorMessage";
import { SuccessViewLoadingSkeletons } from "./success-view/SuccessViewLoadingSkeletons";
import { SuccessViewNoData } from "./success-view/SuccessViewNoData";
import { SuccessViewPdfSection } from "./success-view/SuccessViewPdfSection";

interface SuccessViewProps {
  onPdfDownload?: () => void;
}

// Create receipt data from DB data for each shareholder
interface ShareholderData {
  shareholder_name?: string;
  name?: string;
  phone_number?: string;
  phone?: string;
  email?: string;
  delivery_location?: string;
  sacrifice_consent?: boolean;
  proxy_status?: string;
  paid_amount?: number;
  security_code?: string;
}

// Veritabanından veri tiplerini tanımlayalım
interface SacrificeData {
  sacrifice_id?: string;
  sacrifice_no?: string;
  sacrifice_time?: string;
  share_price?: number;
  share_weight?: string;
  [key: string]: string | number | undefined;
}

interface ReservationData {
  transaction_id?: string;
  created_at?: string;
  [key: string]: string | number | undefined;
}

// API yanıt formatı
interface ShareholderApiResponse {
  sacrifice?: SacrificeData;
  reservation?: ReservationData;
  shareholders?: ShareholderData[];
}

export const SuccessView = ({ onPdfDownload }: SuccessViewProps) => {
  const router = useRouter();
  const { transaction_id } = useReservationIDStore();
  const branding = useTenantBranding();

  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [dbData, setDbData] = useState<ShareholderApiResponse>({ shareholders: [], sacrifice: {}, reservation: {} });
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isDbError, setIsDbError] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

  // Teşekkürler sayfasında en üste smooth scroll (PDF indir butonu görünsün)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Debug fonksiyonu
  useEffect(() => {
    if (transaction_id) {
      setDebugInfo(`Transaction ID: ${transaction_id}`);
    } else {
      console.error("SuccessView: transaction_id eksik!");
      setDebugInfo("Transaction ID eksik!");
    }
  }, [transaction_id]);

  // Doğrudan API çağrısı ile verileri çek
  useEffect(() => {
    if (!transaction_id) {
      setIsDbLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsDbLoading(true);
      setIsDbError(false);
      setDbError(null);

      try {
        const response = await fetch(`/api/get-shareholder-by-transaction_id?transaction_id=${transaction_id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || response.statusText);
        }

        const data = await response.json();

        setDbData(data);
      } catch (error) {
        console.error("API çağrısı sırasında hata:", error);
        setIsDbError(true);
        setDbError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsDbLoading(false);
      }
    };

    fetchData();
  }, [transaction_id]);

  // Generate a security code (this would typically come from backend)
  const generateSecurityCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit number
  };

  // Format the sacrifice time
  const formatSacrificeTime = (time: string | null | undefined) => {
    if (!time) return "";
    return time.split(":").slice(0, 2).join(":");
  };

  const createReceiptDataFromDb = (shareholder: ShareholderData) => {
    const sacrifice = dbData?.sacrifice || {};
    const reservation = dbData?.reservation || {};

    // Toplam tutarı hesapla
    const sharePrice = sacrifice.share_price || 0;
    const deliveryFee = getDeliveryFeeForLocation(
      branding.logo_slug,
      shareholder.delivery_location || "Kesimhane"
    );
    const totalAmount = sharePrice + deliveryFee;

    // Remaining payment calculation
    const paidAmount = shareholder.paid_amount || 0;
    const remainingPayment = totalAmount - paidAmount;

    const formattedPhoneNumber = formatPhoneForDisplayWithSpacing(
      shareholder.phone_number || shareholder.phone || ""
    );

    const deliveryType = (shareholder as { delivery_type?: string }).delivery_type
      || getDeliverySelectionFromLocation(branding.logo_slug, shareholder.delivery_location || "");
    const deliveryLocationDisplay = shareholder.delivery_location && shareholder.delivery_location !== "-"
      ? shareholder.delivery_location
      : "-";

    return {
      // Hisse Sahibi Bilgileri
      shareholder_name:
        shareholder.shareholder_name || shareholder.name || "Müşteri",
      phone_number: formattedPhoneNumber,
      email: shareholder.email || undefined,
      delivery_type: deliveryType,
      delivery_location: deliveryLocationDisplay,
      sacrifice_consent: !!shareholder.sacrifice_consent, // Convert to boolean with double negation
      vekalet_durumu: shareholder.proxy_status || "Belirtilmemiş",

      // Hisse ve Ödeme Özeti
      share_price: sharePrice.toString(),
      delivery_fee: deliveryFee.toString(),
      total_amount: totalAmount.toString(),
      // Veritabanından paid_amount değerini kullan, yoksa total_amount'a eşitle
      paid_amount: paidAmount.toString(),
      remaining_payment: remainingPayment.toString(),
      purchase_time: reservation.created_at
        ? formatDate(reservation.created_at)
        : formatDate(new Date()),

      // Hayvana Ait Bilgiler
      sacrifice_no: sacrifice.sacrifice_no?.toString() || "",
      sacrifice_time: formatSacrificeTime(sacrifice.sacrifice_time),
      share_weight: sacrifice.share_weight?.toString() || "", // Use real share_weight from DB if available

      // Rezervasyon Takibi ve Güvenlik
      transaction_id: transaction_id || "Belirtilmemiş",
      security_code: shareholder.security_code || generateSecurityCode(),
    };
  };

  // Shareholder isim ve telefon bilgilerini göstermek için yardımcı fonksiyon
  const getShareholderDisplayName = (shareholder: ShareholderData) => {
    return (
      shareholder.shareholder_name || shareholder.name || "İsimsiz Hissedar"
    );
  };

  const getShareholderDisplayPhone = (shareholder: ShareholderData) => {
    return formatPhoneForDisplayWithSpacing(
      shareholder.phone_number || shareholder.phone || ""
    );
  };

  // Use fallback data if needed - artık fallback kullanmıyoruz
  const shareholdersToDisplay = dbData?.shareholders || [];

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-12 md:space-y-16">
      {/* Icons + Thanks message */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="rounded-full flex items-center justify-center">
          <i className="bi bi-patch-check-fill text-8xl text-primary"></i>
        </div>
        {/* Teşekkürler mesajı */}
        <h1 className="text-2xl md:text-4xl text-center font-bold">
          Teşekkürler...
        </h1>
        <p className="text-muted-foreground text-center text-base md:text-lg">
          Hisse kaydınız <br className="md:hidden" /> başarıyla oluşturulmuştur.
        </p>
      </div>

      {/* Ana butonlar */}
      <div className="flex justify-center mt-4 md:mt-8">
        <Button
          className="flex items-center justify-center gap-1 md:gap-2 bg-black hover:bg-black/90 text-white px-2 md:px-4 py-2 md:py-3 h-auto text-sm md:text-lg"
          onClick={() => router.push("/hissesorgula")}
        >
          <i className="bi bi-search text-base md:text-xl"></i>
          Hisse Sorgula
        </Button>
      </div>

      {/* Veritabanı durumuna göre içerik gösterimi */}
      <>
        {isDbLoading && <SuccessViewLoadingSkeletons />}

        {isDbError && (
          <SuccessViewErrorMessage dbError={dbError} debugInfo={debugInfo} />
        )}

        {dbData?.shareholders && dbData.shareholders.length > 0 ? (
          <SuccessViewPdfSection
            shareholders={shareholdersToDisplay}
            createReceiptData={(s) => createReceiptDataFromDb(s as ShareholderData)}
            getDisplayName={(s) => getShareholderDisplayName(s as ShareholderData)}
            getDisplayPhone={(s) => getShareholderDisplayPhone(s as ShareholderData)}
            onPdfDownload={onPdfDownload}
          />
        ) : (
          !isDbLoading &&
          !isDbError && <SuccessViewNoData />
        )}
      </>

      <TripleInfo />
    </div>
  );
};

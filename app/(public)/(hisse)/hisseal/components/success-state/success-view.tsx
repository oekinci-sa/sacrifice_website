import { TripleInfo } from "@/app/(public)/components/triple-info";
import { Button } from "@/components/ui/button";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { buildPurchaseReceiptData } from "@/lib/purchase-receipt-data";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  second_phone_number?: string;
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
  const purchaseEmailSentForTxRef = useRef<string | null>(null);

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

  /** Hisse tamamlandıktan sonra teşekkür / bilgilendirme e-postası (e-posta adresi varsa, bir kez). */
  useEffect(() => {
    if (!transaction_id || isDbLoading || isDbError) return;
    const sh = dbData.shareholders;
    if (!sh?.length) return;
    if (purchaseEmailSentForTxRef.current === transaction_id) return;

    purchaseEmailSentForTxRef.current = transaction_id;

    void fetch("/api/purchase-confirmation-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id }),
    }).catch((err) => {
      console.error("purchase-confirmation-email", err);
      purchaseEmailSentForTxRef.current = null;
    });
  }, [transaction_id, isDbLoading, isDbError, dbData.shareholders]);

  // Generate a security code (this would typically come from backend)
  const generateSecurityCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit number
  };

  const createReceiptDataFromDb = (shareholder: ShareholderData) => {
    const sacrifice = dbData?.sacrifice || {};
    const reservation = dbData?.reservation || {};

    const sh = {
      shareholder_name: shareholder.shareholder_name || shareholder.name,
      phone_number: shareholder.phone_number || shareholder.phone,
      second_phone_number: shareholder.second_phone_number,
      email: shareholder.email,
      delivery_location: shareholder.delivery_location,
      delivery_type: (shareholder as { delivery_type?: string | null }).delivery_type,
      paid_amount: shareholder.paid_amount,
      remaining_payment: (shareholder as { remaining_payment?: number | null })
        .remaining_payment,
      security_code: shareholder.security_code || generateSecurityCode(),
      sacrifice_consent: shareholder.sacrifice_consent,
      proxy_status: shareholder.proxy_status,
    };

    const sac = sacrifice as SacrificeData & {
      pricing_mode?: string | null;
      live_scale_total_kg?: number | null;
      live_scale_total_price?: number | null;
    };

    return buildPurchaseReceiptData(
      sh,
      {
        sacrifice_no: sac.sacrifice_no,
        sacrifice_time: sac.sacrifice_time ?? null,
        share_price: sac.share_price ?? null,
        share_weight: sac.share_weight != null ? String(sac.share_weight) : null,
        pricing_mode: sac.pricing_mode ?? null,
        live_scale_total_kg: sac.live_scale_total_kg ?? null,
        live_scale_total_price: sac.live_scale_total_price ?? null,
      },
      { created_at: (reservation.created_at as string | null) ?? null },
      transaction_id || "Belirtilmemiş",
      branding
    );
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

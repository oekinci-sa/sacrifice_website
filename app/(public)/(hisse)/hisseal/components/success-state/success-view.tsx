import { TripleInfo } from "@/app/(public)/components/triple-info";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { BlobProvider } from "@react-pdf/renderer";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReceiptPDF from "./ReceiptPDF";

interface SuccessViewProps {
  onPdfDownload?: () => void;
}

// Create receipt data from DB data for each shareholder
interface ShareholderData {
  shareholder_name?: string;
  name?: string;
  phone_number?: string;
  phone?: string;
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

  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [dbData, setDbData] = useState<ShareholderApiResponse>({ shareholders: [], sacrifice: {}, reservation: {} });
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isDbError, setIsDbError] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

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

  // Format phone number to 0555 555 55 55
  const formatPhoneNumber = (phone: string): string =>
    phone
      ? phone
        .replace(/\D/g, "")
        .replace(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/, "0$1 $2 $3 $4")
      : "";

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
    const deliveryFee = shareholder.delivery_location !== "Kesimhane" ? 750 : 0;
    const totalAmount = sharePrice + deliveryFee;

    // Remaining payment calculation
    const paidAmount = shareholder.paid_amount || 0;
    const remainingPayment = totalAmount - paidAmount;

    const formattedPhoneNumber = formatPhoneNumber(
      shareholder.phone_number || shareholder.phone || ""
    );

    return {
      // Hisse Sahibi Bilgileri
      shareholder_name:
        shareholder.shareholder_name || shareholder.name || "Müşteri",
      phone_number: formattedPhoneNumber,
      delivery_location: shareholder.delivery_location || "Belirtilmemiş",
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
        ? new Date(reservation.created_at).toLocaleString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        : new Date().toLocaleString("tr-TR"),

      // Hayvana Ait Bilgiler
      sacrifice_no: sacrifice.sacrifice_no?.toString() || "",
      sacrifice_time: formatSacrificeTime(sacrifice.sacrifice_time),
      share_weight: sacrifice.share_weight?.toString() || "", // Use real share_weight from DB if available

      // Rezervasyon Takibi ve Güvenlik
      transaction_id: transaction_id || "Belirtilmemiş",
      security_code: shareholder.security_code || generateSecurityCode(),
    };
  };

  // Function to download PDF directly
  const downloadPdf = (blob: Blob, shareholderName: string | undefined) => {
    // shareholderName undefined kontrolü ekle
    const safeName = shareholderName
      ? shareholderName.replace(/\s+/g, "-")
      : "hissedar";

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kurban-hisse-bilgilendirme-${safeName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Call the onPdfDownload callback if provided
    if (onPdfDownload) {
      onPdfDownload();
    }
  };

  // Render loading skeletons
  const renderLoadingSkeletons = () => (
    <div className="mt-8 w-full max-w-xl mx-auto">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-7 w-64" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border rounded-lg p-3 flex justify-between items-center bg-gray-50 mb-3"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  );

  // Render error message
  const renderErrorMessage = () => (
    <Alert variant="destructive" className="mt-8 max-w-xl mx-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Veri Alınamadı</AlertTitle>
      <AlertDescription>
        Hissedar bilgileri alınırken bir hata oluştu. Lütfen sayfayı
        yenileyiniz.
        {dbError && (
          <p className="mt-2 text-xs">{(dbError as Error).message}</p>
        )}
        {debugInfo && (
          <p className="mt-2 text-xs">Debug: {debugInfo}</p>
        )}
      </AlertDescription>
    </Alert>
  );

  // Veritabanı durumuna göre içerik gösterimi
  useEffect(() => {
    if (dbData && dbData.shareholders && dbData.shareholders.length > 0) {
    }
  }, [dbData]);

  // Shareholder isim ve telefon bilgilerini göstermek için yardımcı fonksiyon
  const getShareholderDisplayName = (shareholder: ShareholderData) => {
    return (
      shareholder.shareholder_name || shareholder.name || "İsimsiz Hissedar"
    );
  };

  const getShareholderDisplayPhone = (shareholder: ShareholderData) => {
    return formatPhoneNumber(
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
          <i className="bi bi-patch-check-fill text-8xl text-sac-primary"></i>
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
      {
        <>
          {isDbLoading && renderLoadingSkeletons()}

          {isDbError && renderErrorMessage()}

          {/* Veritabanından veriler başarıyla alındıysa PDF'leri göster */}
          {dbData && dbData.shareholders && dbData.shareholders.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-lg md:text-xl font-semibold text-center mb-4">
                Hissedar Bilgi Dökümanları
              </h2>
              <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                {shareholdersToDisplay.map(
                  (shareholder: ShareholderData, index: number) => {
                    // Create receipt data using dbData
                    const receiptData = createReceiptDataFromDb(shareholder);

                    return (
                      <div
                        key={index}
                        className="border p-3 flex justify-between gap-8 items-center bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">
                            {getShareholderDisplayName(shareholder)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getShareholderDisplayPhone(shareholder)}
                          </p>
                        </div>

                        <BlobProvider
                          document={
                            <ReceiptPDF
                              data={receiptData}
                            />
                          }
                        >
                          {({ blob, loading, error }) => (
                            <Button
                              className="flex items-center justify-center gap-1 md:gap-2 bg-sac-primary hover:bg-sac-primary/90 text-white px-2 md:px-4 py-2 md:py-3 h-auto text-xs md:text-sm"
                              onClick={() =>
                                blob &&
                                downloadPdf(
                                  blob,
                                  getShareholderDisplayName(shareholder)
                                )
                              }
                              disabled={loading || !!error}
                            >
                              {loading ? (
                                "Yükleniyor..."
                              ) : error ? (
                                "Hata!"
                              ) : (
                                <>
                                  <i className="bi bi-cloud-download text-base md:text-xl"></i>
                                  PDF İndir
                                </>
                              )}
                            </Button>
                          )}
                        </BlobProvider>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ) : (
            !isDbLoading && !isDbError && (
              <div className="mt-8 text-center">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 max-w-md mx-auto">
                  <h3 className="text-amber-800 font-medium mb-2">Veri Bulunamadı</h3>
                  <p className="text-amber-700 text-sm">
                    Hissedar bilgileri görüntülenemiyor. Lütfen Hisse Sorgula sayfasından işleminizi kontrol ediniz.
                  </p>
                </div>
              </div>
            )
          )}
        </>
      }

      <TripleInfo />
    </div>
  );
};

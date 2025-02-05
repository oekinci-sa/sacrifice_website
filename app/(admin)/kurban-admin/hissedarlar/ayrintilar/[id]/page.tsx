"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ShareholderForm } from "../../components/shareholder-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from "next/image";
import html2pdf from "html2pdf.js";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface PageProps {
  params: {
    id: string;
  };
}

interface Shareholder {
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string;
  purchase_time: string;
  total_amount: number;
  paid_amount: number;
  remaining_payment: number;
  payment_status: "paid" | "pending";
  delivery_fee?: number;
  delivery_type?: "kesimhane" | "toplu-teslim-noktasi";
  delivery_location?: string;
  sacrifice_consent: boolean;
  notes?: string;
  sacrifice_no?: string;
  sacrifice?: {
    sacrifice_no: string;
    sacrifice_time: string;
    share_price: number;
    empty_share: number;
    total_price: number;
  };
  logs: {
    event_id: string;
    changed_at: string;
    description: string;
    change_type: "Ekleme" | "Güncelleme" | "Silme";
    column_name: string;
    old_value: string;
    new_value: string;
  }[];
}

// Helper function to format time without seconds
const formatTime = (time: string) => {
  if (!time) return "-";
  const [hours, minutes] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
};

// Helper function to format location name
const formatLocationName = (location: string) => {
  switch (location) {
    case "kesimhane":
      return "Kesimhane";
    case "yenimahalle-pazar-yeri":
      return "Yenimahalle Pazar Yeri";
    case "kecioren-otoparki":
      return "Keçiören Otoparkı";
    default:
      return location;
  }
};

// Helper function to get custom description
const getCustomDescription = (
  log: Shareholder["logs"][0],
  totalAmount: number
) => {
  if (log.change_type === "Ekleme") {
    return "Hisse alımı gerçekleştirildi";
  }

  if (log.column_name === "Ödenen Tutar") {
    const newValue = parseInt(log.new_value);
    if (newValue === totalAmount) {
      return "Tüm ödemeler tamamlandı.";
    }
    return `Yapılan ödeme miktarı ${parseInt(log.old_value).toLocaleString(
      "tr-TR"
    )} TL'den ${newValue.toLocaleString("tr-TR")} TL'ye yükseldi.`;
  }

  if (log.column_name === "Teslimat Noktası") {
    const oldLocation = formatLocationName(log.old_value);
    const newLocation = formatLocationName(log.new_value);
    return `Hisse teslimi ${oldLocation} yerine ${newLocation}'nda yapılacak.`;
  }

  return log.description;
};

export default function ShareholderDetailsPage({ params }: PageProps) {
  const [shareholder, setShareholder] = useState<Shareholder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchShareholder = async () => {
      try {
        if (!params.id) {
          setError("Geçersiz hissedar ID'si");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("shareholders")
          .select(
            `
            *,
            sacrifice:sacrifice_animals!sacrifice_id (
              sacrifice_no,
              sacrifice_time,
              empty_share,
              share_price,
              total_price
            )
          `
          )
          .eq("shareholder_id", params.id)
          .single();

        if (error) throw error;

        // Fetch change logs for the shareholder
        const searchPattern = `%${data.shareholder_name} (${data.sacrifice_id})%`;
        console.log("Search pattern:", searchPattern);

        const { data: logsData, error: logsError } = await supabase
          .from("change_logs")
          .select("*")
          .ilike("row_id", searchPattern)
          .order("changed_at", { ascending: true });

        if (logsError) throw logsError;

        console.log("Logs data:", logsData);

        setShareholder({ ...data, logs: logsData });
      } catch (err) {
        console.error("Error fetching shareholder:", err);
        setError("Hissedar bilgileri yüklenirken bir hata oluştu");
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hissedar bilgileri yüklenirken bir hata oluştu",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShareholder();

    // Real-time subscription
    const subscription = supabase
      .channel("shareholders_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shareholders",
          filter: `shareholder_id=eq.${params.id}`,
        },
        async () => {
          // When a change occurs, fetch the updated data with the sacrifice relationship
          const { data, error } = await supabase
            .from("shareholders")
            .select(
              `
              *,
              sacrifice:sacrifice_animals!sacrifice_id (
                sacrifice_no,
                sacrifice_time,
                empty_share,
                share_price,
                total_price
              )
            `
            )
            .eq("shareholder_id", params.id)
            .single();

          if (!error && data) {
            setShareholder(data);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [params.id, toast]);

  const generatePDF = () => {
    const pdfContent = document.getElementById("pdf-content");

    if (!pdfContent) return;

    const opt = {
      margin: 0.5,
      filename: `hissedar-${shareholder?.shareholder_id}.pdf`,
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
    };

    html2pdf().set(opt).from(pdfContent).save();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-8">
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-4 w-[160px]" />
            <Skeleton className="h-4 w-[170px]" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between h-[40px]">
        <h1 className="text-2xl font-bold font-heading">
          Hissedar Ayrıntıları
        </h1>
        {!isEditing ? (
          <Button
            variant="default"
            className="bg-sac-primary hover:bg-sac-primary/90"
            onClick={generatePDF}
          >
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
        ) : (
          <div className="w-[116px]"></div>
        )}
      </div>

      {/* Main Content Grid */}
      <div id="pdf-content" className="grid grid-cols-2 gap-24">
        {/* Left Column - Profile Image and Info */}
        <div>
          <div className="border border-gray-200 rounded-lg">
            {/* Image Section */}
            <div className="aspect-[3/1] rounded-t-lg relative overflow-hidden">
              <Image
                src="/images/ai-cows.avif"
                alt="Cow"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {/* Profile icon */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white rounded-full p-6 w-32 h-32 flex items-center justify-center">
                <Image
                  src="/icons/user-icon2.svg"
                  alt="User Icon"
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="pt-12 p-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold font-heading">
                  {shareholder?.shareholder_name}
                </h2>
              </div>

              <div className="space-y-6">
                {/* First Group */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground font-heading">
                      Hisse Alım Tarihi
                    </p>
                    <p className="font-medium font-heading">
                      {shareholder?.purchase_time
                        ? new Date(
                            shareholder.purchase_time
                          ).toLocaleDateString("tr-TR")
                        : "-"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground font-heading">
                      Telefon
                    </p>
                    <p className="font-medium font-heading">
                      {shareholder?.phone_number
                        ? shareholder.phone_number.replace("+90", "0")
                        : "-"}
                    </p>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Second Group */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground font-heading">
                      Kalan Ödeme
                    </p>
                    <p className="font-medium font-heading">
                      {shareholder?.remaining_payment === 0
                        ? "Tüm Ödeme Tamamlandı"
                        : shareholder?.remaining_payment
                        ? `${shareholder.remaining_payment.toLocaleString(
                            "tr-TR"
                          )} TL`
                        : "-"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground font-heading">
                      Vekalet
                    </p>
                    <p className="font-medium font-heading">
                      {shareholder?.sacrifice_consent === true
                        ? "Alındı"
                        : "Henüz Alınmadı"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground font-heading">Notlar</p>
                    <p className="font-medium font-heading">
                      {shareholder?.notes || "Not yok."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button
              variant="ghost"
              className="bg-[#F8F9FC] hover:bg-[#E5E7F0] text-black font-heading h-12"
              onClick={() => {
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? "Hissedar Ayrıntılarına Dön" : "Hissedarı Düzenle"}
            </Button>
            <Button
              variant="ghost"
              className="bg-[#D6293E] hover:bg-[#D6293E]/80 text-white hover:text-white font-heading h-12"
            >
              Hissedarı Sil
            </Button>
          </div>
        </div>

        {/* Right Column - Information or Form */}
        <div>
          {!isEditing ? (
            <div className="space-y-12">
              {/* Kurban Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold font-heading">
                  Kurbanlık Bilgileri
                </h3>
                <hr className="border-gray-200 mt-4 mb-6" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground font-heading">
                      Kurban No
                    </p>
                    <p className="font-medium font-heading">
                      {shareholder?.sacrifice?.sacrifice_no || "-"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground font-heading">
                      Kesim Saati
                    </p>
                    <p className="font-medium font-heading">
                      {shareholder?.sacrifice?.sacrifice_time
                        ? formatTime(shareholder.sacrifice.sacrifice_time)
                        : "-"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground font-heading">
                      Hisse Bedeli
                    </p>
                    <p className="font-medium font-heading">
                      {shareholder?.sacrifice?.share_price
                        ? `${shareholder.sacrifice.share_price.toLocaleString(
                            "tr-TR"
                          )} TL`
                        : "-"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground font-heading">
                      Teslimat Türü
                    </p>
                    <p className="font-medium font-heading">
                      {shareholder?.delivery_type === "toplu-teslim-noktasi"
                        ? "Toplu Kesim Noktası (+500 TL)"
                        : "Kesimhane"}
                    </p>
                  </div>
                  {shareholder?.delivery_type === "toplu-teslim-noktasi" && (
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground font-heading">
                        Teslimat Noktası
                      </p>
                      <p className="font-medium font-heading">
                        {shareholder?.delivery_location ===
                        "yenimahalle-pazar-yeri"
                          ? "Yenimahalle Pazar Yeri"
                          : shareholder?.delivery_location ===
                            "kecioren-otoparki"
                          ? "Keçiören Otoparkı"
                          : "-"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Kullanıcı Geçmişi */}
              <div>
                <h3 className="text-lg font-semibold font-heading">
                  Kullanıcı Geçmişi
                </h3>
                <hr className="border-gray-200 mt-4 mb-6" />
                <div className="relative space-y-6">
                  {shareholder?.logs?.filter(
                    (log) =>
                      log.change_type === "Ekleme" ||
                      log.column_name === "Ödenen Tutar" ||
                      log.column_name === "Teslimat Noktası"
                  ).length ? (
                    shareholder.logs
                      .filter(
                        (log) =>
                          log.change_type === "Ekleme" ||
                          log.column_name === "Ödenen Tutar" ||
                          log.column_name === "Teslimat Noktası"
                      )
                      .map((log, index, array) => (
                        <div key={log.event_id} className="relative">
                          <div className="flex items-start gap-6">
                            <div className="flex flex-col items-center">
                              <div className="relative w-14 h-14 bg-[#00B074]/10 rounded-full flex items-center justify-center shrink-0 z-10">
                                {log.change_type === "Ekleme" ? (
                                  <i className="bi bi-person-check-fill text-[#00B074] text-2xl" />
                                ) : log.column_name === "Ödenen Tutar" ? (
                                  <i className="bi bi-wallet-fill text-[#00B074] text-2xl" />
                                ) : log.column_name === "Teslimat Noktası" ? (
                                  <i className="bi bi-geo-alt-fill text-[#00B074] text-2xl" />
                                ) : (
                                  <div className="w-4 h-4 bg-[#00B074] rounded-full" />
                                )}
                              </div>
                              {index < array.length - 1 && (
                                <div className="w-[2px] h-8 bg-[#DBDDE1] mt-2 -mb-4" />
                              )}
                            </div>
                            <div className="pt-2">
                              <p className="text-sm text-muted-foreground font-heading">
                                {format(
                                  new Date(log.changed_at),
                                  "dd.MM.yyyy - HH:mm",
                                  { locale: tr }
                                )}
                              </p>
                              <p className="font-medium font-heading">
                                {getCustomDescription(
                                  log,
                                  shareholder.total_amount
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Kullanıcı geçmişi bulunamadı.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Form Sections in Single Column */}
              <div className="space-y-12">
                {/* Kişisel Bilgiler Section */}
                <div>
                  <h2 className="text-lg font-semibold font-heading">
                    Kişisel Bilgiler
                  </h2>
                  <hr className="border-gray-200 mt-4 mb-6" />
                  {shareholder && (
                    <ShareholderForm
                      shareholder={shareholder}
                      section="personal"
                    />
                  )}
                </div>

                {/* Ödeme Bilgileri Section */}
                <div>
                  <h2 className="text-lg font-semibold font-heading">
                    Ödeme Bilgileri
                  </h2>
                  <hr className="border-gray-200 mt-4 mb-6" />
                  {shareholder && (
                    <ShareholderForm
                      shareholder={shareholder}
                      section="payment"
                    />
                  )}
                </div>

                {/* Teslimat Bilgileri Section */}
                <div>
                  <h2 className="text-lg font-semibold font-heading">
                    Teslimat Bilgileri
                  </h2>
                  <hr className="border-gray-200 mt-4 mb-6" />
                  {shareholder && (
                    <ShareholderForm
                      shareholder={shareholder}
                      section="delivery"
                    />
                  )}
                </div>

                {/* Diğer Bilgiler Section */}
                <div>
                  <h2 className="text-lg font-semibold font-heading">
                    Diğer Bilgiler
                  </h2>
                  <hr className="border-gray-200 mt-4 mb-6" />
                  {shareholder && (
                    <ShareholderForm
                      shareholder={shareholder}
                      section="other"
                    />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Button
                    variant="default"
                    className="bg-sac-primary hover:bg-sac-primary/90 text-white font-heading h-12"
                  >
                    Kaydet
                  </Button>
                  <Button
                    variant="ghost"
                    className="bg-[#D6293E] hover:bg-[#D6293E]/80 text-white hover:text-white font-heading h-12"
                  >
                    Hissedarı Sil
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        #pdf-content {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6rem;
        }

        @media print {
          #pdf-content {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

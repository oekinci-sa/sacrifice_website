"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ShareholderForm } from "../../components/shareholder-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import Image from "next/image";
import html2pdf from "html2pdf.js";

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
}

// Helper function to format time without seconds
const formatTime = (time: string) => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

export default function ShareholderDetailsPage({ params }: PageProps) {
  const [shareholder, setShareholder] = useState<Shareholder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

        setShareholder(data);
      } catch (err) {
        console.error("Error fetching shareholder:", err);
        setError("Hissedar bilgileri yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchShareholder();

    // Real-time subscription
    const subscription = supabase
      .channel('shareholders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shareholders',
          filter: `shareholder_id=eq.${params.id}`
        },
        async (payload) => {
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
  }, [params.id]);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">
          Hissedar Ayrıntıları
        </h1>
        {!isEditing && (
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90"
            onClick={generatePDF}
          >
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
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
                  {/* Timeline Line */}
                  <div className="absolute left-[2.4rem] top-10 bottom-10 w-px bg-[#00B074]/20 -z-10" />

                  <div className="flex items-start gap-6">
                    <div className="relative w-20 h-20 bg-[#00B074]/10 rounded-full flex items-center justify-center shrink-0">
                      <div className="w-4 h-4 bg-[#00B074] rounded-full" />
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground font-heading">
                        11.02.2025 - 19:38
                      </p>
                      <p className="font-medium font-heading">
                        Hisse alımı gerçekleştirildi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="relative w-20 h-20 bg-[#00B074]/10 rounded-full flex items-center justify-center shrink-0">
                      <div className="w-4 h-4 bg-[#00B074] rounded-full" />
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground font-heading">
                        12.02.2025 - 19:12
                      </p>
                      <p className="font-medium font-heading">
                        Ödeme yapıldı: 5000 TL
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="relative w-20 h-20 bg-[#00B074]/10 rounded-full flex items-center justify-center shrink-0">
                      <div className="w-4 h-4 bg-[#00B074] rounded-full" />
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground font-heading">
                        03.03.2025 - 12:15
                      </p>
                      <p className="font-medium font-heading">
                        Vekalet alındı.
                      </p>
                    </div>
                  </div>
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
                    className="bg-primary hover:bg-primary/90 text-white font-heading h-12"
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

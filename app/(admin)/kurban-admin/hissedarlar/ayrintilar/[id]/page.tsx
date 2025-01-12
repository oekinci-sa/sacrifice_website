"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ShareholderForm } from "../../components/shareholder-form";
import { Skeleton } from "@/components/ui/skeleton";

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
  total_amount_to_pay: number;
  deposit_payment: number;
  remaining_payment: number;
  payment_status: "paid" | "pending";
  delivery_fee?: number;
  delivery_type?: "kesimhane" | "toplu-teslimat";
  delivery_location?: string;
  vekalet: "verildi" | "bekleniyor";
  notes?: string;
  sacrifice_no?: string;
  sacrifice?: {
    sacrifice_no: string;
    sacrifice_time: string;
  };
}

export default function ShareholderDetailsPage({ params }: PageProps) {
  const [shareholder, setShareholder] = useState<Shareholder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .select(`
            *,
            sacrifice:sacrifice_no (
              sacrifice_no,
              sacrifice_time
            )
          `)
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
  }, [params.id]);

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hissedar Bilgileri</h1>
        <p className="text-muted-foreground">
          Hissedar detaylarını görüntüleyin ve düzenleyin
        </p>
      </div>

      {/* Kurbanlık Bilgileri - Salt Okunur */}
      <div className="grid gap-6 p-6 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Kurbanlık No</h3>
            <p className="text-muted-foreground">{shareholder?.sacrifice?.sacrifice_no || "-"}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Kesim Zamanı</h3>
            <p className="text-muted-foreground">
              {shareholder?.sacrifice?.sacrifice_time 
                ? new Date(shareholder.sacrifice.sacrifice_time).toLocaleString("tr-TR") 
                : "-"}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Hisse Alım Tarihi</h3>
            <p className="text-muted-foreground">
              {shareholder?.purchase_time 
                ? new Date(shareholder.purchase_time).toLocaleString("tr-TR") 
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Kişisel Bilgiler Section */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Kişisel Bilgiler</h2>
              <p className="text-sm text-muted-foreground">
                Hissedarın isim ve iletişim bilgileri
              </p>
            </div>
            <div className="pt-4">
              {shareholder && <ShareholderForm shareholder={shareholder} section="personal" />}
            </div>
          </div>
        </div>

        {/* Ödeme Bilgileri Section */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Ödeme Bilgileri</h2>
              <p className="text-sm text-muted-foreground">
                Toplam tutar, kapora ve kalan ödeme bilgileri
              </p>
            </div>
            <div className="pt-4">
              {shareholder && <ShareholderForm shareholder={shareholder} section="payment" />}
            </div>
          </div>
        </div>

        {/* Teslimat Bilgileri Section */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Teslimat Bilgileri</h2>
              <p className="text-sm text-muted-foreground">
                Teslimat tipi ve lokasyon bilgileri
              </p>
            </div>
            <div className="pt-4">
              {shareholder && <ShareholderForm shareholder={shareholder} section="delivery" />}
            </div>
          </div>
        </div>

        {/* Diğer Bilgiler Section */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Diğer Bilgiler</h2>
              <p className="text-sm text-muted-foreground">
                Vekalet ve not bilgileri
              </p>
            </div>
            <div className="pt-4">
              {shareholder && <ShareholderForm shareholder={shareholder} section="other" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
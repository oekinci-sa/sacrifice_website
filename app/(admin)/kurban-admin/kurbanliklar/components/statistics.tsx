"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { StatCardWithProgress } from "@/components/custom-components/stat-card-with-progress";

interface SacrificeStats {
  totalSacrifices: number;
  totalShares: number;
  emptyShares: number;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  averageSharePrice: number;
  deliveryStats: {
    kesimhane: number;
    topluTeslimat: number;
  };
  consentStats: {
    verildi: number;
    bekliyor: number;
  };
  completedSacrifices: number;
  fullyPaidSacrifices: number;
  activeSacrificesCount: number;
}

interface ShareholderPayment {
  totalAmount: number;
  paidAmount: number;
  remainingPayment: number;
}

export function SacrificeStatistics() {
  const [stats, setStats] = useState<SacrificeStats>({
    totalSacrifices: 0,
    totalShares: 0,
    emptyShares: 0,
    totalAmount: 0,
    collectedAmount: 0,
    remainingAmount: 0,
    averageSharePrice: 0,
    deliveryStats: {
      kesimhane: 0,
      topluTeslimat: 0,
    },
    consentStats: {
      verildi: 0,
      bekliyor: 0,
    },
    completedSacrifices: 0,
    fullyPaidSacrifices: 0,
    activeSacrificesCount: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch sacrifices data
        const { data: sacrifices, error: sacrificesError } = await supabase
          .from("sacrifice_animals")
          .select("*");

        if (sacrificesError) throw sacrificesError;

        // Fetch shareholders data
        const { data: shareholders, error: shareholdersError } = await supabase
          .from("shareholders")
          .select("*");

        if (shareholdersError) throw shareholdersError;

        // Calculate basic statistics
        const totalSacrifices = sacrifices?.length || 0;
        const totalShares = sacrifices?.reduce((acc) => acc + 7, 0) || 0;
        const emptyShares = sacrifices?.reduce((acc, curr) => acc + (curr.empty_share || 0), 0) || 0;

        // Calculate financial statistics
        const totalAmount = shareholders?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0;
        const collectedAmount = shareholders?.reduce((acc, curr) => acc + curr.paid_amount, 0) || 0;
        const remainingAmount = totalAmount - collectedAmount;
        const averageSharePrice = shareholders?.length ? totalAmount / shareholders.length : 0;

        // Calculate delivery statistics
        const deliveryStats = {
          kesimhane: shareholders?.filter(s => s.delivery_type === "Kesimhane").length || 0,
          topluTeslimat: shareholders?.filter(s => s.delivery_type === "Toplu Teslim Noktası").length || 0,
        };

        // Calculate consent statistics
        const consentStats = {
          verildi: shareholders?.filter(s => s.sacrifice_consent === true).length || 0,
          bekliyor: shareholders?.filter(s => s.sacrifice_consent === false).length || 0,
        };

        // Count sacrifices with no empty shares
        const completedSacrifices = sacrifices?.filter(
          (s) => s.empty_share === 0
        ).length || 0;

        // Calculate fully paid sacrifices
        const sacrificePayments = new Map();
        
        // First, get all sacrifices with at least one share taken
        const activeSacrifices = sacrifices?.filter(s => s.empty_share < 7) || [];
        
        // Group shareholders by sacrifice_id and calculate payments
        shareholders?.forEach(shareholder => {
          const sacrificeId = shareholder.sacrifice_id;
          if (!activeSacrifices.find(s => s.sacrifice_id === sacrificeId)) return;
          
          const currentPayment = sacrificePayments.get(sacrificeId) || {
            shareholders: [] as ShareholderPayment[]
          };
          
          currentPayment.shareholders.push({
            totalAmount: shareholder.total_amount,
            paidAmount: shareholder.paid_amount,
            remainingPayment: shareholder.remaining_payment
          });
          
          sacrificePayments.set(sacrificeId, currentPayment);
        });

        const fullyPaidSacrifices = Array.from(sacrificePayments.entries()).filter(
          ([, payment]) => {
            // Check if all shareholders of this sacrifice have completed their payments
            return payment.shareholders.every(
              (shareholder: ShareholderPayment) => shareholder.remainingPayment === 0
            );
          }
        ).length;

        setStats({
          totalSacrifices,
          totalShares,
          emptyShares,
          totalAmount,
          collectedAmount,
          remainingAmount,
          averageSharePrice,
          deliveryStats,
          consentStats,
          completedSacrifices,
          activeSacrificesCount: activeSacrifices.length,
          fullyPaidSacrifices,
        });
      } catch (error) {
        console.error("Error fetching sacrifice statistics:", error);
      }
    }

    fetchStats();
  }, []); // Boş dependency array ile sadece bir kez çalışacak

  return (
    <div className="grid gap-16 md:grid-cols-2">
      <div>
        <StatCardWithProgress
          title="Kalan Kurbanlıklar"
          value={stats.totalSacrifices - stats.completedSacrifices}
          maxValue={stats.totalSacrifices}
          displayValue={stats.completedSacrifices}
          actionLink={{
            text: "Tümünü göster",
            href: "/kurban-admin/kurbanliklar/tum-kurbanliklar",
          }}
        />
      </div>
    </div>
  );
} 
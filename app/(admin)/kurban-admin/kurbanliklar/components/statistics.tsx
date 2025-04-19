"use client";

import { StatCardWithProgress } from "@/components/custom-components/stat-card-with-progress";
import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Assuming there's an endpoint for sacrifice statistics
        const response = await fetch('/api/sacrifices/statistics');

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching sacrifice statistics:", error);
      } finally {
        setLoading(false);
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
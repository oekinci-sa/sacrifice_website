"use client";

import { useEffect, useState } from "react";
import { StatCardWithProgress } from "@/components/custom-components/stat-card-with-progress";
import { supabase } from "@/utils/supabaseClient";

interface RecentActivity {
  event_id: number;
  table_name: string;
  row_id: string;
  column_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: string;
  description: string;
  change_owner: string;
  changed_at: string;
}

interface ShareholderStats {
  missingDeposits: number;
  missingPayments: number;
  consentStats: {
    verildi: number;
    bekliyor: number;
  };
  totalShareholders: number;
}

export default function HissedarlarPage() {
  const [stats, setStats] = useState<ShareholderStats>({
    missingDeposits: 0,
    missingPayments: 0,
    consentStats: {
      verildi: 0,
      bekliyor: 0,
    },
    totalShareholders: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Fetch shareholders data
      const { data: shareholders } = await supabase
        .from("shareholders")
        .select("*");

      if (shareholders) {
        // Calculate statistics
        const totalShareholders = shareholders.length;
        const missingDeposits = shareholders.filter(s => s.paid_amount < 2000).length;
        const missingPayments = shareholders.filter(s => s.remaining_payment > 0).length;
        const vekaletAlindiCount = shareholders.filter(s => s.sacrifice_consent === true).length;
        const vekaletAlinmadiCount = shareholders.filter(s => s.sacrifice_consent === false).length;

        setStats({
          missingDeposits,
          missingPayments,
          consentStats: {
            verildi: vekaletAlindiCount,
            bekliyor: vekaletAlinmadiCount,
          },
          totalShareholders,
        });
      }

      // Fetch recent activities
      const { data: activities } = await supabase
        .from("change_logs")
        .select("*")
        .eq("table_name", "shareholders")
        .order("changed_at", { ascending: false })
        .limit(10);

      if (activities) {
        setRecentActivities(activities);
      }
    }

    fetchData();
  }, []);

  // Format activities for StatCardWithProgress
  const formattedActivities = recentActivities.map(activity => ({
    event_id: activity.event_id.toString(),
    changed_at: activity.changed_at,
    description: activity.description,
    change_type: activity.change_type as "Ekleme" | "Güncelleme" | "Silme",
    column_name: activity.column_name,
    old_value: activity.old_value || "",
    new_value: activity.new_value || "",
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hissedarlar</h1>
        <p className="text-muted-foreground">
          Hissedarların genel durumu ve detayları
        </p>
      </div>
      <StatCardWithProgress stats={stats} recentActivities={formattedActivities} />
    </div>
  );
} 
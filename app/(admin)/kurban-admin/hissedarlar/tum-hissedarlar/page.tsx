"use client";

import { useEffect, useState } from "react";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { CustomStatistics } from "@/components/custom-components/custom-statistics";
import { columns } from "./components/columns";
import { supabase } from "@/utils/supabaseClient";
import { ShareholderType } from "@/types";

interface ShareholderStats {
  missingDeposits: number;
  missingPayments: number;
  consentStats: {
    verildi: number;
    bekliyor: number;
  };
  totalShareholders: number;
}

export default function TumHissedarlarPage() {
  const [data, setData] = useState<ShareholderType[]>([]);
  const [stats, setStats] = useState<ShareholderStats>({
    missingDeposits: 0,
    missingPayments: 0,
    consentStats: {
      verildi: 0,
      bekliyor: 0,
    },
    totalShareholders: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Fetch shareholders data
      const { data: shareholders } = await supabase
        .from("shareholders")
        .select(`
          *,
          sacrifice:sacrifice_animals!sacrifice_id (
            sacrifice_id,
            sacrifice_no
          )
        `)
        .order("shareholder_name", { ascending: true });

      if (shareholders) {
        setData(shareholders);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tüm Hissedarlar</h1>
        <p className="text-muted-foreground">
          Tüm hissedarların listesi ve istatistikleri
        </p>
      </div>

      <CustomStatistics stats={stats} recentActivities={recentActivities} />
      
      <CustomDataTable data={data} columns={columns} />
    </div>
  );
} 
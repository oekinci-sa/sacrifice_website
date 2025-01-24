"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { 
  overdueDepositsColumns, 
  pendingPaymentsColumns, 
  completedPaymentsColumns 
} from "./components/columns";
import { ShareholderType } from "@/types";
import { StatCard } from "@/components/ui/stat-card";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { CustomTabs } from "@/components/custom-components/custom-tabs";

export default function PaymentAnalysisPage() {
  const router = useRouter();
  const [overdueDeposits, setOverdueDeposits] = useState<ShareholderType[]>([]);
  const [pendingPayments, setPendingPayments] = useState<ShareholderType[]>([]);
  const [completedPayments, setCompletedPayments] = useState<ShareholderType[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: shareholders, error } = await supabase
        .from("shareholders")
        .select(`
          *,
          sacrifice:sacrifice_id (
            sacrifice_id,
            sacrifice_no
          )
        `)
        .order("purchase_time", { ascending: false });

      if (error) {
        console.error("Error fetching shareholders:", error);
        return;
      }

      if (!shareholders) return;

      // Calculate total stats
      const totalAmount = shareholders.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const paidAmount = shareholders.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
      setStats({ totalAmount, paidAmount });

      // Filter shareholders for each tab
      const overdue = shareholders.filter(s => s.paid_amount < 2000);
      const pending = shareholders.filter(s => s.paid_amount >= 2000 && s.paid_amount < s.total_amount);
      const completed = shareholders.filter(s => s.paid_amount >= s.total_amount);

      setOverdueDeposits(overdue);
      setPendingPayments(pending);
      setCompletedPayments(completed);
    };

    fetchData();
  }, []);

  const tabs = [
    {
      value: "overdue-deposits",
      label: `Eksik Kaporalar (${overdueDeposits.length})`,
      content: <CustomDataTable columns={overdueDepositsColumns} data={overdueDeposits} />,
    },
    {
      value: "pending-payments",
      label: `Eksik Ödemeler (${pendingPayments.length})`,
      content: <CustomDataTable columns={pendingPaymentsColumns} data={pendingPayments} />,
    },
    {
      value: "completed-payments",
      label: `Ödemesi Tamamlananlar (${completedPayments.length})`,
      content: <CustomDataTable columns={completedPaymentsColumns} data={completedPayments} />,
    },
  ];

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ödeme Analizi</h1>
        <p className="text-sm text-muted-foreground">
          Ödemelerin durumu ve detaylı analizi
        </p>
      </div>

      <div className="mt-2">
        <StatCard
          title="Toplam Ödemeler"
          value={stats.paidAmount}
          maxValue={stats.totalAmount}
          suffix=" TL"
        />
      </div>

      <CustomTabs tabs={tabs} />
    </div>
  );
}

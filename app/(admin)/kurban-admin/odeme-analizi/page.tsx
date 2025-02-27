"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { CustomStatistics } from "@/components/custom-components/custom-statistics";
import { CustomTabs } from "@/components/custom-components/custom-tabs";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { overdueDepositsColumns, pendingPaymentsColumns, completedPaymentsColumns } from "./components/columns";
import { shareholderSchema } from "@/types";

interface PaymentStats {
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  overdueDeposits: number;
  pendingPayments: number;
  completedPayments: number;
}

export default function PaymentAnalysisPage() {
  const [stats, setStats] = useState<PaymentStats>({
    totalAmount: 0,
    collectedAmount: 0,
    remainingAmount: 0,
    overdueDeposits: 0,
    pendingPayments: 0,
    completedPayments: 0,
  });

  const [overdueDeposits, setOverdueDeposits] = useState<shareholderSchema[]>([]);
  const [pendingPayments, setPendingPayments] = useState<shareholderSchema[]>([]);
  const [completedPayments, setCompletedPayments] = useState<shareholderSchema[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: shareholders } = await supabase
        .from("shareholders")
        .select("*, sacrifice:sacrifice_animals(sacrifice_id, sacrifice_no)");

      if (shareholders) {
        // Calculate statistics
        const totalAmount = shareholders.reduce((acc, curr) => acc + curr.total_amount, 0);
        const collectedAmount = shareholders.reduce((acc, curr) => acc + curr.paid_amount, 0);
        const remainingAmount = totalAmount - collectedAmount;

        // Filter shareholders based on payment status
        const overdue = shareholders.filter(shareholder => {
          const purchaseDate = new Date(shareholder.purchase_time);
          const threeDaysAfterPurchase = new Date(purchaseDate.getTime() + (3 * 24 * 60 * 60 * 1000));
          return shareholder.paid_amount < 2000 && new Date() > threeDaysAfterPurchase;
        });

        const pending = shareholders.filter(shareholder => 
          shareholder.remaining_payment > 0
        );

        const completed = shareholders.filter(shareholder => 
          shareholder.remaining_payment === 0
        );

        setStats({
          totalAmount,
          collectedAmount,
          remainingAmount,
          overdueDeposits: overdue.length,
          pendingPayments: pending.length,
          completedPayments: completed.length,
        });

        setOverdueDeposits(overdue);
        setPendingPayments(pending);
        setCompletedPayments(completed);
      }
    }

    fetchData();
  }, []);

  const tabs = [
    {
      value: "overdue-deposits",
      label: `Eksik Kaporalar (${overdueDeposits.length})`,
      content: <CustomDataTable columns={overdueDepositsColumns} data={overdueDeposits} pageSizeOptions={[10, 20, 50, 100]} />,
    },
    {
      value: "pending-payments",
      label: `Eksik Ödemeler (${pendingPayments.length})`,
      content: <CustomDataTable columns={pendingPaymentsColumns} data={pendingPayments} pageSizeOptions={[10, 20, 50, 100]} />,
    },
    {
      value: "completed-payments",
      label: `Ödemesi Tamamlananlar (${completedPayments.length})`,
      content: <CustomDataTable columns={completedPaymentsColumns} data={completedPayments} pageSizeOptions={[10, 20, 50, 100]} />,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ödeme Analizi</h1>
        <p className="text-muted-foreground">
          Ödemelerin genel durumu ve detayları
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CustomStatistics
          title="Toplanan Tutar"
          value={stats.collectedAmount}
          maxValue={stats.totalAmount}
          suffix=" ₺"
        />
        <CustomStatistics
          title="Kalan Tutar"
          value={stats.remainingAmount}
          maxValue={stats.totalAmount}
          suffix=" ₺"
        />
        <CustomStatistics
          title="Eksik Kapora"
          value={stats.overdueDeposits}
          maxValue={stats.overdueDeposits + stats.pendingPayments + stats.completedPayments}
          type="warning"
        />
      </div>

      <CustomTabs tabs={tabs} />
    </div>
  );
}

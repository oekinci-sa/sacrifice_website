"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { shareholderSchema } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

export default function OdemeAnaliziPage() {
  const router = useRouter();
  const [overdueDeposits, setOverdueDeposits] = useState<shareholderSchema[]>([]);
  const [pendingPayments, setPendingPayments] = useState<shareholderSchema[]>([]);
  const [completedPayments, setCompletedPayments] = useState<shareholderSchema[]>([]);
  const [stats, setStats] = useState({ paidAmount: 0, totalAmount: 0 });

  useEffect(() => {
    async function fetchData() {
      const { data: shareholders } = await supabase
        .from("shareholders")
        .select("*")
        .order("shareholder_name", { ascending: true });

      if (shareholders) {
        // Filter overdue deposits (less than 2000 TL paid within 3 days of purchase)
        const overdueDeposits = shareholders.filter(shareholder => {
          const purchaseDate = new Date(shareholder.purchase_time);
          const threeDaysAfterPurchase = new Date(purchaseDate.getTime() + (3 * 24 * 60 * 60 * 1000));
          return shareholder.paid_amount < 2000 && new Date() > threeDaysAfterPurchase;
        });

        // Filter pending payments (any remaining payment)
        const pendingPayments = shareholders.filter(shareholder => 
          shareholder.remaining_payment > 0 && shareholder.paid_amount >= 2000
        );

        // Filter completed payments
        const completedPayments = shareholders.filter(shareholder => 
          shareholder.remaining_payment === 0 && shareholder.paid_amount >= 2000
        );

        setOverdueDeposits(overdueDeposits);
        setPendingPayments(pendingPayments);
        setCompletedPayments(completedPayments);

        // Calculate total paid amount and total amount
        const totalPaidAmount = shareholders.reduce((total, shareholder) => total + shareholder.paid_amount, 0);
        const totalAmount = shareholders.reduce((total, shareholder) => total + shareholder.remaining_payment + shareholder.paid_amount, 0);
        setStats({ paidAmount: totalPaidAmount, totalAmount });
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading">Ödeme Analizi</h1>
        <p className="text-muted-foreground">Ödemelerin durumu ve detaylı analizi</p>

        <div className="mt-6">
          <StatCard
            title="Toplam Ödemeler"
            value={stats.paidAmount}
            maxValue={stats.totalAmount}
            suffix=" TL"
          />
        </div>
      </div>

      <Tabs defaultValue="overdue-deposits">
        <div className="inline-flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="overdue-deposits"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Eksik Kaporalar
              <Badge className="ml-2 rounded-sm border-[1px] border-border bg-transparent text-foreground shadow-none">
                {overdueDeposits.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="pending-payments"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Eksik Ödemeler
              <Badge className="ml-2 rounded-sm border-[1px] border-border bg-transparent text-foreground shadow-none">
                {pendingPayments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="completed-payments"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Ödemesi Tamamlananlar
              <Badge className="ml-2 rounded-sm border-[1px] border-border bg-transparent text-foreground shadow-none">
                {completedPayments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overdue-deposits" className="pt-6">
          <DataTable columns={columns} data={overdueDeposits} />
        </TabsContent>

        <TabsContent value="pending-payments" className="pt-6">
          <DataTable columns={columns} data={pendingPayments} />
        </TabsContent>

        <TabsContent value="completed-payments" className="pt-6">
          <DataTable columns={columns} data={completedPayments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { ShareholderStatistics } from "./components/statistics";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";

interface Shareholder {
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string;
  total_amount_to_pay: number;
  paid_amount: number;
  remaining_payment: number;
  payment_status: "paid" | "pending";
  delivery_type: "kesimhane" | "toplu-teslimat";
  delivery_location?: "yenimahalle-camii" | "kecioren-pazar";
  vekalet: boolean;
  notes?: string;
}

export default function ShareholdersPage() {
  const [data, setData] = useState<Shareholder[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: shareholders, error } = await supabase
        .from("shareholders")
        .select("*");

      if (error) {
        console.error("Error fetching shareholders:", error);
        return;
      }

      setData(shareholders || []);
    };

    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel("shareholders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shareholders",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hissedarlar</h2>
          <p className="text-muted-foreground">
            Tüm hissedarların listesi ve detaylı istatistikleri
          </p>
        </div>
      </div>
      <ShareholderStatistics />
      <DataTable data={data} columns={columns} />
    </div>
  );
} 
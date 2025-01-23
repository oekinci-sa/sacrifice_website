"use client";

import { useEffect, useState } from "react";
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { supabase } from "@/utils/supabaseClient";
import { shareholderSchema } from "@/types";

export default function TumHissedarlarPage() {
  const [data, setData] = useState<shareholderSchema[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: shareholders } = await supabase
        .from("shareholders")
        .select("*, total_amount, paid_amount")
        .order("shareholder_name", { ascending: true });

      if (shareholders) {
        setData(shareholders);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tüm Hissedarlar</h1>
        <p className="text-muted-foreground">
          Tüm hissedarların listesi
        </p>
      </div>
      <DataTable data={data} columns={columns} />
    </div>
  );
} 
"use client";

import { useEffect, useState } from "react";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { columns } from "./components/columns";
import { supabase } from "@/utils/supabaseClient";
import { ShareholderType } from "@/types";

export default function TumHissedarlarPage() {
  const [data, setData] = useState<ShareholderType[]>([]);

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
      
      <CustomDataTable data={data} columns={columns} />
    </div>
  );
} 
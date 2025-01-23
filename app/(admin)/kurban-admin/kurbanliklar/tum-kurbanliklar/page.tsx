"use client";

import { useEffect, useState } from "react";
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { supabase } from "@/utils/supabaseClient";
import { sacrificeSchema } from "@/types";

export default function TumKurbanliklarPage() {
  const [data, setData] = useState<sacrificeSchema[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: sacrifices } = await supabase
        .from("sacrifice_animals")
        .select("*")
        .order("sacrifice_no", { ascending: true });

      if (sacrifices) {
        setData(sacrifices);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tüm Kurbanlıklar</h1>
        <p className="text-muted-foreground">
          Tüm kurbanlıkların listesi
        </p>
      </div>
      <DataTable data={data} columns={columns} />
    </div>
  );
} 
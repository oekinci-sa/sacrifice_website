"use client";

import { useEffect, useState } from "react";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { columns } from "../components/columns";
import { supabase } from "@/utils/supabaseClient";
import { sacrificeSchema, ShareholderDetails } from "@/types";
import { ToolbarAndFilters } from "./ToolbarAndFilters";

export default function TumKurbanliklarPage() {
  const [data, setData] = useState<sacrificeSchema[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Fetch sacrifices
      const { data: sacrifices, error: sacrificesError } = await supabase
        .from("sacrifice_animals")
        .select("*")
        .order("sacrifice_no", { ascending: true });

      if (sacrificesError) {
        console.error('Error fetching sacrifices:', sacrificesError);
        return;
      }

      if (!sacrifices) return;

      // Fetch shareholders for all sacrifices
      const { data: shareholders, error: shareholdersError } = await supabase
        .from("shareholders")
        .select("shareholder_name, phone_number, paid_amount, total_amount, delivery_location, sacrifice_id");

      if (shareholdersError) {
        console.error('Error fetching shareholders:', shareholdersError);
        return;
      }

      // Group shareholders by sacrifice_id
      const shareholdersByAnimal = shareholders?.reduce((acc, shareholder) => {
        if (!acc[shareholder.sacrifice_id]) {
          acc[shareholder.sacrifice_id] = [];
        }
        acc[shareholder.sacrifice_id].push(shareholder);
        return acc;
      }, {} as Record<string, ShareholderDetails[]>);

      // Combine sacrifices with their shareholders
      const sacrificesWithShareholders = sacrifices.map(sacrifice => ({
        ...sacrifice,
        shareholders: shareholdersByAnimal[sacrifice.sacrifice_id] || []
      }));

      setData(sacrificesWithShareholders);
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
      <CustomDataTable 
        data={data} 
        columns={columns} 
        filters={({ table }) => (
          <ToolbarAndFilters 
            table={table}
          />
        )}
      />
    </div>
  );
} 
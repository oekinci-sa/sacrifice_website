"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { columns, type ChangeLog } from "./components/columns";

export default function ChangeLogsPage() {
  const [data, setData] = useState<ChangeLog[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: logs, error } = await supabase
        .from("change_logs")
        .select("*")
        .order("changed_at", { ascending: false });

      if (error) {
        console.error("Error fetching change logs:", error);
        return;
      }

      if (logs) {
        setData(logs);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Değişiklik Kayıtları</h1>
        <p className="text-muted-foreground">
          Sistemde yapılan tüm değişikliklerin kayıtları
        </p>
      </div>
      <CustomDataTable 
        data={data} 
        columns={columns} 
        filters={[
          {
            id: "change_type",
            title: "İşlem Türü",
            options: [
              { label: "Ekleme", value: "Ekleme" },
              { label: "Güncelleme", value: "Güncelleme" },
              { label: "Silme", value: "Silme" },
            ],
          },
          {
            id: "table_name",
            title: "Tablo",
            options: [
              { label: "Kurbanlıklar", value: "sacrifice_animals" },
              { label: "Hissedarlar", value: "shareholders" },
            ],
          },
        ]}
      />
    </div>
  );
} 
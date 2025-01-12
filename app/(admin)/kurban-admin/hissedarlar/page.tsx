"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { shareholderSchema } from "@/types";

export default function ShareholdersPage() {
  const [data, setData] = useState<shareholderSchema[]>([]);

  useEffect(() => {
    // İlk veri yüklemesi
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

    // Gerçek zamanlı güncellemeler için subscription
    const subscription = supabase
      .channel('shareholders-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'shareholders' 
        }, 
        (payload) => {
          // Değişiklik türüne göre state'i güncelle
          if (payload.eventType === 'INSERT') {
            setData(prevData => [...prevData, payload.new as shareholderSchema]);
          } else if (payload.eventType === 'DELETE') {
            setData(prevData => prevData.filter(item => item.shareholder_id !== payload.old.shareholder_id));
          } else if (payload.eventType === 'UPDATE') {
            setData(prevData => prevData.map(item => 
              item.shareholder_id === payload.new.shareholder_id ? payload.new as shareholderSchema : item
            ));
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hissedarlar</h1>
        <p className="text-muted-foreground">
          Tüm hissedarların listesi ve detayları
        </p>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
} 
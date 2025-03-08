"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { columns } from "./components/columns";
import { useToast } from "@/hooks/use-toast";
import { shareholderSchema } from "@/types";
import { ShareholderSearch } from "./components/shareholder-search";

export default function TumHissedarlar() {
  const [data, setData] = useState<shareholderSchema[]>([]);
  const [filteredData, setFilteredData] = useState<shareholderSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchShareHolders = async () => {
      try {
        const { data: shareholders, error } = await supabase
          .from("shareholders")
          .select("*, sacrifice:sacrifice_id(sacrifice_id, sacrifice_no)");

        if (error) {
          throw error;
        }

        const formattedData = shareholders as shareholderSchema[];
        setData(formattedData);
        setFilteredData(formattedData);
      } catch (error: any) {
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchShareHolders();

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
        (payload) => {
          fetchShareHolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleSearch = (searchValue: string) => {
    if (!searchValue.trim()) {
      setFilteredData(data);
      return;
    }

    const lowerSearchValue = searchValue.toLowerCase();
    
    // Sadece isim ve telefon numarası araması
    const filtered = data.filter((shareholder) => {
      // İsim Soyisim araması
      const nameMatch = shareholder.shareholder_name
        ?.toLowerCase()
        .includes(lowerSearchValue);
      
      // Telefon numarası araması
      const phoneMatch = shareholder.phone_number
        ?.toLowerCase()
        .includes(lowerSearchValue);
      
      return nameMatch || phoneMatch;
    });

    setFilteredData(filtered);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Tüm Hissedarlar</h1>
          <ShareholderSearch onSearch={handleSearch} />
        </div>
        <CustomDataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
} 
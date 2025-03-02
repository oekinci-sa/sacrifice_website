"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { columns } from "./components/columns";
import { useToast } from "@/hooks/use-toast";
import { ShareholderFilter } from "./components/shareholder-filter";
import { shareholderSchema } from "@/types";

export default function TumHissedarlar() {
  const [isLoading, setIsLoading] = useState(true);
  const [allShareholders, setAllShareholders] = useState<shareholderSchema[]>([]);
  const [filteredShareholders, setFilteredShareholders] = useState<shareholderSchema[]>([]);
  const { toast } = useToast();

  const fetchShareholders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("shareholders")
        .select(`
          *,
          sacrifice:sacrifice_animals (
            sacrifice_id, 
            sacrifice_no
          )
        `)
        .order("purchase_time", { ascending: false });

      if (error) {
        throw error;
      }

      setAllShareholders(data || []);
      setFilteredShareholders(data || []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: `Hissedarlar yüklenirken bir sorun oluştu: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShareholders();
  }, []);

  // Filtreleme işlevini yöneten fonksiyon
  const handleFilter = (filtered: shareholderSchema[]) => {
    setFilteredShareholders(filtered);
  };

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tüm Hissedarlar</h2>
        <p className="text-muted-foreground">
          Bu sayfada tüm hissedarların listesini görüntüleyebilirsiniz.
        </p>
      </div>

      {/* Arama/Filtreleme componenti */}
      <ShareholderFilter 
        shareholders={allShareholders} 
        onFilter={handleFilter} 
      />
      
      <CustomDataTable
        columns={columns}
        data={filteredShareholders}
        isLoading={isLoading}
        searchKey="shareholder_name"
      />
    </div>
  );
} 
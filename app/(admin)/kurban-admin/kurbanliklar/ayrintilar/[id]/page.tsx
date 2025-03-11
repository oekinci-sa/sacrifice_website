"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSacrificeById } from "@/hooks/useSacrifices";
import { Loading } from "@/components/ui/loading";
import { NotFound } from "@/components/ui/not-found";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

export default function KurbanlikAyrintilariPage({ params }: { params: { id: string } }) {
  const { data: sacrifice, isLoading } = useSacrificeById(params.id);
  const { toast } = useToast();

  if (isLoading) {
    return <Loading />;
  }
  
  if (!sacrifice) {
    return <NotFound message="Kurbanlık bulunamadı" />;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/kurban-admin/kurbanliklar/tum-kurbanliklar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Kurbanlık Ayrıntıları</h1>
        </div>
        
        <Button asChild>
          <Link href={`/kurban-admin/kurbanliklar/duzenle/${sacrifice.sacrifice_id}`}>
            Düzenle
          </Link>
        </Button>
      </div>
      
      {/* 3 sütunlu grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Kurbanlık No</p>
          <p className="font-medium">{sacrifice.sacrifice_no}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Kesim Saati</p>
          <p className="font-medium">{sacrifice.sacrifice_time || "-"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Ağırlık</p>
          <p className="font-medium">{sacrifice.share_weight} kg</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Boş Hisse</p>
          <p className="font-medium">{sacrifice.empty_share}/7</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Hisse Fiyatı</p>
          <p className="font-medium">{sacrifice.share_price ? `${sacrifice.share_price.toLocaleString('tr-TR')} TL` : "-"}</p>
        </div>
      </div>
      
      {/* Notlar */}
      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Notlar</p>
        <p className="font-medium">{sacrifice.notes || "-"}</p>
      </div>
      
      {/* Sadece son düzenleyen bilgisi */}
      {sacrifice.last_modified_by && (
        <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
          Son düzenleyen: <span className="font-medium">{sacrifice.last_modified_by}</span>
          {sacrifice.last_modified_at ? format(new Date(sacrifice.last_modified_at), " - dd.MM.yyyy HH:mm") : ""}
        </div>
      )}
    </div>
  );
}

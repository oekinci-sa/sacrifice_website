"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { MISMATCHES_UPDATED_EVENT } from "@/hooks/useUnacknowledgedMismatchesCount";
import {
  createColumns,
  type MismatchedShareRow,
} from "./components/columns";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function UyumsuzHisselerPage() {
  const [items, setItems] = useState<MismatchedShareRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bilinmeyenler" | "bilinenler">(
    "bilinmeyenler"
  );
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/mismatched-shares");
      if (!res.ok) {
        const data = await res.json();
        const msg = data.details
          ? `${data.error || "Veri alınamadı"}\n\n${data.details}`
          : (data.error || "Veri alınamadı");
        throw new Error(msg);
      }
      const { items: data } = await res.json();
      setItems(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAcknowledge = useCallback(
    async (sacrificeId: string) => {
      setAcknowledgingId(sacrificeId);
      try {
        const res = await fetch("/api/admin/mismatched-shares/acknowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sacrifice_id: sacrificeId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Kaydedilemedi");
        }
        toast({ title: "Farkındalık kaydedildi", variant: "default" });
        await fetchItems();
        window.dispatchEvent(new Event(MISMATCHES_UPDATED_EVENT));
      } catch (err) {
        toast({
          title: "Hata",
          description: err instanceof Error ? err.message : "Bir hata oluştu",
          variant: "destructive",
        });
      } finally {
        setAcknowledgingId(null);
      }
    },
    [toast, fetchItems]
  );

  const handleRevoke = useCallback(
    async (sacrificeId: string) => {
      setRevokingId(sacrificeId);
      try {
        const res = await fetch("/api/admin/mismatched-shares/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sacrifice_id: sacrificeId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Geri alınamadı");
        }
        toast({ title: "Farkındalık geri alındı", variant: "default" });
        await fetchItems();
        window.dispatchEvent(new Event(MISMATCHES_UPDATED_EVENT));
      } catch (err) {
        toast({
          title: "Hata",
          description: err instanceof Error ? err.message : "Bir hata oluştu",
          variant: "destructive",
        });
      } finally {
        setRevokingId(null);
      }
    },
    [toast, fetchItems]
  );

  const columns = useMemo(
    () => createColumns(handleAcknowledge, acknowledgingId, handleRevoke, revokingId),
    [handleAcknowledge, acknowledgingId, handleRevoke, revokingId]
  );

  const { bilinmeyenler, bilinenler } = useMemo(() => {
    const unknown: MismatchedShareRow[] = [];
    const known: MismatchedShareRow[] = [];
    for (const row of items) {
      if (!row.acknowledged_at) unknown.push(row);
      else known.push(row);
    }
    return { bilinmeyenler: unknown, bilinenler: known };
  }, [items]);

  if (error) {
    return (
      <div className="space-y-8">
        <div className="w-full">
          <h1 className="text-2xl font-semibold tracking-tight mt-0">
            Uyumsuzluklar
          </h1>
          <p className="text-muted-foreground mt-2 max-w-[50%]">
            Hissedar-boş hisse uyumsuzluklarını listeler, farkındalık kaydedebilirsiniz.
          </p>
        </div>
        <div className="bg-destructive/10 p-4 rounded-md text-destructive whitespace-pre-line">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight mt-0">
          Uyumsuzluklar
        </h1>
        <p className="text-muted-foreground mt-2">
          Hissedar sayısı ile boş hisse toplamı 7 olmayan kurbanlıkları listeler, farkındalık kaydedebilir veya geri alabilirsiniz. Yeni hissedar eklendiğinde farkındalık sıfırlanır.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as "bilinmeyenler" | "bilinenler")
            }
          >
            <TabsList>
              <TabsTrigger value="bilinmeyenler">
                Bilinmeyenler ({bilinmeyenler.length})
              </TabsTrigger>
              <TabsTrigger value="bilinenler">
                Bilinenler ({bilinenler.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bilinmeyenler" className="mt-4">
              {bilinmeyenler.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-muted-foreground">
                  Bilinmeyen uyumsuzluk bulunmuyor.
                </div>
              ) : (
                <CustomDataTable
                  columns={columns}
                  data={bilinmeyenler}
                  tableSize="medium"
                  pageSizeOptions={[20, 50, 100, 200]}
                />
              )}
            </TabsContent>

            <TabsContent value="bilinenler" className="mt-4">
              {bilinenler.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-muted-foreground">
                  Bilinen uyumsuzluk bulunmuyor.
                </div>
              ) : (
                <CustomDataTable
                  columns={columns}
                  data={bilinenler}
                  tableSize="medium"
                  pageSizeOptions={[20, 50, 100, 200]}
                />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

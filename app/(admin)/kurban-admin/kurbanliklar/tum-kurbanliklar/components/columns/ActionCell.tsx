"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useSacrifices } from "@/hooks/useSacrifices";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { getDeliveryDisplayLabel } from "@/lib/delivery-options";
import { cn } from "@/lib/utils";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { sacrificeSchema, shareholderSchema } from "@/types";
import { Row } from "@tanstack/react-table";
import { CircleX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function ActionCellContent({ row }: { row: Row<sacrificeSchema> }) {
  const branding = useTenantBranding();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  const { refetch } = useSacrifices();
  const sacrificeId = row.original.sacrifice_id;
  const [shareholders, setShareholders] = useState<shareholderSchema[]>([]);

  const { shareholders: allShareholders } = useShareholderStore();

  const fetchShareholderDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/sacrifices/${sacrificeId}/shareholders`);

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hissedar bilgileri yüklenirken bir hata oluştu.",
        });
        return;
      }

      const data = await response.json();
      setShareholders(data);
    } catch {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hissedar bilgileri yüklenirken bir hata oluştu.",
      });
    }
  }, [sacrificeId, toast]);

  useEffect(() => {
    if (isDialogOpen) {
      const sacrificeShareholders = allShareholders.filter(
        (shareholder: shareholderSchema) => shareholder.sacrifice_id === sacrificeId
      );

      if (sacrificeShareholders.length > 0) {
        setShareholders(sacrificeShareholders);
      } else {
        fetchShareholderDetails();
      }
    }
  }, [sacrificeId, isDialogOpen, allShareholders, fetchShareholderDetails]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/sacrifices/${sacrificeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sacrifice');
      }

      toast({
        title: "Başarılı",
        description: "Kurbanlık ve ilişkili hissedarlar başarıyla silindi!",
        variant: "default"
      });
      setIsDeleteConfirmOpen(false);
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Kurbanlık silinirken bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex items-center justify-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-sac-red hover:bg-sac-red-light"
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                <span className="sr-only">Kurbanlığı sil</span>
                <CircleX className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Kurbanlığı sil</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-12 w-[550px] max-w-[90vw]">
          <DialogHeader className="text-center space-y-4">
            <DialogTitle className="text-2xl text-center font-semibold">Hissedar Bilgileri</DialogTitle>
            <DialogDescription className="text-md text-center font-medium">
              Hissedarlar için daha fazla bilgi için
              <br />
              <Link
                href="/kurban-admin/hissedarlar/tum-hissedarlar"
                className="font-semibold hover:text-sac-icon-primary transition-all duration-300"
              >
                Tüm Hissedarlar
              </Link>{" "}
              sayfasını ziyaret ediniz.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className={`${shareholders.length <= 3 ? 'h-auto' : 'max-h-[60vh]'} pr-4`}>
            <div className="space-y-4 mt-8">
              {shareholders.map((shareholder, index) => (
                <div key={index}>
                  <div
                    onClick={() => router.push(`/kurban-admin/hissedarlar/ayrintilar/${shareholder.shareholder_id}`)}
                    className="transition-all duration-200 hover:bg-gray-50 rounded-lg p-4 cursor-pointer"
                  >
                    <div className="grid grid-cols-[auto_1fr_1fr] gap-6 items-center">
                      <div className="flex items-center justify-center bg-sac-avatar-bg rounded-full p-2 w-12 h-12">
                        <i className="bi bi-person-circle text-sac-icon-primary text-2xl"></i>
                      </div>

                      <div className="space-y-1">
                        <div className="text-black font-bold">{shareholder.shareholder_name}</div>
                        <div className="text-sac-muted text-sm">
                          {shareholder.phone_number ? shareholder.phone_number.replace("+90", "0") : "-"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={Math.floor((shareholder.paid_amount / shareholder.total_amount) * 100)}
                                  className="flex-1"
                                  style={{
                                    ["--progress-background" as string]: (shareholder.remaining_payment > 0)
                                      ? shareholder.paid_amount < branding.deposit_amount
                                        ? "var(--sac-red-muted)"
                                        : "var(--sac-yellow-muted)"
                                      : "var(--sac-primary-muted)",
                                    ["--progress-foreground" as string]: (shareholder.remaining_payment > 0)
                                      ? shareholder.paid_amount < branding.deposit_amount
                                        ? "var(--sac-red)"
                                        : "var(--sac-yellow)"
                                      : "var(--sac-primary)",
                                  } as React.CSSProperties}
                                />
                                <span className={cn(
                                  "text-sm tabular-nums",
                                  shareholder.paid_amount < branding.deposit_amount ? "text-red-600" : "text-sac-primary"
                                )}>
                                  %{Math.floor((shareholder.paid_amount / shareholder.total_amount) * 100).toString().padStart(3)}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="p-4 w-[280px] bg-white">
                              <div className="space-y-2">
                                {shareholder.remaining_payment <= 0 ? (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-sac-primary" />
                                      <span className="text-sm text-muted-foreground">Ödeme Tamamlandı:</span>
                                    </div>
                                    <span className="text-sm font-medium">
                                      {new Intl.NumberFormat('tr-TR', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                      }).format(shareholder.paid_amount) + ' TL'}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-sac-primary" />
                                        <span className="text-sm text-muted-foreground">Ödenen Tutar:</span>
                                      </div>
                                      <span className="text-sm font-medium">
                                        {new Intl.NumberFormat('tr-TR', {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0
                                        }).format(shareholder.paid_amount) + ' TL'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-sac-red" />
                                        <span className="text-sm text-muted-foreground">Kalan Tutar:</span>
                                      </div>
                                      <span className="text-sm font-medium text-foreground">
                                        {new Intl.NumberFormat('tr-TR', {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0
                                        }).format(shareholder.remaining_payment) + ' TL'}
                                      </span>
                                    </div>
                                    <Separator className="my-2 bg-gray-200" />
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-sac-muted" />
                                        <span className="text-sm text-muted-foreground">Toplam Tutar:</span>
                                      </div>
                                      <span className="text-sm font-medium text-foreground">
                                        {new Intl.NumberFormat('tr-TR', {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0
                                        }).format(shareholder.total_amount) + ' TL'}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="text-sac-muted text-sm text-right">
                          {getDeliveryDisplayLabel(branding.logo_slug, shareholder.delivery_location ?? "")}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < shareholders.length - 1 && (
                    <div className="my-4 border-t border-dashed border-sac-muted opacity-50" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kurbanlığı Sil</DialogTitle>
            <DialogDescription className="pt-2 text-red-500 font-medium">
              Dikkat: Bu kurbanlık silinirse, bu kurbanlığı alan hissedarların kayıtları da silinecektir.
            </DialogDescription>
            <DialogDescription className="pt-2">
              Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Evet, Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

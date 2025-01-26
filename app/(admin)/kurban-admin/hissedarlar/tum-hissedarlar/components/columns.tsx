"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareholderType } from "@/types";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const columns: ColumnDef<ShareholderType>[] = [
  {
    accessorKey: "shareholder_name",
    header: "İsim Soyisim",
    cell: ({ row }) => (
      <div className="text-center py-2 text-sm font-medium">
        {row.getValue("shareholder_name")}
      </div>
    ),
  },
  {
    accessorKey: "phone_number",
    header: "Telefon",
    cell: ({ row }) => {
      const phone = row.getValue("phone_number") as string;
      return (
        <div className="text-center py-2 text-sm font-medium">
          {phone.replace("+90", "0")}
        </div>
      );
    },
  },
  {
    accessorKey: "remaining_payment",
    header: "Kalan Tutar",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("remaining_payment"));
      const formatted = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(amount);

      return <div className="text-center py-2 text-sm font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "payment_ratio",
    header: "Ödeme Oranı",
    accessorFn: (row) => {
      const paidAmount = row.paid_amount;
      const totalAmount = row.total_amount;
      return (paidAmount / totalAmount) * 100;
    },
    cell: ({ row }) => {
      const paidAmount = parseFloat(row.original.paid_amount);
      const totalAmount = parseFloat(row.original.total_amount);
      const ratio = (paidAmount / totalAmount) * 100;

      return (
        <div className="flex items-center justify-center gap-4">
          <Progress
            value={ratio}
            className="w-[60%]"
            style={
              {
                ["--progress-background" as string]:
                  ratio < 50 ? "rgb(220 38 38 / 0.2)" : ratio < 100 ? "rgb(202 138 4 / 0.2)" : "rgb(22 163 74 / 0.2)",
                ["--progress-foreground" as string]:
                  ratio < 50 ? "rgb(220 38 38)" : ratio < 100 ? "rgb(202 138 4)" : "rgb(22 163 74)",
              } as React.CSSProperties
            }
          />
          <div
            className={cn(
              "text-sm tabular-nums",
              ratio < 50 ? "text-red-600" : ratio < 100 ? "text-yellow-600" : "text-green-600",
            )}
          >
            %{ratio.toFixed(0)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "delivery_location",
    header: "Teslimat Noktası",
    cell: ({ row }) => {
      const location = row.getValue("delivery_location");
      let displayLocation = "Kesimhane";
      
      if (location === "yenimahalle-pazar-yeri") {
        displayLocation = "Yenimahalle Pazar Yeri";
      } else if (location === "kecioren-otoparki") {
        displayLocation = "Keçiören Otoparkı";
      }
      
      return (
        <div className="text-center py-2 text-sm font-medium">
          {displayLocation}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "sacrifice_consent",
    header: "Vekalet",
    cell: ({ row }) => {
      const sacrifice_consent = row.getValue("sacrifice_consent");

      return (
        <div className="text-center py-2 text-sm font-medium">
          <div className={cn(
            "inline-flex items-center justify-center rounded-md px-2 py-1 min-w-[80px]",
            sacrifice_consent 
              ? "bg-[#F0FBF1] text-[#39C645]" 
              : "bg-[#FCEFEF] text-[#D22D2D]"
          )}>
            {sacrifice_consent ? "Alındı" : "Alınmadı"}
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const router = useRouter();
      
      return (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-[#E6EAF2] hover:text-[#367CFE]"
            onClick={() => {
              // TODO: Implement view functionality
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-[#E6EAF2] hover:text-[#367CFE]"
            onClick={() => {
              router.push(
                `/kurban-admin/hissedarlar/ayrintilar/${row.original.shareholder_id}`
              );
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hissedarı Sil</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu hissedarı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={async () => {
                    const { error } = await supabase
                      .from("shareholders")
                      .delete()
                      .eq("shareholder_id", row.original.shareholder_id);

                    if (error) {
                      toast.error("Hissedar silinirken bir hata oluştu");
                      return;
                    }

                    toast.success("Hissedar başarıyla silindi");
                    window.location.reload();
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    },
  },
]; 
"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
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
import MyTooltip from "./my-tooltip";
import { sortingFunctions } from "@/utils/table-sort-helpers";

// Create a separate component for the cell content
const ActionCellContent = ({ row }: { row: Row<shareholderSchema> }) => {
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("shareholders")
        .delete()
        .eq("shareholder_id", row.original.shareholder_id);

      if (error) {
        throw error;
      }

      toast({
        title: "Başarılı",
        description: "Hissedar başarıyla silindi.",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/kurban-admin/hissedarlar/ayrintilar/${row.original.shareholder_id}`)}
        className="h-8 w-8"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu, veritabanınızdan bu hissedarı kalıcı olarak silecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const columns: ColumnDef<shareholderSchema>[] = [
  {
    accessorKey: "shareholder_name",
    header: "İsim Soyisim",
    enableSorting: true,
    sortingFn: sortingFunctions.text,
    cell: ({ row }) => row.getValue("shareholder_name"),
    filterFn: (row, id, value) => {
      return row.getValue(id)
        .toLowerCase()
        .includes((value as string).toLowerCase())
    },
  },
  {
    accessorKey: "sacrifice.sacrifice_no",
    header: "Kur. Sır.",
    enableSorting: true,
    sortingFn: sortingFunctions.number,
    cell: ({ row }) => {
      const sacrifice = row.original.sacrifice;
      return sacrifice?.sacrifice_no || "-";
    },
  },
  {
    accessorKey: "phone_number",
    header: "Telefon",
    enableSorting: false,
    cell: ({ row }) => {
      const phoneRaw = row.getValue("phone_number") as string;
      const phoneFormatted = phoneRaw.startsWith("+9") 
        ? `0${phoneRaw.substring(3)}` 
        : phoneRaw;
      
      return phoneFormatted.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
    },
  },
  {
    accessorKey: "purchase_time",
    header: "Kayıt Tarihi",
    enableSorting: true,
    sortingFn: sortingFunctions.date,
    cell: ({ row }) => {
      const date = new Date(row.getValue("purchase_time"));
      return format(date, "dd MMM yyyy - HH:mm", { locale: tr });
    },
  },
  {
    id: "payment_status",
    header: "Ödeme Durumu",
    enableSorting: true,
    accessorFn: (row) => {
      const paid = parseFloat(row.paid_amount.toString());
      const total = parseFloat(row.total_amount.toString());
      return total > 0 ? (paid / total) * 100 : 0;
    },
    sortingFn: sortingFunctions.paymentPercentage,
    cell: ({ row }) => {
      const paid = parseFloat(row.original.paid_amount.toString());
      const total = parseFloat(row.original.total_amount.toString());
      const remaining = parseFloat(row.original.remaining_payment.toString());
      
      const ratio = total > 0 ? (paid / total) * 100 : 0;
      const ratioString = ratio.toFixed(0);
      
      let statusText = "";
      let statusColorClass = "";
      
      if (paid < 2000) {
        statusText = "Kapora Bekleniyor";
        statusColorClass = "bg-[#FCEFEF] text-[#D22D2D]";
      } else if (paid < total) {
        statusText = "Tüm Ödeme Bekleniyor";
        statusColorClass = "bg-[#FFFAEC] text-[#F9BC06]";
      } else {
        statusText = "Tamamlandı";
        statusColorClass = "bg-[#F0FBF1] text-[#39C645]";
      }
      
      // Tooltip içeriği
      const tooltipContent = (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between gap-4">
            <span className="font-medium">Toplam Tutar:</span>
            <span>{new Intl.NumberFormat('tr-TR').format(total)} ₺</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-medium">Ödenen Tutar:</span>
            <span>{new Intl.NumberFormat('tr-TR').format(paid)} ₺</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-medium">Kalan Tutar:</span>
            <span>{new Intl.NumberFormat('tr-TR').format(remaining)} ₺</span>
          </div>
        </div>
      );
      
      return (
        <div className="flex justify-center">
          <MyTooltip content={tooltipContent}>
            <div className="flex items-center space-x-2">
              <span className={`rounded-md px-1 py-1 w-[175px] text-center ${statusColorClass}`}>
                {statusText}
              </span>
              <span className={`rounded-md px-1 py-1 w-[50px] text-center ${statusColorClass}`}>
                %{ratioString}
              </span>
            </div>
          </MyTooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "delivery_location",
    header: "Teslimat Noktası",
    enableSorting: false,
    cell: ({ row }) => {
      const location = row.getValue("delivery_location");
      
      if (location === "yenimahalle-pazar-yeri") {
        return "Yenimahalle Pazar Yeri";
      } else if (location === "kecioren-otoparki") {
        return "Keçiören Otoparkı";
      }
      
      return "Kesimhane";
    },
  },
  {
    accessorKey: "sacrifice_consent",
    header: "Vekalet",
    enableSorting: false,
    cell: ({ row }) => {
      const sacrifice_consent = row.getValue("sacrifice_consent");
      
      return (
        <span className={cn(
          "inline-block rounded-md px-2 py-1 min-w-[80px] text-center",
          sacrifice_consent 
            ? "bg-[#F0FBF1] text-[#39C645]" 
            : "bg-[#FCEFEF] text-[#D22D2D]"
        )}>
          {sacrifice_consent ? "Alındı" : "Alınmadı"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => <ActionCellContent row={row} />,
  },
];
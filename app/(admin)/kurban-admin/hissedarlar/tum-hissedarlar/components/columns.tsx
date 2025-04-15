"use client";

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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useDeleteShareholder } from "@/hooks/useShareholders";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { sortingFunctions } from "@/utils/table-sort-helpers";
import { ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Create a separate component for the cell content
const ActionCellContent = ({ row }: { row: Row<shareholderSchema> }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const deleteMutation = useDeleteShareholder();
  const { toast } = useToast();

  const handleDelete = async () => {
    deleteMutation.mutate(row.original.shareholder_id, {
      onSuccess: () => {
        setIsOpen(false);
        toast({
          title: "Başarılı",
          description: "Hissedar başarıyla silindi.",
        });
      },
      onError: (error: unknown) => {
        toast({
          title: "Hata",
          description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/kurban-admin/hissedarlar/ayrintilar/${row.original.shareholder_id}`)}
        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-100"
      >
        <span className="sr-only">Düzenle</span>
        <Pencil className="h-4 w-4" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-100"
          >
            <span className="sr-only">Sil</span>
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
            <AlertDialogCancel disabled={deleteMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : "Sil"}
            </AlertDialogAction>
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
      const rowValue = row.getValue(id);
      // Ensure the value is a string before calling toLowerCase
      return typeof rowValue === 'string'
        ? rowValue.toLowerCase().includes((value as string).toLowerCase())
        : false;
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

      // Format currency 
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount) + ' TL';
      };

      return (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <span className={`rounded-md px-1 py-1 w-[175px] text-center ${statusColorClass}`}>
                    {statusText}
                  </span>
                  <span className={`rounded-md px-1 py-1 w-[50px] text-center ${statusColorClass}`}>
                    %{ratioString}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-4 w-[300px] bg-white">
                <div className="space-y-2">
                  {paid >= total ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#1DC355]" />
                        <span className="text-sm text-muted-foreground">Ödeme Tamamlandı:</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(paid)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#1DC355]" />
                          <span className="text-sm text-muted-foreground">Ödenen Tutar:</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(paid)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#D22D2D]" />
                          <span className="text-sm text-muted-foreground">Kalan Tutar:</span>
                        </div>
                        <span className="text-sm font-medium text-[#000000]">{formatCurrency(remaining)}</span>
                      </div>
                      <Separator className="my-2 bg-gray-200" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280]" />
                          <span className="text-sm text-muted-foreground">Toplam Tutar:</span>
                        </div>
                        <span className="text-sm font-medium text-[#000000]">{formatCurrency(total)}</span>
                      </div>
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
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
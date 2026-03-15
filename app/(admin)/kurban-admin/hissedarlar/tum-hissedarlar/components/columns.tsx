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
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { sortingFunctions } from "@/utils/table-sort-helpers";
import { ColumnDef, Row } from "@tanstack/react-table";
import { formatDateMedium } from "@/lib/date-utils";
import { AlertCircle, Check, CheckCircle2, Clock, Loader2, Pencil, Phone, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function ContactedButton({
  shareholderId,
  isContacted,
  shareholder,
}: {
  shareholderId: string;
  isContacted: boolean;
  shareholder: shareholderSchema;
}) {
  const [loading, setLoading] = useState(false);
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shareholders/${shareholderId}/contacted`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacted: !isContacted }),
      });
      if (res.ok) {
        const data = await res.json();
        updateShareholder({ ...data, sacrifice: shareholder.sacrifice });
        window.dispatchEvent(new Event("shareholders-updated"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isContacted
                ? "bg-sac-blue-light text-sac-blue hover:bg-sac-blue-light/80"
                : "bg-sac-yellow-light text-sac-yellow hover:bg-sac-yellow-light/80"
            )}
            onClick={handleClick}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isContacted ? (
              <Check className="h-4 w-4" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isContacted ? "Görüşülmedi olarak işaretle" : "Görüşüldü olarak işaretle"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Create a separate component for the cell content
const ActionCellContent = ({ row }: { row: Row<shareholderSchema> }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const deleteMutation = useDeleteShareholder();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutate(row.original.shareholder_id);
      setIsOpen(false);
      toast({
        title: "Başarılı",
        description: "Hissedar başarıyla silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/kurban-admin/hissedarlar/ayrintilar/${row.original.shareholder_id}`)}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-sac-icon-primary hover:bg-sac-avatar-bg"
      >
        <span className="sr-only">Düzenle</span>
        <Pencil className="h-4 w-4" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-sac-red hover:bg-sac-red-light"
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
            <AlertDialogCancel disabled={deleteMutation.isLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isLoading ? (
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

// Create a separate component for the sacrifice number cell
const SacrificeNumberCell = ({ sacrificeNo, sacrificeId }: { sacrificeNo: string | number, sacrificeId?: string }) => {
  const router = useRouter();

  if (sacrificeNo === "-") return <div>{sacrificeNo}</div>;

  return (
    <Button
      variant="link"
      className="p-0 h-auto"
      onClick={() => {
        if (sacrificeId) {
          router.push(`/kurban-admin/kurbanliklar/ayrintilar/${sacrificeId}`);
        }
      }}
    >
      {sacrificeNo}
    </Button>
  );
};

export const columns: ColumnDef<shareholderSchema>[] = [
  {
    accessorKey: "shareholder_name",
    header: "İsim Soyisim",
    enableSorting: true,
    sortingFn: sortingFunctions.text,
    cell: ({ row }) => row.getValue("shareholder_name"),
    filterFn: (row, id, value: string) => {
      const rowValue = row.getValue(id);
      // Ensure the value is a string before calling toLowerCase
      return typeof rowValue === 'string'
        ? rowValue.toLowerCase().includes((value as string).toLowerCase())
        : false;
    },
  },
  {
    id: "sacrifice_no",
    accessorFn: (row) => row.sacrifice?.sacrifice_no || "-",
    header: "Kur. Sır.",
    enableSorting: true,
    sortingFn: sortingFunctions.number,
    cell: ({ row }) => {
      const sacrifice = row.original.sacrifice;
      const sacrificeNo = sacrifice?.sacrifice_no || "-";
      return <SacrificeNumberCell sacrificeNo={sacrificeNo} sacrificeId={sacrifice?.sacrifice_id} />;
    },
  },
  {
    accessorKey: "phone_number",
    header: "Telefon",
    enableSorting: false,
    cell: ({ row }) => {
      const phoneRaw = row.getValue("phone_number") as string | null;
      return formatPhoneForDisplayWithSpacing(phoneRaw || "");
    },
  },
  {
    accessorKey: "delivery_location",
    header: "Teslimat Noktası",
    enableSorting: false,
    cell: ({ row }) => {
      const location = row.getValue("delivery_location") as string;

      return (
        <div className="text-center">
          {location}
        </div>
      );
    },
  },
  {
    accessorKey: "contacted_at",
    header: "Görüşüldü",
    enableSorting: true,
    sortingFn: (a, b) => {
      const aVal = a.original.contacted_at ?? "";
      const bVal = b.original.contacted_at ?? "";
      return aVal.localeCompare(bVal);
    },
    cell: ({ row }) => {
      const isContacted = !!row.original.contacted_at;
      return (
        <ContactedButton
          shareholderId={row.original.shareholder_id}
          isContacted={isContacted}
          shareholder={row.original}
        />
      );
    },
  },
  {
    accessorKey: "purchase_time",
    header: "Kayıt Tarihi",
    enableSorting: true,
    sortingFn: sortingFunctions.date,
    cell: ({ row }) => formatDateMedium(row.getValue("purchase_time")),
  },
  {
    id: "payment_status",
    header: "Ödeme",
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
      let StatusIcon: React.ElementType;
      let statusColorClass: string;
      let tooltipLabel: string;

      if (paid < 5000) {
        StatusIcon = AlertCircle;
        statusColorClass = "bg-sac-red-light text-sac-red";
        tooltipLabel = "Kapora bekleniyor";
      } else if (paid < total) {
        StatusIcon = Clock;
        statusColorClass = "bg-sac-yellow-light text-sac-yellow";
        tooltipLabel = "Kısmi ödeme";
      } else {
        StatusIcon = CheckCircle2;
        statusColorClass = "bg-sac-primary-lightest text-sac-primary";
        tooltipLabel = "Ödeme tamamlandı";
      }

      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " TL";

      return (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center justify-center rounded-md p-1.5", statusColorClass)}>
                  <StatusIcon className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-4 w-[260px] bg-white shadow-lg border">
                <div className="space-y-3">
                  <p className="font-semibold text-sm">{tooltipLabel}</p>
                  <div className="grid gap-1.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0 bg-sac-primary" />
                        <span className="text-muted-foreground">Ödenen</span>
                      </div>
                      <span className="font-medium tabular-nums">{formatCurrency(paid)}</span>
                    </div>
                    {paid < total && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0 bg-sac-red" />
                          <span className="text-muted-foreground">Kalan</span>
                        </div>
                        <span className="font-medium tabular-nums">{formatCurrency(remaining)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground/50" />
                        <span className="text-muted-foreground">Toplam</span>
                      </div>
                      <span className="font-medium tabular-nums">{formatCurrency(total)}</span>
                    </div>
                  </div>
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
            ? "bg-sac-primary-lightest text-sac-primary"
            : "bg-sac-red-light text-sac-red"
        )}>
          {sacrifice_consent ? "Alındı" : "Alınmadı"}
        </span>
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Notlar",
    enableSorting: false,
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string;
      return notes ? (
        <div className="max-w-[200px] truncate" title={notes}>
          {notes}
        </div>
      ) : "-";
    },
  },
  {
    accessorKey: "last_edited_time",
    header: "Son Güncelleme",
    enableSorting: true,
    sortingFn: sortingFunctions.date,
    cell: ({ row }) => formatDateMedium(row.getValue("last_edited_time")),
  },
  {
    accessorKey: "last_edited_by",
    header: "Son Güncelleyen",
    enableSorting: true,
    cell: ({ row }) => {
      const editor = row.getValue("last_edited_by") as string;
      return editor || "-";
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => <ActionCellContent row={row} />,
  },
];
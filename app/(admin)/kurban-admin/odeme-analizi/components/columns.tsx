"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, X, ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { shareholderSchema } from "@/types"
import { Progress } from "@/components/ui/progress"
import { ShareholderType } from "@/types"
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
} from "@/components/ui/alert-dialog"
import { supabase } from "@/utils/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { cn, formatCurrency } from "@/lib/utils"

const baseColumns: ColumnDef<ShareholderType>[] = [
  {
    accessorKey: "shareholder_name",
    header: "İsim Soyisim",
    cell: ({ row }: { row: Row<ShareholderType> }) => (
      <div className="flex justify-center ">
        {row.getValue("shareholder_name")}
      </div>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue(columnId) as string;
      const b = rowB.getValue(columnId) as string;
      return a.localeCompare(b, 'tr-TR');
    }
  },
  {
    accessorKey: "phone_number",
    header: "Telefon",
    cell: ({ row }: { row: Row<ShareholderType> }) => {
      const phone = row.getValue("phone_number") as string;
      return (
        <div className="flex justify-center ">
          {phone.replace("+90", "0")}
        </div>
      );
    },
  },
  {
    accessorKey: "purchase_time",
    header: "Kayıt Tarihi",
    cell: ({ row }: { row: Row<ShareholderType> }) => {
      const date = new Date(row.getValue("purchase_time"));
      return (
        <div className="flex justify-center ">
          {format(date, "dd MMMM yyyy", { locale: tr })}
        </div>
      );
    },
  },
  {
    accessorKey: "sacrifice.sacrifice_no",
    header: "Kurban No",
    cell: ({ row }: { row: Row<ShareholderType> }) => (
      <div className="flex justify-center ">
        {row.original.sacrifice?.sacrifice_no}
      </div>
    ),
  },
]

const totalAmountColumn = {
  accessorKey: "total_amount",
  header: "Toplam Tutar",
  cell: ({ row }: { row: Row<ShareholderType> }) => {
    const amount = row.getValue("total_amount") as number;
    return (
      <div className="flex justify-center ">
        {new Intl.NumberFormat('tr-TR', {
          maximumFractionDigits: 0,
        }).format(amount)} ₺
      </div>
    );
  },
}

const paidAmountColumn = {
  accessorKey: "paid_amount",
  header: "Ödenen Tutar",
  cell: ({ row }: { row: Row<ShareholderType> }) => {
    const amount = row.getValue("paid_amount") as number;
    return (
      <div className="flex justify-center ">
        {new Intl.NumberFormat('tr-TR', {
          maximumFractionDigits: 0,
        }).format(amount)} ₺
      </div>
    );
  },
}

const remainingPaymentColumn = {
  accessorKey: "remaining_payment",
  header: "Kalan Tutar",
  cell: ({ row }: { row: Row<ShareholderType> }) => {
    const amount = row.getValue("remaining_payment") as number;
    return (
      <div className="flex justify-center ">
        {new Intl.NumberFormat('tr-TR', {
          maximumFractionDigits: 0,
        }).format(amount)} ₺
      </div>
    );
  },
}

const calculateRatio = (row: any) => {
  const paidAmount = row.getValue("paid_amount") as number;
  const totalAmount = row.getValue("total_amount") as number;
  return (paidAmount / totalAmount) * 100;
};

const paymentRatioColumn = {
  accessorKey: "payment_ratio",
  header: "Ödeme Oranı",
  accessorFn: (row) => {
    const paidAmount = row.paid_amount;
    const totalAmount = row.total_amount;
    return (paidAmount / totalAmount) * 100;
  },
  cell: ({ row }: { row: Row<ShareholderType> }) => {
    const ratio = calculateRatio(row);

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
}

const statusColumn = {
  id: "status",
  header: "Durum",
  cell: ({ row }: { row: Row<ShareholderType> }) => {
    const purchaseDate = new Date(row.getValue("purchase_time"))
    const threeDaysAfterPurchase = new Date(purchaseDate.getTime() + (3 * 24 * 60 * 60 * 1000))
    const paidAmount = row.getValue("paid_amount") as number
    const remainingPayment = row.getValue("remaining_payment") as number

    if (paidAmount < 2000 && new Date() > threeDaysAfterPurchase) {
      return (
        <div className="flex justify-center ">
          <Badge variant="destructive">Kapora Gecikmiş</Badge>
        </div>
      )
    }

    if (remainingPayment > 0) {
      return (
        <div className="flex justify-center ">
          <Badge variant="secondary">Kalan Ödeme Bekleniyor</Badge>
        </div>
      )
    }

    return (
      <div className="flex justify-center ">
        <Badge variant="default">Tamamlandı</Badge>
      </div>
    )
  },
}

const actionsColumn: ColumnDef<ShareholderType> = {
  id: "actions",
  header: " ",
  enableSorting: false,
  cell: ({ row }) => {
    const router = useRouter()

    const handleDelete = async () => {
      const { error } = await supabase
        .from("shareholders")
        .delete()
        .eq("shareholder_id", row.original.shareholder_id)

      if (error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hissedar silinirken bir hata oluştu.",
        })
        return
      }

      toast({
        title: "Başarılı",
        description: "Hissedar başarıyla silindi.",
      })
      router.refresh()
    }

    return (
      <div className="flex justify-center items-center gap-2 ">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-[#E6EAF2] hover:text-[#367CFE]"
          onClick={() =>
            router.push(
              `/kurban-admin/hissedarlar/ayrintilar/${row.original.shareholder_id}`
            )
          }
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
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  },
}

export const overdueDepositsColumns: ColumnDef<ShareholderType>[] = [
  ...baseColumns,
  paidAmountColumn,
  totalAmountColumn,
  paymentRatioColumn,
  actionsColumn,
]

export const pendingPaymentsColumns: ColumnDef<ShareholderType>[] = [
  ...baseColumns,
  paidAmountColumn,
  totalAmountColumn,
  remainingPaymentColumn,
  paymentRatioColumn,
  actionsColumn,
]

export const completedPaymentsColumns: ColumnDef<ShareholderType>[] = [
  ...baseColumns,
  totalAmountColumn,
  actionsColumn,
] 
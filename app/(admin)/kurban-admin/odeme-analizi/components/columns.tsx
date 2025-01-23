"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { shareholderSchema } from "@/types"

export const columns: ColumnDef<shareholderSchema>[] = [
  {
    accessorKey: "shareholder_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          İsim
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="flex justify-center py-2">
        {row.getValue("shareholder_name")}
      </div>
    ),
  },
  {
    accessorKey: "phone_number",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Telefon
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="flex justify-center py-2">
        {row.getValue("phone_number")}
      </div>
    ),
  },
  {
    accessorKey: "purchase_time",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kayıt Tarihi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="flex justify-center py-2">
        {format(new Date(row.getValue("purchase_time")), "dd MMM yyyy", {
          locale: tr,
        })}
      </div>
    ),
  },
  {
    accessorKey: "paid_amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ödenen Tutar
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="flex justify-center py-2">
        {new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
        }).format(row.getValue("paid_amount"))}
      </div>
    ),
  },
  {
    accessorKey: "remaining_payment",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kalan Tutar
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="flex justify-center py-2">
        {new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
        }).format(row.getValue("remaining_payment"))}
      </div>
    ),
  },
  {
    id: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Durum
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const purchaseDate = new Date(row.getValue("purchase_time"))
      const threeDaysAfterPurchase = new Date(purchaseDate.getTime() + (3 * 24 * 60 * 60 * 1000))
      const paidAmount = row.getValue("paid_amount") as number
      const remainingPayment = row.getValue("remaining_payment") as number

      if (paidAmount < 2000 && new Date() > threeDaysAfterPurchase) {
        return (
          <div className="flex justify-center py-2">
            <Badge variant="destructive">Kapora Gecikmiş</Badge>
          </div>
        )
      }

      if (remainingPayment > 0) {
        return (
          <div className="flex justify-center py-2">
            <Badge variant="secondary">Kalan Ödeme Bekleniyor</Badge>
          </div>
        )
      }

      return (
        <div className="flex justify-center py-2">
          <Badge variant="default">Tamamlandı</Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const router = useRouter()
      return (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(
                `/kurban-admin/hissedarlar/ayrintilar/${row.original.shareholder_id}`
              )
            }
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
] 
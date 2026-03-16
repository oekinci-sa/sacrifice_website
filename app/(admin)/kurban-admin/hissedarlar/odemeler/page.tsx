"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { EditablePaidAmountCell } from "./components/editable-paid-amount-cell";
import { PaymentFilters } from "./components/payment-filters";
import { ShareholderSearch } from "../tum-hissedarlar/components/shareholder-search";

export default function OdemelerPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const {
    shareholders: allShareholders,
    isLoading,
    error,
    isInitialized,
    fetchShareholders,
    enableRealtime,
    realtimeEnabled,
    updateShareholder,
  } = useShareholderStore();

  useEffect(() => {
    if (!isInitialized || allShareholders.length === 0) {
      fetchShareholders();
    }
    if (!realtimeEnabled) {
      enableRealtime();
    }
  }, [isInitialized, allShareholders.length, fetchShareholders, enableRealtime, realtimeEnabled]);

  const columns: ColumnDef<shareholderSchema>[] = useMemo(
    () => [
      {
        id: "sacrifice_no",
        accessorFn: (row) => row.sacrifice?.sacrifice_no ?? 0,
        header: "Kurban No",
        cell: ({ row }) => {
          const sacrifice = row.original.sacrifice;
          const sacrificeNo = sacrifice?.sacrifice_no ?? "-";
          return <span className="font-medium">{sacrificeNo}</span>;
        },
      },
      {
        accessorKey: "shareholder_name",
        header: "Hissedar Adı",
        cell: ({ row }) => row.getValue("shareholder_name"),
      },
      {
        accessorKey: "phone_number",
        header: "Telefon",
        cell: ({ row }) =>
          formatPhoneForDisplayWithSpacing(row.original.phone_number || ""),
      },
      {
        accessorKey: "total_amount",
        header: "Toplam Tutar",
        cell: ({ row }) => {
          const val = parseFloat(row.original.total_amount.toString());
          return (
            <span className="tabular-nums">
              {new Intl.NumberFormat("tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(val)}{" "}
              TL
            </span>
          );
        },
      },
      {
        accessorKey: "paid_amount",
        header: "Ödeme Yapılan Tutar",
        cell: ({ row }) => (
          <EditablePaidAmountCell
            row={row}
            lastEditedBy={session?.user?.name ?? "Sistem"}
            onUpdate={updateShareholder}
          />
        ),
      },
      {
        accessorKey: "remaining_payment",
        header: "Ödenecek Tutar",
        cell: ({ row }) => {
          const val = parseFloat(row.original.remaining_payment.toString());
          return (
            <span className="tabular-nums">
              {new Intl.NumberFormat("tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(val)}{" "}
              TL
            </span>
          );
        },
      },
      {
        id: "payment_status",
        header: "Ödeme Durumu",
        accessorFn: (row) => {
          const paid = parseFloat(row.paid_amount.toString());
          const total = parseFloat(row.total_amount.toString());
          return total > 0 ? (paid / total) * 100 : 0;
        },
        cell: () => null,
        enableHiding: true,
      },
    ],
    [session?.user?.name, updateShareholder]
  );

  const sortedData = useMemo(() => {
    let data = allShareholders || [];
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (sh) =>
          sh.shareholder_name?.toLowerCase().includes(lower) ||
          sh.phone_number?.includes(searchTerm.replace(/\s/g, ""))
      );
    }
    return [...data].sort((a, b) => {
      const noA = a.sacrifice?.sacrifice_no ?? 0;
      const noB = b.sacrifice?.sacrifice_no ?? 0;
      return Number(noA) - Number(noB);
    });
  }, [allShareholders, searchTerm]);

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ödemeler</h1>
          <p className="text-muted-foreground mt-2">
            Hissedar ödemelerini takip edin ve güncelleyin.
          </p>
        </div>
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          Veri yüklenirken bir hata oluştu.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ödemeler</h1>
        <p className="text-muted-foreground mt-2">
          Hissedar ödemelerini takip edin. Ödeme yapılan tutar hücresine tıklayarak
          doğrudan güncelleyebilirsiniz.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <CustomDataTable
          columns={columns}
          data={sortedData}
          storageKey="odemeler"
          tableSize="medium"
          pageSizeOptions={[20, 50, 100, 200]}
          initialState={{ columnVisibility: { payment_status: false } }}
          filters={({ table }) => (
            <div className="flex flex-wrap items-center gap-3">
              <ShareholderSearch onSearch={setSearchTerm} className="w-64 sm:w-72" />
              <PaymentFilters table={table} />
            </div>
          )}
        />
      )}
    </div>
  );
}

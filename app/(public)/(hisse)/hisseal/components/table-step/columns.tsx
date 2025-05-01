"use client";

import { useActiveReservationsStore } from "@/stores/global/useActiveReservationsStore";
import { sacrificeSchema } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, Plus } from "lucide-react";
import { useEffect } from "react";

interface TableMeta {
  onSacrificeSelect: (sacrifice: sacrificeSchema) => void;
}

// Aktif rezervasyon işlemlerini takip eden client component
export const ActiveReservationsInitializer = () => {
  const { fetchActiveReservations, subscribeToRealtimeReservations, unsubscribeFromRealtimeReservations } = useActiveReservationsStore();

  // Component mount olduğunda verileri yükle ve realtime aboneliği başlat
  useEffect(() => {
    console.log("ActiveReservationsInitializer: Initializing...");
    fetchActiveReservations();
    subscribeToRealtimeReservations();

    // Cleanup on unmount
    return () => {
      unsubscribeFromRealtimeReservations();
    };
  }, [fetchActiveReservations, subscribeToRealtimeReservations, unsubscribeFromRealtimeReservations]);

  return null; // Bu component bir şey render etmez
};

// Boş hisse hücresini gösteren özel component - store'dan doğrudan veri alır
const EmptyShareCell = ({ sacrifice }: { sacrifice: sacrificeSchema }) => {
  const emptyShare = sacrifice.empty_share;
  const sacrificeId = sacrifice.sacrifice_id;
  const activeReservations = useActiveReservationsStore(state => state.reservations);
  const activeCount = activeReservations[sacrificeId] || 0;

  // Debug: sacrifice_id değerini ve aktif rezervasyon bilgisini göster
  useEffect(() => {
    if (activeCount > 0) {
      console.log(`Sacrifice ID: ${sacrificeId} has ${activeCount} active reservations`);
    }
  }, [sacrificeId, activeCount]);

  return (
    <div className="flex items-center justify-center py-0.5 md:py-1">
      {/* Boş hisse ikonu */}
      <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-md">
        {emptyShare}
      </span>

      {activeCount > 0 && (
        <>
          {/* Mobil için kısa mesaj (inline, margin-left ile) */}
          <span className="ml-1 text-xs bg-sac-primary text-white px-1.5 py-0.5 rounded font-medium md:hidden">
            {activeCount} hisse işlemde
          </span>

          {/* Desktop için uzun mesaj (inline, md:ml-1 ile) */}
          <span className="ml-1 hidden md:inline text-sm bg-sac-primary text-white px-1.5 py-0.5 rounded font-medium">
            {activeCount} hissede işlem yapılıyor
          </span>
        </>
      )}
    </div>
  );
};

// Ana columns tanımı
export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: "Kurbanlık Sırası",
    cell: ({ row }) => (
      <div className="text-center py-0.5 md:py-1">
        {row.getValue("sacrifice_no")}
      </div>
    ),
    filterFn: (row, id, value: string) => {
      const searchValue = value.toLowerCase();
      const cellValue = String(row.getValue(id)).toLowerCase();
      return cellValue.includes(searchValue);
    },
    enableSorting: true,
  },
  {
    accessorKey: "sacrifice_time",
    header: "Kesim Saati",
    cell: ({ row }) => {
      const time = row.getValue("sacrifice_time") as string;
      if (!time) return <div className="text-center py-0.5 md:py-1">-</div>;

      const [hours, minutes] = time.split(":");
      return (
        <div className="text-center py-0.5 md:py-1">
          {`${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "share_price",
    header: "Hisse Bedeli",
    cell: ({ row }) => {
      const share_price = row.getValue("share_price") as number;
      const share_weight = row.original.share_weight;

      return (
        <div className="text-center py-0.5 md:py-1">
          {share_weight} kg. -{" "}
          {new Intl.NumberFormat("tr-TR", {
            style: "decimal",
            maximumFractionDigits: 0,
          }).format(share_price)}{" "}
          TL
        </div>
      );
    },
    filterFn: (row, id, filterValues: (string | number)[]) => {
      if (!filterValues || filterValues.length === 0) return true;

      const rowValue = row.getValue(id) as number;

      return filterValues.some((filterValue: string | number) => {
        const numericFilterValue =
          typeof filterValue === "string"
            ? parseFloat(filterValue)
            : filterValue;
        return rowValue === numericFilterValue;
      });
    },
    enableSorting: true,
  },
  {
    accessorKey: "empty_share",
    header: "Boş Hisse",
    cell: ({ row }) => <EmptyShareCell sacrifice={row.original} />,
    filterFn: (row, id, value: (string | number)[]) => {
      if (!value || value.length === 0) return true;

      const rowValue = row.getValue(id) as number;

      // Check if rowValue is greater than or equal to ANY of the selected filter values
      return value.some(filterValue => {
        const numericFilterValue = typeof filterValue === 'string'
          ? parseInt(filterValue)
          : filterValue;
        return rowValue >= numericFilterValue;
      });
    },
    enableSorting: true,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const sacrifice = row.original;
      const emptyShare = sacrifice.empty_share;
      const meta = table.options.meta as TableMeta;

      if (emptyShare === 0) {
        return (
          <div className="flex justify-center py-0.5 md:py-1">
            <span className="inline-flex items-center justify-center min-w-[80px] md:min-w-[100px] bg-[#FCEFEF] text-[#D22D2D] px-2 md:px-4 py-1 md:py-1.5 rounded">
              <Ban className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5" />
              Tükendi
            </span>
          </div>
        );
      }

      return (
        <div className="flex justify-center py-0.5 md:py-1">
          <button
            onClick={() => meta?.onSacrificeSelect(sacrifice)}
            className="inline-flex items-center justify-center min-w-[80px] md:min-w-[100px] bg-[#F0FBF1] hover:bg-[#22C55E] text-sac-primary font-medium hover:text-white px-2 md:px-4 py-1 md:py-1.5 rounded transition-colors duration-200"
          >
            <Plus className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5" />
            Hisse Al
          </button>
        </div>
      );
    },
  },
];

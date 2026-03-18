"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Table as TableInstance,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { useSession } from "next-auth/react"
import * as React from "react"

import { Table } from "@/components/ui/table"
import { supabase } from "@/utils/supabaseClient"
import { CustomDataTableFooter } from "./custom-data-table-footer"
import { CustomTableBody } from "./custom-table-body"
import { CustomTableHeader } from "./custom-table-header"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: Record<string, unknown>
  pageSizeOptions?: number[]
  initialState?: {
    columnVisibility?: VisibilityState
  }
  /** localStorage key for persisting column visibility (e.g. "hissedarlar", "kurbanliklar") */
  storageKey?: string
  filters?: (props: {
    table: TableInstance<TData>;
    columnFilters: ColumnFiltersState;
    onColumnFiltersChange: (filters: ColumnFiltersState) => void;
    columnOrder: string[];
    onColumnOrderChange?: (order: string[]) => void;
  }) => React.ReactNode | null
  tableSize?: "small" | "medium" | "large"
}

const STORAGE_PREFIX = "table-column-visibility-";
const ORDER_SUFFIX = "-order";

/** Tablo + kullanıcı bazlı localStorage key (her kullanıcı kendi sütun tercihlerini görür) */
function getStorageKey(storageKey: string, userId: string | undefined): string {
  const userSuffix = userId ? `-${userId}` : "-anon";
  return STORAGE_PREFIX + storageKey + userSuffix;
}

function getStoredVisibility(fullKey: string): VisibilityState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(fullKey);
    if (stored) return JSON.parse(stored) as VisibilityState;
  } catch {}
  return null;
}

function getStoredColumnOrder(fullKey: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(fullKey + ORDER_SUFFIX);
    if (stored) return JSON.parse(stored) as string[];
  } catch {}
  return null;
}

function setStoredVisibility(fullKey: string, visibility: VisibilityState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(fullKey, JSON.stringify(visibility));
  } catch {}
}

function setStoredColumnOrder(fullKey: string, order: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(fullKey + ORDER_SUFFIX, JSON.stringify(order));
  } catch {}
}

export function CustomDataTable<TData, TValue>({
  columns,
  data,
  meta,
  pageSizeOptions = [20, 50, 100, 200, 500, 1000],
  initialState,
  storageKey,
  filters,
  tableSize = "medium",
}: DataTableProps<TData, TValue>) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;
  const fullStorageKey = storageKey ? getStorageKey(storageKey, userId) : null;

  const tableColumns = React.useMemo(() => columns, [columns])

  // Force re-render when data changes
  const dataRef = React.useRef<TData[]>([]);
  const [dataVersion, setDataVersion] = React.useState(0);

  // Check if data has changed
  React.useEffect(() => {
    if (Array.isArray(data) && JSON.stringify(dataRef.current) !== JSON.stringify(data)) {
      dataRef.current = [...data];
      setDataVersion(prev => prev + 1);
    }
  }, [data]);

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    const stored = fullStorageKey ? getStoredVisibility(fullStorageKey) : null;
    if (stored) return stored;
    return initialState?.columnVisibility || { notes: false };
  })

  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => {
    return (fullStorageKey && getStoredColumnOrder(fullStorageKey)) || [];
  });

  // Re-read from localStorage when userId becomes available (session load)
  React.useEffect(() => {
    if (!fullStorageKey) return;
    const storedVis = getStoredVisibility(fullStorageKey);
    const storedOrder = getStoredColumnOrder(fullStorageKey);
    if (storedVis) setColumnVisibility(storedVis);
    if (storedOrder && storedOrder.length > 0) setColumnOrder(storedOrder);
  }, [fullStorageKey]);

  const handleColumnVisibilityChange = React.useCallback(
    (updaterOrValue: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
      setColumnVisibility((prev) => {
        const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
        if (fullStorageKey) {
          setStoredVisibility(fullStorageKey, next);
          setColumnOrder((order) => {
            const newOrder: string[] = [];
            for (const colId of order) {
              if (next[colId] !== false) newOrder.push(colId);
            }
            for (const colId of Object.keys(next)) {
              const becameVisible = next[colId] !== false && prev[colId] === false;
              if (becameVisible && !newOrder.includes(colId)) newOrder.push(colId);
            }
            setStoredColumnOrder(fullStorageKey, newOrder);
            return newOrder;
          });
        }
        return next;
      });
    },
    [fullStorageKey]
  )

  const [{ pageIndex, pageSize }, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[0],
  })

  // Reset page index when page size changes
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }, [pageSize])

  // Reset to first page when data changes
  React.useEffect(() => {
    if (dataVersion > 0) {
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }
  }, [dataVersion]);

  // Effective column order: default order + stored order (last-opened columns at end)
  const defaultColumnIds = React.useMemo(
    () =>
      (tableColumns as { id?: string; accessorKey?: string }[])
        .map((c) => c.id ?? (typeof c.accessorKey === "string" ? c.accessorKey : null))
        .filter(Boolean) as string[],
    [tableColumns]
  );
  const effectiveColumnOrder = React.useMemo(() => {
    if (!fullStorageKey || columnOrder.length === 0) return undefined;
    const notInStored = defaultColumnIds.filter((id) => !columnOrder.includes(id) && id !== "actions");
    const inStored = columnOrder.filter((id) => defaultColumnIds.includes(id));
    const actions = defaultColumnIds.includes("actions") ? ["actions"] : [];
    return [...notInStored, ...inStored, ...actions];
  }, [fullStorageKey, columnOrder, defaultColumnIds]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: handleColumnVisibilityChange,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      ...(effectiveColumnOrder ? { columnOrder: effectiveColumnOrder } : {}),
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  })

  React.useEffect(() => {
    const fetchSharePrices = async () => {
      const { data: prices } = await supabase
        .from("sacrifice_animals")
        .select("share_price")
        .order("share_price", { ascending: true });

      if (prices) {
        const uniquePrices = Array.from(new Set(prices.map((p) => p.share_price)));
        // Store prices in state if needed for future use
        uniquePrices.map((price) => ({
          label: `${new Intl.NumberFormat('tr-TR', {
            style: 'decimal',
            maximumFractionDigits: 0
          }).format(price)}  TL`,
          value: price.toString(),
        }));
      }
    };

    fetchSharePrices();
  }, []);

  return (
    <div className="min-w-0 w-full">
      <div className="space-y-4 min-w-0">
        {typeof filters === 'function' ? filters({
          table,
          columnFilters,
          onColumnFiltersChange: setColumnFilters,
          columnOrder,
          onColumnOrderChange: fullStorageKey ? (order) => {
            setColumnOrder(order);
            setStoredColumnOrder(fullStorageKey, order);
          } : undefined,
        }) : null}

        <div className="rounded-md min-w-0">
          <Table>
            <CustomTableHeader table={table} tableSize={tableSize} />
            <CustomTableBody table={table} columns={tableColumns} tableSize={tableSize} />
          </Table>
        </div>

        {/* Table Footer */}
        <CustomDataTableFooter
          table={table}
          pageSizeOptions={pageSizeOptions}
        />
      </div>
    </div>
  )
}
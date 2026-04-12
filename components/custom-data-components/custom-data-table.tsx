"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
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
import { CustomDataTableFooter } from "./custom-data-table-footer"
import { CustomTableBody } from "./custom-table-body"
import { CustomTableHeader } from "./custom-table-header"
import { StickyHorizontalScrollbar } from "./sticky-horizontal-scrollbar"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: Record<string, unknown>
  pageSizeOptions?: number[]
  /** Varsayılan sayfa boyutu (ör. 200). `pageSizeOptions` içinde yoksa en yakın / ilk seçenek kullanılır. */
  defaultPageSize?: number
  initialState?: {
    columnVisibility?: VisibilityState
  }
  /** Sütun id → görünen başlık (özelleştirilmiş header bileşenlerinde sürükleme önizlemesi için) */
  columnHeaderLabels?: Record<string, string>
  /** localStorage key for persisting column visibility (e.g. "hissedarlar", "kurbanliklar") */
  storageKey?: string
  /** TanStack satır kimliği (örn. `shareholder_id`); güncelleme sonrası doğru satırın yenilenmesi için önerilir */
  getRowId?: (row: TData) => string
  filters?: (props: {
    table: TableInstance<TData>;
    columnFilters: ColumnFiltersState;
    onColumnFiltersChange: (filters: ColumnFiltersState) => void;
    columnOrder: string[];
    onColumnOrderChange?: (order: string[]) => void;
    /** Sütun görünürlüğü + sıra: sayfa initialState + localStorage sıfırlanır */
    resetColumnLayout?: () => void;
  }) => React.ReactNode | null
  tableSize?: "small" | "medium" | "large"
  /** Satır genişletme: satır için detay paneli render fonksiyonu */
  renderExpandedRow?: (row: { original: TData }) => React.ReactNode | null
  /** Pagination yerine infinite scroll (filtre/sort yine tüm veri üzerinde çalışır) */
  infiniteScroll?: {
    initialCount?: number
    step?: number
  }
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
  } catch { }
  return null;
}

function getStoredColumnOrder(fullKey: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(fullKey + ORDER_SUFFIX);
    if (stored) return JSON.parse(stored) as string[];
  } catch { }
  return null;
}

function setStoredVisibility(fullKey: string, visibility: VisibilityState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(fullKey, JSON.stringify(visibility));
  } catch { }
}

function setStoredColumnOrder(fullKey: string, order: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(fullKey + ORDER_SUFFIX, JSON.stringify(order));
  } catch { }
}

export function CustomDataTable<TData, TValue>({
  columns,
  data,
  meta,
  pageSizeOptions = [20, 50, 100, 200, 500, 1000],
  defaultPageSize,
  initialState,
  columnHeaderLabels,
  storageKey,
  getRowId,
  filters,
  tableSize = "medium",
  renderExpandedRow,
  infiniteScroll,
}: DataTableProps<TData, TValue>) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;
  const fullStorageKey = storageKey ? getStorageKey(storageKey, userId) : null;

  /** Sayfa ilk render’daki varsayılan görünürlük (inline initialState her render yeni nesne olsa bile tek snapshot) */
  const defaultColumnVisibilityRef = React.useRef<VisibilityState | undefined>(undefined);
  if (defaultColumnVisibilityRef.current === undefined) {
    defaultColumnVisibilityRef.current = initialState?.columnVisibility
      ? { ...initialState.columnVisibility }
      : {};
  }

  const tableColumns = React.useMemo(() => columns, [columns])

  // Force re-render when data reference changes
  const [dataVersion, setDataVersion] = React.useState(0);
  const prevDataRef = React.useRef<TData[]>(data);
  if (prevDataRef.current !== data) {
    prevDataRef.current = data;
  }

  React.useEffect(() => {
    setDataVersion(prev => prev + 1);
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

  const handleColumnOrderChangePersisted = React.useCallback(
    (order: string[]) => {
      setColumnOrder(order);
      if (fullStorageKey) {
        setStoredColumnOrder(fullStorageKey, order);
      }
    },
    [fullStorageKey]
  );

  const resetColumnLayout = React.useCallback(() => {
    const defaultVis = { ...(defaultColumnVisibilityRef.current ?? {}) };
    setColumnVisibility(defaultVis);
    setColumnOrder([]);
    if (fullStorageKey) {
      setStoredVisibility(fullStorageKey, defaultVis);
      setStoredColumnOrder(fullStorageKey, []);
    }
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

  const infiniteEnabled = !!infiniteScroll
  const infiniteInitial = infiniteScroll?.initialCount ?? 50
  const infiniteStep = infiniteScroll?.step ?? 50

  const [{ pageIndex, pageSize }, setPagination] = React.useState(() => {
    const fallback = pageSizeOptions[0] ?? 20;
    if (defaultPageSize != null && pageSizeOptions.includes(defaultPageSize)) {
      return { pageIndex: 0, pageSize: defaultPageSize };
    }
    if (defaultPageSize != null) {
      const nearest = pageSizeOptions.reduce((best, n) =>
        Math.abs(n - defaultPageSize) < Math.abs(best - defaultPageSize) ? n : best
      );
      return { pageIndex: 0, pageSize: nearest };
    }
    return { pageIndex: 0, pageSize: fallback };
  })

  // Reset page index when page size changes
  React.useEffect(() => {
    if (!infiniteEnabled) {
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }
  }, [pageSize, infiniteEnabled])

  // Reset to first page when data changes
  React.useEffect(() => {
    if (!infiniteEnabled && dataVersion > 0) {
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }
  }, [dataVersion, infiniteEnabled]);

  // Effective column order: default order + stored order (last-opened columns at end)
  const defaultColumnIds = React.useMemo(
    () =>
      (tableColumns as { id?: string; accessorKey?: string }[])
        .map((c) => c.id ?? (typeof c.accessorKey === "string" ? c.accessorKey : null))
        .filter(Boolean) as string[],
    [tableColumns]
  );
  /** TanStack’e her zaman açık sıra verilir; böylece ekran + Excel aynı columnOrder ile uyumlu kalır. */
  const effectiveColumnOrder = React.useMemo(() => {
    const actions = defaultColumnIds.includes("actions") ? ["actions"] : [];
    const rest = defaultColumnIds.filter((id) => id !== "actions");
    const defaultOrder = [...rest, ...actions];

    if (columnOrder.length === 0) {
      return defaultOrder;
    }
    const notInStored = defaultColumnIds.filter(
      (id) => !columnOrder.includes(id) && id !== "actions"
    );
    const inStored = columnOrder.filter((id) => defaultColumnIds.includes(id));
    return [...notInStored, ...inStored, ...actions];
  }, [columnOrder, defaultColumnIds]);

  const tableScrollRef = React.useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns: tableColumns,
    meta,
    ...(getRowId ? { getRowId } : {}),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    onColumnVisibilityChange: handleColumnVisibilityChange,
    ...(!infiniteEnabled ? {
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange: setPagination,
    } : {}),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder: effectiveColumnOrder,
      ...(!infiniteEnabled ? {
        pagination: {
          pageIndex,
          pageSize,
        },
      } : {}),
    },
  })

  const totalRows = table.getRowModel().rows.length
  const [infiniteCount, setInfiniteCount] = React.useState(infiniteInitial)
  const loadMoreRef = React.useRef<HTMLDivElement>(null)
  /** Kullanıcının bu oturumda kaydırmayla en fazla kaç satıra kadar yüklediği (filtre/sort sonrası geri yükleme için) */
  const maxLoadedSessionRef = React.useRef(infiniteInitial)
  const prevColumnFiltersRef = React.useRef<ColumnFiltersState>(columnFilters)
  const staggerGenRef = React.useRef(0)

  const bumpMaxLoaded = React.useCallback((value: number) => {
    maxLoadedSessionRef.current = Math.max(maxLoadedSessionRef.current, value)
  }, [])

  /** Yeni veri (yıl vb.): hafızayı sıfırla */
  React.useEffect(() => {
    if (!infiniteEnabled) return
    maxLoadedSessionRef.current = infiniteInitial
    setInfiniteCount(infiniteInitial)
  }, [infiniteEnabled, infiniteInitial, dataVersion])

  /** Filtre daralınca: sadece üst sınıra sıkıştır (not aramasında her tuşta sıfırlama yok) */
  React.useEffect(() => {
    if (!infiniteEnabled) return
    setInfiniteCount((c) => Math.min(c, totalRows))
  }, [infiniteEnabled, totalRows])

  /** Sıralama değişince: önce ilk batch, sonra önceki yükleme derinliğine kadar kademeli (`totalRows` deps’te yok — filtre daralmasında tetiklenmesin) */
  React.useEffect(() => {
    if (!infiniteEnabled) return
    const rows = table.getRowModel().rows.length
    const target = Math.min(maxLoadedSessionRef.current, rows)
    staggerGenRef.current += 1
    const gen = staggerGenRef.current
    setInfiniteCount(infiniteInitial)
    if (target <= infiniteInitial) return

    let current = infiniteInitial
    const stepOnce = () => {
      if (gen !== staggerGenRef.current) return
      current = Math.min(current + infiniteStep, target)
      setInfiniteCount(current)
      bumpMaxLoaded(current)
      if (current < target) {
        requestAnimationFrame(() => {
          setTimeout(stepOnce, 0)
        })
      }
    }
    requestAnimationFrame(() => {
      setTimeout(stepOnce, 0)
    })
  }, [infiniteEnabled, infiniteInitial, infiniteStep, sorting, bumpMaxLoaded, table])

  /** Tüm filtreler temizlenince: önce ilk batch, sonra önceki yükleme derinliğine kadar kademeli */
  React.useEffect(() => {
    if (!infiniteEnabled) return
    const prev = prevColumnFiltersRef.current
    prevColumnFiltersRef.current = columnFilters
    if (prev.length === 0 || columnFilters.length > 0) return

    const target = Math.min(maxLoadedSessionRef.current, totalRows)
    staggerGenRef.current += 1
    const gen = staggerGenRef.current
    setInfiniteCount(infiniteInitial)
    if (target <= infiniteInitial) return

    let current = infiniteInitial
    const stepOnce = () => {
      if (gen !== staggerGenRef.current) return
      current = Math.min(current + infiniteStep, target)
      setInfiniteCount(current)
      bumpMaxLoaded(current)
      if (current < target) {
        requestAnimationFrame(() => {
          setTimeout(stepOnce, 0)
        })
      }
    }
    requestAnimationFrame(() => {
      setTimeout(stepOnce, 0)
    })
  }, [infiniteEnabled, infiniteInitial, infiniteStep, columnFilters, totalRows, bumpMaxLoaded])

  React.useEffect(() => {
    if (!infiniteEnabled) return
    const target = loadMoreRef.current
    if (!target) return
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        setInfiniteCount((prev) => {
          const next = Math.min(prev + infiniteStep, totalRows)
          maxLoadedSessionRef.current = Math.max(maxLoadedSessionRef.current, next)
          return next
        })
      },
      { root: null, rootMargin: "300px 0px", threshold: 0 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [infiniteEnabled, infiniteStep, totalRows])

  const hasMoreRows = infiniteEnabled && infiniteCount < totalRows

  return (
    <div className="min-w-0 w-full">
      <div className="space-y-4 min-w-0">
        {typeof filters === 'function' ? filters({
          table,
          columnFilters,
          onColumnFiltersChange: setColumnFilters,
          columnOrder: effectiveColumnOrder,
          onColumnOrderChange: fullStorageKey ? handleColumnOrderChangePersisted : undefined,
          resetColumnLayout: fullStorageKey ? resetColumnLayout : undefined,
        }) : null}

        <div className="rounded-md min-w-0 w-full max-w-full">
          <Table wrapperRef={tableScrollRef}>
            <CustomTableHeader
              table={table}
              tableSize={tableSize}
              columnHeaderLabels={columnHeaderLabels}
              onColumnOrderChange={fullStorageKey ? handleColumnOrderChangePersisted : undefined}
            />
            <CustomTableBody
              table={table}
              columns={tableColumns}
              tableSize={tableSize}
              renderExpandedRow={renderExpandedRow}
              maxRowsToRender={infiniteEnabled ? infiniteCount : undefined}
            />
          </Table>
        </div>
        {hasMoreRows ? (
          <div ref={loadMoreRef} className="flex items-center justify-center py-2 text-xs text-muted-foreground">
            Daha fazla kayıt yükleniyor...
          </div>
        ) : null}
        <StickyHorizontalScrollbar scrollRef={tableScrollRef} />

        {!infiniteEnabled ? (
          <CustomDataTableFooter
            table={table}
            pageSizeOptions={pageSizeOptions}
          />
        ) : null}
      </div>
    </div>
  )
}
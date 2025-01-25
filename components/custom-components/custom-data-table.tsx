"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  VisibilityState,
  SortingState,
  Column,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Pencil } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter"
import { supabase } from "@/utils/supabaseClient"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
  }[];
  facets?: Map<any, number>;
}

export function CustomDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [{ pageIndex, pageSize }, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sharePrices, setSharePrices] = React.useState<{ label: string; value: string }[]>([])

  const emptyShares = React.useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      label: i.toString(),
      value: i.toString()
    }))
  , []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    globalFilterFn: (row, columnId, filterValue) => {
      const columnIds = ["sacrifice_no", "notes"];
      return columnIds.some((id) => {
        const value = row.getValue(id);
        return value !== undefined
          ? String(value)
              .toLowerCase()
              .includes(String(filterValue).toLowerCase())
          : false;
      });
    },
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  })

  const sharePriceFacets = table.getColumn("share_price")?.getFacetedUniqueValues();
  const emptyShareFacets = table.getColumn("empty_share")?.getFacetedUniqueValues();

  React.useEffect(() => {
    const fetchSharePrices = async () => {
      const { data: prices } = await supabase
        .from("sacrifice_animals")
        .select("share_price")
        .order("share_price", { ascending: true });

      if (prices) {
        const uniquePrices = Array.from(new Set(prices.map((p) => p.share_price)));
        const options = uniquePrices.map((price) => ({
          label: price.toString(),
          value: price.toString(),
        }));
        setSharePrices(options);
      }
    };

    fetchSharePrices();
  }, []);

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="Ara..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center ml-auto space-x-2">
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => setColumnFilters([])}
              className="h-8 px-2 lg:px-3"
            >
              Sıfırla
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
          {table.getColumn("share_price") && (
            <DataTableFacetedFilter
              column={table.getColumn("share_price")}
              title="Hisse Bedeli"
              options={sharePrices}
            />
          )}
          {table.getColumn("empty_share") && (
            <DataTableFacetedFilter
              column={table.getColumn("empty_share")}
              title="Boş Hisse"
              options={emptyShares}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto h-8 px-2 text-sm">
                Sütunlar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  let headerText = "";
                  if (column.id === "actions") {
                    headerText = "Eylemler";
                  } else if (typeof column.columnDef.header === "string") {
                    headerText = column.columnDef.header;
                  } else if (typeof column.columnDef.header === "function") {
                    const context = column.getContext();
                    const rendered = column.columnDef.header(context);
                    if (rendered && typeof rendered === "object" && "props" in rendered) {
                      headerText = rendered.props.children[0];
                    }
                  }

                  if (!headerText && column.id !== "actions") {
                    switch (column.id) {
                      case "sacrifice_no":
                        headerText = "Kurban No";
                        break;
                      case "sacrifice_time":
                        headerText = "Kesim Saati";
                        break;
                      case "share_price":
                        headerText = "Hisse Bedeli";
                        break;
                      case "empty_share":
                        headerText = "Boş Hisse";
                        break;
                      case "notes":
                        headerText = "Notlar";
                        break;
                      default:
                        headerText = column.id;
                    }
                  }

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {headerText}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  table.getAllColumns().forEach((column) => {
                    if (column.getCanHide()) {
                      column.toggleVisibility(true)
                    }
                  })
                }}
              >
                Hepsini Göster
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="h-12 text-center w-[200px]"
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          className="h-8 px-2 flex items-center gap-2 hover:bg-muted"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {typeof header.column.columnDef.header === "string" ? (
                            <div className="flex items-center gap-2">
                              <span>{header.column.columnDef.header}</span>
                              {header.column.getCanSort() && (
                                header.column.getIsSorted() === "asc" ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ArrowDown className="h-4 w-4" />
                                ) : (
                                  <ArrowUpDown className="h-4 w-4" />
                                )
                              )}
                            </div>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}
                        </Button>
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center h-10 align-middle">
                      {cell.column.id === "actions" ? (
                        <div className="flex justify-center items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-[#E6EAF2] hover:text-[#367CFE]"
                            onClick={() => {
                              const router = useRouter();
                              const record = row.original as any;
                              router.push(
                                `/kurban-admin/hissedarlar/ayrintilar/${record.shareholder_id}`
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
                                    const record = row.original as any;
                                    const { error } = await supabase
                                      .from("shareholders")
                                      .delete()
                                      .eq("shareholder_id", record.shareholder_id);

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
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Sayfa başına satır</p>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPagination(prev => ({ ...prev, pageSize: Number(value) }))
            }}
          >
            <SelectTrigger className="h-8 w-[70px] bg-muted border-0">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 text-center text-sm text-muted-foreground">
          Toplam {table.getFilteredRowModel().rows.length} adet sonuç bulundu.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Sayfa {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"  
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
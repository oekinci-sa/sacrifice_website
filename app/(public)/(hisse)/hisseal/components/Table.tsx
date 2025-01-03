"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Supabase
import Link from "next/link";
import { useState } from "react";
import { fetchTableData } from "@/helpers/supabase";
// const supabaseUrl = "https://xgrtwbvudkzvgavqskdt.supabase.co"; // Supabase URL'inizi buraya koyun
// const supabaseKey =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncnR3YnZ1ZGt6dmdhdnFza2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNDY2MzcsImV4cCI6MjA1MDYyMjYzN30.rDTI_p4UStwOQZSnWqTbAGqCDTpqmDIMdbqFEL3GuOM"; // Public anon anahtarınızı buraya koyun
// const supabase = createClient(supabaseUrl, supabaseKey);


export type Sacrifice = {
  sacrifice_no: number;
  sacrifice_time: number;
  share_holder_1: string;
  share_holder_2: string;
  share_holder_3: string;
  share_holder_4: string;
  share_holder_5: string;
  share_holder_6: string;
  share_holder_7: string;
  share_price: number;
  empty_share: number;
};

export const columns: ColumnDef<Sacrifice>[] = [
  // sacrifice_no
  {
    accessorKey: "sacrifice_no",
    header: () => <p className="text-center">Kesim Sırası</p>,
    cell: ( {row} ) => (
      <div className="lowercase text-center">
        {row.getValue("sacrifice_no")}
      </div>
    ),
  },

  // sacrifice_time
  {
    accessorKey: "sacrifice_time",
    header: () => <p className="text-center">Kesim Saati</p>,
    cell: ( {row} ) => (
      <div className="lowercase text-center">
        {row.getValue("sacrifice_time")}
      </div>
    ),
  },

  // share_price
  {
    accessorKey: "share_price",
    header: ({ column }) => {
      return (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kesim Fiyatı
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ( {row} ) => (
      <div className="text-center">{row.getValue("share_price")}</div>
    ),
  },

  // empty_share
  {
    accessorKey: "empty_share",
    header: ({ column }) => {
      return (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kesim Fiyatı
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ( {row} ) => (
      <div className="text-center">{row.getValue("empty_share")}</div>
    ),
  },

  // Action
  {
    id: "actions",
    enableHiding: false,
    cell: ( {row} ) => {
      const sacrificeInfo = row.original;

      return (
        <div className="container mx-auto">
          <div className="flex justify-center">
            <Link href={`/kurban-admin/details/${sacrificeInfo.sacrifice_no}`}>
              <Button>Hisse Al</Button>
            </Link>
          </div>
        </div>
      );
    },
  },
];

export default function DemoTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [data, setData] = useState<Sacrifice[]>([]);

  // const router = useRouter();

  // const handleDetailsClick = (sacrifice_no) => {
  //   router.push(`/details/${sacrifice_no}`);
  // };

  React.useEffect(() => {
    const fetchData = async () => {
        // Verileri çek ve real-time aboneliği başlat
        const { data: initialData, subscription } = await fetchTableData(
          "sacrifice_animals",
          (payload: { eventType: string; new: Sacrifice; old: Sacrifice }) => {
            console.log("Realtime data:", payload);

            // Gelen real-time olay türüne göre state'i güncelle
            if (payload.eventType === "INSERT") {
              setData((prevData) => [...prevData, payload.new]);
            } else if (payload.eventType === "UPDATE") {
              setData((prevData) =>
                prevData.map((item) =>
                  item.sacrifice_no === payload.new.sacrifice_no ? payload.new : item
                )
              );
            } else if (payload.eventType === "DELETE") {
              setData((prevData) =>
                prevData.filter((item) => item.sacrifice_no !== payload.old.sacrifice_no)
              );
            }
          }
        );

        // İlk çekilen veriyi state'e ekle
        setData(initialData);

        // Cleanup: Aboneliği kaldır
        return () => {
          subscription.unsubscribe();
        };

    };
    fetchData();
  }, []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      {/* Search Bar and  */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtreleme"
          value={
            (table.getColumn("sacrifice_no")?.getFilterValue() as number) ?? ""
          }
          onChange={(event) =>
            table.getColumn("sacrifice_no")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          {/* Table Header */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          {/* Table Content */}
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination and row selection*/}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useSacrifices } from "@/hooks/useSacrifices";
import { cn } from "@/lib/utils";
import { sacrificeSchema, shareholderSchema } from "@/types";
import { supabase } from "@/utils/supabaseClient";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Create a separate component for the cell content
const ActionCellContent = ({ row }: { row: Row<sacrificeSchema> }) => {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  const { refetch } = useSacrifices();
  const sacrificeId = row.original.sacrifice_id;
  const [shareholders, setShareholders] = useState<shareholderSchema[]>([]);

  useEffect(() => {
    const fetchShareholderDetails = async () => {
      const { data: shareholders } = await supabase
        .from("shareholders")
        .select("*")
        .eq("sacrifice_id", sacrificeId);

      if (shareholders) {
        setShareholders(shareholders);
      }
    };

    if (isDialogOpen) {
      fetchShareholderDetails();
    }
  }, [sacrificeId, isDialogOpen]);

  const handleDelete = async () => {
    try {
      // Önce bağlı hissedarları kontrol et
      const { data: shareholders } = await supabase
        .from("shareholders")
        .select("shareholder_id")
        .eq("sacrifice_id", sacrificeId);

      // Kurbanlık ve ilişkili hissedarları silme işlemi
      if (shareholders && shareholders.length > 0) {
        // Önce hissedarları sil
        const { error: shareholderError } = await supabase
          .from("shareholders")
          .delete()
          .eq("sacrifice_id", sacrificeId);

        if (shareholderError) throw shareholderError;
      }

      // Şimdi kurbanlığı sil
      const { error } = await supabase
        .from("sacrifice_animals")
        .delete()
        .eq("sacrifice_id", sacrificeId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Kurbanlık ve ilişkili hissedarlar başarıyla silindi!",
        variant: "default"
      });
      setIsDeleteConfirmOpen(false);
      refetch(); // Tabloyu yenile
    } catch (error) {
      console.error("Kurbanlık silme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Kurbanlık silinirken bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-[#E8F7EF] hover:text-[#09B850]"
          onClick={() => setIsDialogOpen(true)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-[#E6EAF2] hover:text-[#367CFE]"
          onClick={() => {
            router.push(`/kurban-admin/kurbanliklar/ayrintilar/${sacrificeId}`);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-[#FCEFEF] hover:text-[#D22D2D]"
          onClick={() => setIsDeleteConfirmOpen(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-12 w-[550px] max-w-[90vw]">
          <DialogHeader className="text-center space-y-4">
            <DialogTitle className="text-2xl text-center font-semibold">Hissedar Bilgileri</DialogTitle>
            <DialogDescription className="text-md text-center font-medium">
              Hissedarlar için daha fazla bilgi için
              <br />
              <Link
                href="/kurban-admin/hissedarlar/tum-hissedarlar"
                className="font-semibold hover:text-[#09B850] transition-all duration-300"
              >
                Tüm Hissedarlar
              </Link>{" "}
              sayfasını ziyaret ediniz.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className={`${shareholders.length <= 3 ? 'h-auto' : 'max-h-[60vh]'} pr-4`}>
            <div className="space-y-4 mt-8">
              {shareholders.map((shareholder, index) => (
                <div key={index}>
                  <div
                    onClick={() => router.push(`/kurban-admin/hissedarlar/ayrintilar/${shareholder.shareholder_id}`)}
                    className="transition-all duration-200 hover:bg-gray-50 rounded-lg p-4 cursor-pointer"
                  >
                    <div className="grid grid-cols-[auto_1fr_1fr] gap-6 items-center">
                      <div className="flex items-center justify-center bg-[#E8F7EF] rounded-full p-2 w-12 h-12">
                        <i className="bi bi-person-circle text-[#09B850] text-2xl"></i>
                      </div>

                      {/* Left */}
                      <div className="space-y-1">
                        <div className="text-black font-bold">{shareholder.shareholder_name}</div>
                        <div className="text-[#698c78] text-sm">
                          {shareholder.phone_number.replace("+90", "0")}
                        </div>
                      </div>

                      {/* Right */}
                      <div className="space-y-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={Math.floor((shareholder.paid_amount / shareholder.total_amount) * 100)}
                                  className="flex-1"
                                  style={{
                                    ["--progress-background" as string]: (shareholder.remaining_payment > 0)
                                      ? shareholder.paid_amount < 5000
                                        ? "rgb(220 38 38 / 0.2)"
                                        : "rgb(202 138 4 / 0.2)"
                                      : "rgb(22 163 74 / 0.2)",
                                    ["--progress-foreground" as string]: (shareholder.remaining_payment > 0)
                                      ? shareholder.paid_amount < 5000
                                        ? "rgb(220 38 38)"
                                        : "rgb(202 138 4)"
                                      : "rgb(22 163 74)",
                                  } as React.CSSProperties}
                                />
                                <span className={cn(
                                  "text-sm tabular-nums",
                                  shareholder.paid_amount < 5000 ? "text-red-600" : "text-green-600"
                                )}>
                                  %{Math.floor((shareholder.paid_amount / shareholder.total_amount) * 100).toString().padStart(3)}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="p-4 w-[280px] bg-white">
                              <div className="space-y-2">
                                {shareholder.remaining_payment <= 0 ? (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-[#1DC355]" />
                                      <span className="text-sm text-muted-foreground">Ödeme Tamamlandı:</span>
                                    </div>
                                    <span className="text-sm font-medium">
                                      {new Intl.NumberFormat('tr-TR', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                      }).format(shareholder.paid_amount) + ' TL'}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#1DC355]" />
                                        <span className="text-sm text-muted-foreground">Ödenen Tutar:</span>
                                      </div>
                                      <span className="text-sm font-medium">
                                        {new Intl.NumberFormat('tr-TR', {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0
                                        }).format(shareholder.paid_amount) + ' TL'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#D22D2D]" />
                                        <span className="text-sm text-muted-foreground">Kalan Tutar:</span>
                                      </div>
                                      <span className="text-sm font-medium text-[#000000]">
                                        {new Intl.NumberFormat('tr-TR', {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0
                                        }).format(shareholder.remaining_payment) + ' TL'}
                                      </span>
                                    </div>
                                    <Separator className="my-2 bg-gray-200" />
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#6B7280]" />
                                        <span className="text-sm text-muted-foreground">Toplam Tutar:</span>
                                      </div>
                                      <span className="text-sm font-medium text-[#000000]">
                                        {new Intl.NumberFormat('tr-TR', {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0
                                        }).format(shareholder.total_amount) + ' TL'}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="text-[#698c78] text-sm text-right">
                          {shareholder.delivery_location}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < shareholders.length - 1 && (
                    <div className="my-4 border-t border-dashed border-[#698c78] opacity-50" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kurbanlığı Sil</DialogTitle>
            <DialogDescription className="pt-2 text-red-500 font-medium">
              Dikkat: Bu kurbanlık silinirse, bu kurbanlığı alan hissedarların kayıtları da silinecektir.
            </DialogDescription>
            <DialogDescription className="pt-2">
              Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Evet, Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: ({ column }) => {
      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="px-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Kurban No
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-1 h-4 w-4" />
            )}
          </Button>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("sacrifice_no")}
      </div>
    ),
    enableSorting: true,
    filterFn: (row, id, value: string | number) => {
      const rawValue = row.getValue(id) as number;
      const stringValue = String(rawValue);

      // Handle both direct value matching and text search
      if (typeof value === "string") {
        return stringValue.includes(value);
      }

      return false;
    }
  },
  {
    accessorKey: "sacrifice_time",
    header: "Kesim Saati",
    cell: ({ row }) => {
      const time = row.getValue("sacrifice_time") as string;
      if (!time) return <div className="text-center">-</div>;

      try {
        const [hours, minutes] = time.split(':');
        return (
          <div className="text-center">
            {`${hours}:${minutes}`}
          </div>
        );
      } catch (error) {
        console.error('Error formatting time:', error);
        return <div className="text-center">-</div>;
      }
    },
    size: 200,
  },
  {
    accessorKey: "share_price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Hisse Bedeli
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-1 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("share_price") as number;
      return (
        <div>
          {new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 0,
          }).format(price)}
        </div>
      );
    },
    enableSorting: true,
    filterFn: (row, id, filterValues: (string | number)[]) => {
      if (!filterValues || filterValues.length === 0) return true;

      const rowValue = row.getValue(id) as number;

      return filterValues.some((filterValue: string | number) => {
        const numericFilterValue = typeof filterValue === "string"
          ? parseFloat(filterValue)
          : filterValue;
        return rowValue === numericFilterValue;
      });
    },
  },
  {
    accessorKey: "empty_share",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Boş Hisse
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-1 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const empty = row.getValue("empty_share") as number;
      return <div>{empty}</div>;
    },
    enableSorting: true,
    filterFn: (row, id, filterValues: (string | number)[]) => {
      if (!filterValues || filterValues.length === 0) return true;

      const rowValue = row.getValue(id) as number;
      const stringValue = String(rowValue);

      return filterValues.includes(stringValue);
    },
  },
  {
    accessorKey: "payment_status",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="px-0 font-medium"
        >
          Ödeme Oranı
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    accessorFn: (row) => {
      const shareholders = row.shareholders || [];

      if (!shareholders.length) return 0;

      const totalPaid = shareholders.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
      const total = shareholders.reduce((sum, s) => sum + (s.total_amount || 0), 0);

      return total > 0 ? Math.floor((totalPaid / total) * 100) : 0;
    },
    cell: ({ row }) => {
      const ratio = row.getValue("payment_status") as number;
      const shareholders = row.original.shareholders || [];

      const totalPaid = shareholders.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
      const total = shareholders.reduce((sum, s) => sum + (s.total_amount || 0), 0);

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount) + ' TL';
      };

      const progressBar = (
        <div className="flex items-center gap-4">
          <Progress
            value={ratio}
            className="min-w-[100px]"
            style={{
              ["--progress-background" as string]: ratio < 50
                ? "rgb(220 38 38 / 0.2)"
                : ratio < 100
                  ? "rgb(202 138 4 / 0.2)"
                  : "rgb(22 163 74 / 0.2)",
              ["--progress-foreground" as string]: ratio < 50
                ? "rgb(220 38 38)"
                : ratio < 100
                  ? "rgb(202 138 4)"
                  : "rgb(22 163 74)",
            } as React.CSSProperties}
          />
          <div
            className={cn(
              "text-sm tabular-nums w-[50px] text-left",
              ratio < 50 ? "text-red-600" : ratio < 100 ? "text-yellow-600" : "text-green-600",
            )}
          >
            %{ratio.toString().padStart(3)}
          </div>
        </div>
      );

      return (
        <div className="flex justify-center py-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {progressBar}
              </TooltipTrigger>
              <TooltipContent className="p-4 w-[280px] bg-white">
                <div className="space-y-2">
                  {totalPaid >= total ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#1DC355]" />
                        <span className="text-sm text-muted-foreground">Ödeme Tamamlandı:</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(totalPaid)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#1DC355]" />
                          <span className="text-sm text-muted-foreground">Ödenen Tutar:</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#D22D2D]" />
                          <span className="text-sm text-muted-foreground">Kalan Tutar:</span>
                        </div>
                        <span className="text-sm font-medium text-[#000000]">{formatCurrency(total - totalPaid)}</span>
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
    size: 200,
  },
  {
    accessorKey: "notes",
    header: "Notlar",
    cell: ({ row }) => {
      const notes = row.original.notes || "";
      return (
        <div className="max-w-[200px] truncate" title={notes}>
          {notes || "-"}
        </div>
      );
    },
    size: 200,
    enableSorting: false,
    enableHiding: true,
    filterFn: (row, id, value: string | number) => {
      if (!value) return true;
      const notes = row.getValue(id)?.toString().toLowerCase() || "";
      return notes.includes(value.toString().toLowerCase());
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ActionCellContent row={row} />,
    size: 200,
    enableSorting: false,
  },
];

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { sacrificeSchema, ShareholderDetails } from "@/types";
import { Eye, Ban, Pencil, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isValid, parse } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareholderPayment {
  paid_amount: number;
  total_amount: number;
}

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: "Kurban No",
    cell: ({ row }) => <div className="text-center">{row.getValue("sacrifice_no")}</div>,
    size: 200,
    filterFn: (row, id, value: string[]) => {
      if (!value?.length) return true;
      const sacrificeNo = row.getValue(id) as string;
      return value.includes(sacrificeNo);
    },
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
    header: "Hisse Bedeli",
    cell: ({ row }) => {
      const amount = row.getValue("share_price") as number;
      const formatted = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(amount);
      
      return <div className="text-center">{formatted}</div>;
    },
    filterFn: (row, id, value) => {
      if (!value?.length) return true;
      const price = row.getValue(id) as number;
      return value.includes(price.toString());
    },
    enableColumnFilter: true,
    size: 200,
  },
  {
    accessorKey: "empty_share",
    header: "Boş Hisse",
    cell: ({ row }) => {
      const emptyShare = row.getValue("empty_share") as number;
      
      if (emptyShare === 0) {
        return (
          <div className="flex justify-center py-1">
            <span className="inline-flex items-center min-w-[100px] bg-[#FCEFEF] text-[#D22D2D] px-4 py-1.5 rounded">
              <Ban className="h-4 w-4 mr-1.5" />
              Tükendi
            </span>
          </div>
        );
      }

      return (
        <div className="text-center">
          <span>{emptyShare}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value?.length) return true;
      const emptyShare = row.getValue(id) as number;
      return value.includes(emptyShare.toString());
    },
    enableColumnFilter: true,
    size: 200,
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
          style: 'currency',
          currency: 'TRY'
        }).format(amount);
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
              <TooltipContent className="p-4 w-[300px] bg-white">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#1DC355]" />
                      <span className="text-sm text-muted-foreground">Ödenen Tutar:</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#3A9E5F]" />
                      <span className="text-sm text-muted-foreground">Kalan Tutar:</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(total - totalPaid)}</span>
                  </div>
                  <Separator className="my-2 bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#125427]" />
                      <span className="text-sm text-muted-foreground">Toplam Tutar:</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(total)}</span>
                  </div>
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
    cell: ({ row }) => <div className="line-clamp-1">{row.getValue("notes")}</div>,
    size: 200,
    enableSorting: false,
    enableHiding: true,
    filterFn: (row, id, value) => {
      if (!value) return true;
      const notes = row.getValue(id)?.toString().toLowerCase() || "";
      return notes.includes(value.toLowerCase());
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const router = useRouter();
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      const [shareholders, setShareholders] = useState<ShareholderDetails[]>([]);
      const sacrificeId = row.original.sacrifice_id;

      useEffect(() => {
        const fetchShareholderDetails = async () => {
          const { data: shareholders } = await supabase
            .from("shareholders")
            .select("paid_amount, total_amount, shareholder_name, phone_number, delivery_location")
            .eq("sacrifice_id", sacrificeId);

          if (shareholders?.length) {
            setShareholders(shareholders);
          }
        };

        if (isDialogOpen) {
          fetchShareholderDetails();
        }
      }, [sacrificeId, isDialogOpen]);

      const formatDeliveryLocation = (location: string) => {
        switch (location) {
          case "yenimahalle-pazar-yeri":
            return "Yenimahalle Pazar Yeri";
          case "kecioren-otoparki":
            return "Keçiören Otoparkı";
          default:
            return "Kesimhane";
        }
      };

      return (
        <>
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
              onClick={() => {
                // TODO: Implement delete functionality
                console.log("Delete clicked", row.original);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="p-12 max-h-[90vh] w-[600px]">
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

              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-8 mt-8">
                  {shareholders.map((shareholder, index) => (
                    <div key={index}>
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
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.floor((shareholder.paid_amount / shareholder.total_amount) * 100)}
                              className="flex-1"
                              style={{
                                ["--progress-background" as string]: shareholder.paid_amount / shareholder.total_amount < 0.5 
                                  ? "rgb(220 38 38 / 0.2)" 
                                  : shareholder.paid_amount / shareholder.total_amount < 1 
                                    ? "rgb(202 138 4 / 0.2)" 
                                    : "rgb(22 163 74 / 0.2)",
                                ["--progress-foreground" as string]: shareholder.paid_amount / shareholder.total_amount < 0.5 
                                  ? "rgb(220 38 38)" 
                                  : shareholder.paid_amount / shareholder.total_amount < 1 
                                    ? "rgb(202 138 4)" 
                                    : "rgb(22 163 74)",
                              } as React.CSSProperties}
                            />
                            <span className={cn(
                              "text-sm tabular-nums",
                              shareholder.paid_amount / shareholder.total_amount < 0.5 
                                ? "text-red-600" 
                                : shareholder.paid_amount / shareholder.total_amount < 1 
                                  ? "text-yellow-600" 
                                  : "text-green-600"
                            )}>
                              %{Math.floor((shareholder.paid_amount / shareholder.total_amount) * 100).toString().padStart(3)}
                            </span>
                          </div>
                          <div className="text-[#698c78] text-sm text-right">
                            {formatDeliveryLocation(shareholder.delivery_location)}
                          </div>
                        </div>
                      </div>
                      {index < shareholders.length - 1 && (
                        <div className="my-6 border-t border-dashed border-[#698c78] opacity-50" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </>
      );
    },
    size: 200,
    enableSorting: false,
  },
];

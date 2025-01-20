"use client";

import { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Check, Ban, Trash2 } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
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
} from "@/components/ui/alert-dialog";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const { toast } = useToast();
  const user = row.original as any;

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Durum güncellendi",
        description: "Kullanıcı durumu başarıyla güncellendi.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Kullanıcı silindi",
        description: "Kullanıcı başarıyla silindi.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kullanıcı silinirken bir hata oluştu.",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Menüyü aç</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => router.push(`/kurban-admin/kullanici-yonetimi/${user.id}`)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Düzenle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.status === "pending" && (
          <DropdownMenuItem onClick={() => handleStatusChange("approved")}>
            <Check className="mr-2 h-4 w-4" />
            Onayla
          </DropdownMenuItem>
        )}
        {user.status !== "blacklisted" && (
          <DropdownMenuItem onClick={() => handleStatusChange("blacklisted")}>
            <Ban className="mr-2 h-4 w-4" />
            Engelle
          </DropdownMenuItem>
        )}
        {user.status === "blacklisted" && (
          <DropdownMenuItem onClick={() => handleStatusChange("approved")}>
            <Check className="mr-2 h-4 w-4" />
            Engeli Kaldır
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. Bu kullanıcıyı kalıcı olarak sileceksiniz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Devam Et
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
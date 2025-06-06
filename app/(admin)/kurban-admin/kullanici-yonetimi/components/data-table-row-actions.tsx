"use client";

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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Row } from "@tanstack/react-table";
import { Ban, Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  status: 'pending' | 'approved' | 'blacklisted';
  email: string;
  name: string;
  role: string;
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const { toast } = useToast();
  const user = row.original as User;

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Dispatch an event to notify other components about the user update
      window.dispatchEvent(new CustomEvent('user-updated'));

      toast({
        title: "Durum güncellendi",
        description: "Kullanıcı durumu başarıyla güncellendi.",
      });
    } catch {
      toast({
        title: "Hata",
        description: "Kullanıcı durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Dispatch an event to notify other components about the user update
      window.dispatchEvent(new CustomEvent('user-updated'));

      toast({
        title: "Kullanıcı silindi",
        description: "Kullanıcı başarıyla silindi.",
      });
    } catch {
      toast({
        title: "Hata",
        description: "Kullanıcı silinirken bir hata oluştu.",
        variant: "destructive",
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
          <DropdownMenuItem onClick={() => handleStatusChange(user.id, "approved")}>
            <Check className="mr-2 h-4 w-4" />
            Onayla
          </DropdownMenuItem>
        )}
        {user.status !== "blacklisted" && (
          <DropdownMenuItem onClick={() => handleStatusChange(user.id, "blacklisted")}>
            <Ban className="mr-2 h-4 w-4" />
            Engelle
          </DropdownMenuItem>
        )}
        {user.status === "blacklisted" && (
          <DropdownMenuItem onClick={() => handleStatusChange(user.id, "approved")}>
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
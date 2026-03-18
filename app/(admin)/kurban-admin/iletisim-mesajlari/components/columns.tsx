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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";

export type ContactMessage = {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  created_at: string;
  read_at: string | null;
  message_year: number | null;
};

export const columns: ColumnDef<ContactMessage>[] = [
  {
    accessorKey: "read_at",
    header: "Durum",
    cell: ({ row }) => {
      const isRead = !!row.original.read_at;
      return (
        <Badge
          variant="secondary"
          className={cn(
            isRead ? "bg-sac-blue-light text-sac-blue" : "bg-sac-yellow-light text-sac-yellow"
          )}
        >
          {isRead ? "Okundu" : "Okunmadı"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Ad Soyad",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Telefon",
    cell: ({ row }) => row.getValue("phone"),
  },
  {
    accessorKey: "email",
    header: "E-posta",
    cell: ({ row }) => {
      const email = row.getValue("email") as string | null;
      return email || "-";
    },
  },
  {
    accessorKey: "message",
    header: "Mesaj",
    cell: ({ row }) => {
      const msg = row.getValue("message") as string;
      return (
        <span className="whitespace-pre-wrap">{msg}</span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Tarih",
    cell: ({ row }) => formatDate(row.getValue("created_at")),
  },
  {
    accessorKey: "message_year",
    header: "Yıl",
    cell: ({ row }) => {
      const year = row.original.message_year;
      return year ?? (row.original.created_at ? new Date(row.original.created_at).getFullYear() : "-");
    },
  },
  {
    id: "actions",
    header: "İşlem",
    cell: ({ row }) => {
      const msg = row.original;
      const isRead = !!msg.read_at;
      return (
        <div className="flex items-center gap-1">
          <MarkReadButton id={msg.id} isRead={isRead} />
          <DeleteMessageButton id={msg.id} />
        </div>
      );
    },
  },
];

function MarkReadButton({ id, isRead }: { id: string; isRead: boolean }) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: !isRead }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event("contact-messages-updated"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClick}
            disabled={loading}
          >
            {isRead ? (
              <Mail className="h-4 w-4 text-muted-foreground" />
            ) : (
              <MailOpen className="h-4 w-4 text-primary" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isRead ? "Okunmadı olarak işaretle" : "Okundu olarak işaretle"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DeleteMessageButton({ id }: { id: string }) {
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOpen(false);
        window.dispatchEvent(new Event("contact-messages-updated"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-sac-red hover:bg-sac-red-light"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Mesajı sil</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mesajı silmek istediğinize emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem geri alınamaz. Mesaj kalıcı olarak silinecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Siliniyor..." : "Sil"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

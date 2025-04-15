"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface UserType {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "admin" | "editor" | null;
  status: "pending" | "approved" | "blacklisted";
  created_at: string;
  updated_at: string;
}

export const columns: ColumnDef<UserType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kullanıcı" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.image || ""} />
            <AvatarFallback>
              {(row.getValue("name") as string)?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue("name")}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rol" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role");
      return (
        <Badge variant={role === "admin" ? "default" : "secondary"}>
          {role === "admin" ? "Admin" : role === "editor" ? "Editör" : "Belirlenmedi"}
        </Badge>
      );
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Durum" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <Badge
          variant={
            status === "approved"
              ? "default"
              : status === "pending"
              ? "secondary"
              : "destructive"
          }
        >
          {status === "approved"
            ? "Onaylı"
            : status === "pending"
            ? "Onay Bekliyor"
            : "Engellendi"}
        </Badge>
      );
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kayıt Tarihi" />
    ),
    cell: ({ row }) => {
      return format(new Date(row.getValue("created_at")), "dd MMM yyyy", {
        locale: tr,
      });
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]; 
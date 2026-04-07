"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateShort } from "@/lib/date-utils";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { NameCell } from "./name-cell";
import { RoleCell } from "./role-cell";
import { StatusCell } from "./status-cell";

export interface UserType {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "admin" | "editor" | "super_admin" | null;
  status: "pending" | "approved" | "blacklisted";
  tenant_approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const columns: ColumnDef<UserType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kullanıcı Adı" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3 text-left">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={row.original.image || ""} />
          <AvatarFallback>
            {(row.getValue("name") as string)?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <NameCell userId={row.original.id} initialName={row.getValue("name") as string} />
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="E-posta" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Durum" />
    ),
    cell: ({ row }) => <StatusCell row={row} />,
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rol" />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <RoleCell row={row} />
      </div>
    ),
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kayıt Tarihi" />
    ),
    cell: ({ row }) => formatDateShort(row.getValue("created_at")),
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]; 
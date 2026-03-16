"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { Row } from "@tanstack/react-table";

interface UserType {
  id: string;
  role: "admin" | "editor" | "super_admin" | null;
}

const BASE_ROLE_OPTIONS = [
  { value: "null", label: "Belirlenmedi" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editör" },
] as const;

const SUPER_ADMIN_OPTION = { value: "super_admin", label: "Super Yönetici" } as const;

export function RoleCell({ row }: { row: Row<UserType> }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const user = row.original;

  const handleRoleChange = async (value: string) => {
    const role = value === "null" ? null : (value as "admin" | "editor" | "super_admin");
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Rol güncellenemedi");
      }

      window.dispatchEvent(new CustomEvent("user-updated"));

      toast({
        title: "Rol güncellendi",
        description: "Kullanıcı rolü başarıyla güncellendi.",
      });
    } catch (e) {
      toast({
        title: "Hata",
        description: e instanceof Error ? e.message : "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const displayRole =
    user.role === "super_admin"
      ? "Super Yönetici"
      : user.role === "admin"
        ? "Admin"
        : user.role === "editor"
          ? "Editör"
          : "Belirlenmedi";

  // super_admin rolü tablodan değiştirilemez
  if (user.role === "super_admin") {
    return (
      <Badge variant="default">{displayRole}</Badge>
    );
  }

  const selectValue = user.role ?? "null";

  return (
    <Select
      value={selectValue}
      onValueChange={handleRoleChange}
    >
      <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent shadow-none hover:bg-muted/50">
        <SelectValue>
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
            {displayRole}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {session?.user?.role === "super_admin" && (
          <SelectItem value={SUPER_ADMIN_OPTION.value}>
            {SUPER_ADMIN_OPTION.label}
          </SelectItem>
        )}
        {BASE_ROLE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

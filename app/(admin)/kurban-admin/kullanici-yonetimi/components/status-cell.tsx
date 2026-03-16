"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { Ban, Check, ChevronDown, XCircle } from "lucide-react";
import { Row } from "@tanstack/react-table";

interface UserType {
  id: string;
  status: "pending" | "approved" | "blacklisted";
  tenant_approved_at?: string | null;
}

export function StatusCell({ row }: { row: Row<UserType> }) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const user = row.original;
  const isSuperAdmin = session?.user?.role === "super_admin";

  const status = user.status;
  const tenantApprovedAt = user.tenant_approved_at;
  const isPendingForTenant = tenantApprovedAt == null;
  const isBlacklisted = status === "blacklisted";
  const isApproved = !isBlacklisted && !isPendingForTenant && status !== "pending";
  const displayPending = isBlacklisted ? false : isPendingForTenant || status === "pending";

  const handleStatusChange = async (
    userId: string,
    newStatus: string,
    addToOtherTenant = false,
    revokeApproval = false
  ) => {
    try {
      const body: Record<string, unknown> = revokeApproval
        ? { revokeApproval: true }
        : { status: newStatus };
      if (addToOtherTenant) body.addToOtherTenant = true;

      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "İşlem başarısız");
      }

      window.dispatchEvent(new CustomEvent("user-updated"));

      toast({
        title: revokeApproval
          ? "Onay kaldırıldı"
          : addToOtherTenant
            ? "Onaylandı ve diğer siteye eklendi"
            : "Durum güncellendi",
        description: revokeApproval
          ? "Kullanıcının bu organizasyondaki onayı kaldırıldı."
          : addToOtherTenant
            ? "Kullanıcı onaylandı ve diğer organizasyona da erişim verildi."
            : "Kullanıcı durumu başarıyla güncellendi.",
      });
    } catch (e) {
      toast({
        title: "Hata",
        description: e instanceof Error ? e.message : "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const displayText = isBlacklisted
    ? "Engellendi"
    : displayPending
      ? "Onay Bekliyor"
      : "Onaylı";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none"
        >
          <Badge
            variant={
              isBlacklisted ? "destructive" : displayPending ? "secondary" : "default"
            }
          >
            {displayText}
          </Badge>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        {(displayPending || status === "pending") && (
          <>
            <DropdownMenuItem
              onClick={() => handleStatusChange(user.id, "approved")}
            >
              <Check className="mr-2 h-4 w-4" />
              Onayla
            </DropdownMenuItem>
            {isSuperAdmin && (
              <DropdownMenuItem
                onClick={() => handleStatusChange(user.id, "approved", true)}
              >
                <Check className="mr-2 h-4 w-4" />
                Onayla ve diğer siteye de ekle
              </DropdownMenuItem>
            )}
          </>
        )}
        {isApproved && (
          <DropdownMenuItem
            onClick={() => handleStatusChange(user.id, "approved", false, true)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Onayı Kaldır
          </DropdownMenuItem>
        )}
        {!isBlacklisted && (
          <DropdownMenuItem
            onClick={() => handleStatusChange(user.id, "blacklisted")}
          >
            <Ban className="mr-2 h-4 w-4" />
            Engelle
          </DropdownMenuItem>
        )}
        {isBlacklisted && (
          <DropdownMenuItem
            onClick={() => handleStatusChange(user.id, "approved")}
          >
            <Check className="mr-2 h-4 w-4" />
            Engeli Kaldır
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

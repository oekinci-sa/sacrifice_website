"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSearchToolbarTableSkeleton } from "../components/admin-page-skeletons";
import { useSession } from "next-auth/react";
import { Search, X } from "lucide-react";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { useEffect, useMemo, useState } from "react";
import { columns } from "./components/columns";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "super_admin" | null;
  status: "pending" | "approved" | "blacklisted";
  created_at: string;
  image: string | null;
  updated_at: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    const handleUserChange = () => fetchUsers();
    window.addEventListener("user-updated", handleUserChange);
    return () => window.removeEventListener("user-updated", handleUserChange);
  }, []);

  const baseUsers = users.filter((u) => u.email !== session?.user?.email);

  const filteredUsers = useMemo(() => {
    const q = normalizeTurkishSearchText(searchTerm.trim());
    if (!q) return baseUsers;
    return baseUsers.filter((u) => {
      const blob = normalizeTurkishSearchText(
        [u.name, u.email, u.role, u.status].filter(Boolean).join(" ")
      );
      return blob.includes(q);
    });
  }, [baseUsers, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Panel kullanıcılarının rol ve onay durumlarını düzenleyebilirsiniz.
        </p>
      </div>
      {loading ? (
        <AdminSearchToolbarTableSkeleton rows={10} />
      ) : (
        <CustomDataTable
          data={filteredUsers}
          columns={columns}
          storageKey="kullanici-yonetimi"
          pageSizeOptions={[10, 20, 50, 100]}
          tableSize="medium"
          filters={({ table, columnFilters }) => {
            const hasAnyFilter =
              searchTerm.trim().length > 0 || columnFilters.length > 0;
            return (
              <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
                <div className="relative w-96 max-w-full min-w-0 sm:w-[28rem]">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    placeholder="İsim, e-posta, rol veya durumda ara…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                    aria-label="Tabloda ara"
                  />
                </div>
                {hasAnyFilter ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-dashed gap-1.5 shrink-0 ml-auto"
                    onClick={() => {
                      setSearchTerm("");
                      table.resetColumnFilters();
                    }}
                  >
                    <X className="h-4 w-4 shrink-0" />
                    Tüm filtreleri temizle
                  </Button>
                ) : null}
              </div>
            );
          }}
        />
      )}
    </div>
  );
} 
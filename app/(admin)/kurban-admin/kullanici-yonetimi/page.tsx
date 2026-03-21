"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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

  const filteredUsers = users.filter((u) => u.email !== session?.user?.email);

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Panel kullanıcılarının rol ve onay durumlarını düzenleyebilirsiniz.
        </p>
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <CustomDataTable
          data={filteredUsers}
          columns={columns}
          storageKey="kullanici-yonetimi"
          pageSizeOptions={[10, 20, 50, 100]}
          tableSize="medium"
        />
      )}
    </div>
  );
} 
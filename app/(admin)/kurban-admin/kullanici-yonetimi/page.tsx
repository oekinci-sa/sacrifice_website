"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | null;
  status: "pending" | "approved" | "blacklisted";
  created_at: string;
  image: string | null;
  updated_at: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Set up event listener for changes
    const handleUserChange = () => {
      fetchUsers();
    };

    window.addEventListener('user-updated', handleUserChange);

    return () => {
      window.removeEventListener('user-updated', handleUserChange);
    };
  }, []);

  // Don't show current user in the list
  const filteredUsers = users.filter(user => user.email !== session?.user?.email);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>
          <p className="text-muted-foreground">
            Sistem kullanıcılarını yönetin ve erişim izinlerini düzenleyin
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/kurban-admin/kullanici-yonetimi/yeni")}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Kullanıcı
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <DataTable data={filteredUsers} columns={columns} />
      )}
    </div>
  );
} 
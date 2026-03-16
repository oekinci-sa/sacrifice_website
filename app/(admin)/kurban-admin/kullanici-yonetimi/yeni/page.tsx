"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function YeniKullaniciPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const isSuperAdmin = session?.user?.role === "super_admin";
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "super_admin" | "">("");
  const [status, setStatus] = useState<"pending" | "approved" | "">("pending");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "E-posta adresi zorunludur.",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          role: role || null,
          status: status || "pending",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Kullanıcı oluşturulamadı");
      }

      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla oluşturuldu.",
      });
      window.dispatchEvent(new Event("user-updated"));
      router.push("/kurban-admin/kullanici-yonetimi");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Kullanıcı</h1>
        <p className="text-muted-foreground mt-2">
          Sisteme yeni bir kullanıcı ekleyin. Kullanıcı e-posta ile davet edilecektir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="email">E-posta *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">İsim</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger>
              <SelectValue placeholder="Rol seçin" />
            </SelectTrigger>
            <SelectContent>
              {isSuperAdmin && (
                <SelectItem value="super_admin">Super Yönetici</SelectItem>
              )}
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editör</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Durum</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Onay Bekliyor</SelectItem>
              <SelectItem value="approved">Onaylı</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Kullanıcı Oluştur
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/kurban-admin/kullanici-yonetimi")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
}

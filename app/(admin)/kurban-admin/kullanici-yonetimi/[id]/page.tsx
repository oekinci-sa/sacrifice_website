"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | null;
  status: "pending" | "approved" | "blacklisted";
  image: string | null;
}

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/users/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast({
              variant: "destructive",
              title: "Hata",
              description: "Kullanıcı bulunamadı.",
            });
            return;
          }
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        setUser(data);
      } catch {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kullanıcı bilgileri yüklenirken bir hata oluştu.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      let imageUrl = user.image;

      // Upload new image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("userId", id as string);

        const uploadResponse = await fetch("/api/users/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadErrorData = await uploadResponse.json().catch(() => ({ error: "Parse error" }));
          console.error("Resim yükleme hatası:", { status: uploadResponse.status, error: uploadErrorData });
          throw new Error(`Failed to upload image: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.url;
      }

      // Update user data
      const updateData = {
        name: user.name,
        role: isAdmin ? user.role : undefined,
        image: imageUrl,
      };

      const updateResponse = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({ error: "Parse error" }));
        console.error("Kullanıcı güncelleme hatası:", { 
          status: updateResponse.status, 
          error: errorData, 
          responseText: await updateResponse.text().catch(() => null) 
        });
        throw new Error(`Failed to update user: ${updateResponse.status}`);
      }

      const updatedData = await updateResponse.json();

      // Dispatch an event to notify other components about the user update
      window.dispatchEvent(new CustomEvent('user-updated'));

      toast({
        title: "Başarılı",
        description: "Kullanıcı bilgileri güncellendi.",
      });
    } catch (error) {
      console.error("Kullanıcı güncelleme işlemi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "Kullanıcı bilgileri güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p>Kullanıcı bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/kurban-admin/kullanici-yonetimi")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Kullanıcı Profili</h2>
        </div>
      </div>
      <Separator />

      <form onSubmit={handleSave} className="space-y-8">
        <div className="space-y-2">
          <Label>Profil Fotoğrafı</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={
                  imageFile
                    ? URL.createObjectURL(imageFile)
                    : user.image || undefined
                }
              />
              <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <Label
              htmlFor="picture"
              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
            >
              <Upload className="mr-2 h-4 w-4" />
              Fotoğraf Yükle
              <Input
                id="picture"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </Label>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">İsim</Label>
            <Input
              id="name"
              value={user.name || ""}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
            />
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={user.role || ""}
                onValueChange={(value) =>
                  setUser({ ...user, role: value as "admin" | "editor" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editör</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </div>
      </form>
    </div>
  );
} 
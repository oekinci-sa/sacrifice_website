"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { NotFound } from "@/components/ui/not-found";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useSacrificeById } from "@/hooks/useSacrificeById";
import { useGetShareholdersBySacrificeId } from "@/hooks/useShareholders";
import { useUser } from "@/hooks/useUsers";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { sacrificeSchema } from "@/types";
import { format } from "date-fns";
import { ArrowLeft, Check, Edit, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function KurbanlikAyrintilariPage({ params }: { params: { id: string } }) {
  const { data: sacrifice, isLoading } = useSacrificeById(params.id);
  const { data: shareholders, isLoading: shareholdersLoading } = useGetShareholdersBySacrificeId(params.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<sacrificeSchema>>({});
  const { toast } = useToast();
  const { data: session } = useSession();
  const { data: userData } = useUser(session?.user?.email);
  const router = useRouter();
  const { updateSacrifice } = useSacrificeStore();

  if (isLoading || shareholdersLoading) {
    return <Loading />;
  }

  if (!sacrifice) {
    return <NotFound message="Kurbanlık bulunamadı" />;
  }

  // Sayfa yüklendiğinde veya düzenleme modu değiştiğinde form verilerini güncelleyelim
  if (sacrifice && !editData.sacrifice_id) {
    setEditData(sacrifice);
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(sacrifice);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!userData?.name) {
      toast({
        title: "Hata",
        description: "Kullanıcı bilgisi bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Boş değerleri filtreleyelim
      const updateData = {
        ...editData,
        last_edited_by: userData.name,
      };

      // API'ye güncelleme isteği gönderelim
      const response = await fetch(`/api/sacrifices/${sacrifice.sacrifice_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Kurbanlık güncellenirken bir hata oluştu");
      }

      const updatedSacrifice = await response.json();

      // Zustand store'u güncelleyelim
      updateSacrifice(updatedSacrifice);

      // Düzenleme modunu kapatalım
      setIsEditing(false);

      toast({
        title: "Başarılı",
        description: "Kurbanlık bilgileri güncellendi.",
      });
    } catch {
      toast({
        title: "Hata",
        description: "Kurbanlık güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/kurban-admin/kurbanliklar/tum-kurbanliklar")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Kurbanlık Ayrıntıları</h1>
        </div>

        {/* Düzenle/İptal/Kaydet butonları */}
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
                İptal
              </Button>
              <Button
                variant="default"
                className="gap-2"
                onClick={handleSave}
              >
                <Check className="h-4 w-4" />
                Kaydet
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4" />
              Düzenle
            </Button>
          )}
        </div>
      </div>

      {/* 3 sütunlu grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Kurbanlık No</p>
          {isEditing ? (
            <Input
              value={editData.sacrifice_no || ''}
              onChange={(e) => handleChange('sacrifice_no', e.target.value)}
            />
          ) : (
            <p className="font-medium">{sacrifice.sacrifice_no}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Kesim Saati</p>
          {isEditing ? (
            <Input
              value={editData.sacrifice_time || ''}
              onChange={(e) => handleChange('sacrifice_time', e.target.value)}
              placeholder="12:30"
            />
          ) : (
            <p className="font-medium">{sacrifice.sacrifice_time || "-"}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Ağırlık</p>
          {isEditing ? (
            <Input
              type="number"
              value={editData.share_weight || ''}
              onChange={(e) => handleChange('share_weight', Number(e.target.value))}
            />
          ) : (
            <p className="font-medium">{sacrifice.share_weight} kg</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Boş Hisse</p>
          {isEditing ? (
            <Input
              type="number"
              value={editData.empty_share || ''}
              onChange={(e) => handleChange('empty_share', Number(e.target.value))}
              max={7}
              min={0}
            />
          ) : (
            <p className="font-medium">{sacrifice.empty_share}/7</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Hisse Fiyatı</p>
          {isEditing ? (
            <Input
              type="number"
              value={editData.share_price || ''}
              onChange={(e) => handleChange('share_price', Number(e.target.value))}
            />
          ) : (
            <p className="font-medium">{sacrifice.share_price ? `${sacrifice.share_price.toLocaleString('tr-TR')} TL` : "-"}</p>
          )}
        </div>
      </div>

      {/* Notlar */}
      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Notlar</p>
        {isEditing ? (
          <Textarea
            value={editData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Kurbanlık hakkında notlar..."
            className="min-h-[100px]"
          />
        ) : (
          <p className="font-medium">{sacrifice.notes || "-"}</p>
        )}
      </div>

      {/* Hissedarlar Listesi */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Hissedarlar</h2>
        {shareholders.length === 0 ? (
          <p className="text-muted-foreground">Bu kurbanlık için hissedar bulunmamaktadır.</p>
        ) : (
          <div className="border rounded-md divide-y">
            {shareholders.map((shareholder) => (
              <div key={shareholder.shareholder_id} className="p-4 hover:bg-muted/50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{shareholder.shareholder_name}</h3>
                    <p className="text-sm text-muted-foreground">{shareholder.phone_number}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/kurban-admin/hissedarlar/ayrintilar/${shareholder.shareholder_id}`}>
                      Detaylar
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Teslimat:</span>{" "}
                    {shareholder.delivery_location}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Toplam:</span>{" "}
                    {shareholder.total_amount?.toLocaleString("tr-TR")} TL
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Ödenen:</span>{" "}
                    {shareholder.paid_amount?.toLocaleString("tr-TR")} TL
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Kalan:</span>{" "}
                    {shareholder.remaining_payment?.toLocaleString("tr-TR")} TL
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sadece son düzenleyen bilgisi */}
      {sacrifice.last_modified_by && (
        <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
          Son düzenleyen: <span className="font-medium">{sacrifice.last_modified_by}</span>
          {sacrifice.last_modified_at ? format(new Date(sacrifice.last_modified_at), " - dd.MM.yyyy HH:mm") : ""}
        </div>
      )}
    </div>
  );
}

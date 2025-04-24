"use client";

import { priceInfo } from '@/app/(public)/(anasayfa)/constants';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { NotFound } from "@/components/ui/not-found";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useEffect, useState } from "react";

export default function KurbanlikAyrintilariPage({ params }: { params: { id: string } }) {
  const { data: sacrifice, isLoading } = useSacrificeById(params.id);
  const { data: shareholders, isLoading: shareholdersLoading } = useGetShareholdersBySacrificeId(params.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<sacrificeSchema>>({});
  const [selectedPriceInfo, setSelectedPriceInfo] = useState({ kg: '', price: '' });
  const { toast } = useToast();
  const { data: session } = useSession();
  const { data: userData } = useUser(session?.user?.email);
  const router = useRouter();
  const { updateSacrifice } = useSacrificeStore();

  // Set selected price info when sacrifice data is loaded
  useEffect(() => {
    if (sacrifice && sacrifice.share_weight) {
      const matchingPrice = priceInfo.find(item =>
        parseFloat(item.kg.replace(/[^\d.]/g, '')) === sacrifice.share_weight
      );
      if (matchingPrice) {
        setSelectedPriceInfo(matchingPrice);
      }
    }
  }, [sacrifice]);

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
      // Ensure we use the selected weight and price from the dropdown
      const updateData = {
        ...editData,
        share_weight: selectedPriceInfo.kg ? parseFloat(selectedPriceInfo.kg.replace(/[^\d.]/g, '')) : editData.share_weight,
        share_price: selectedPriceInfo.price ? parseInt(selectedPriceInfo.price.replace(/\./g, ''), 10) : editData.share_price,
        last_edited_by: userData.name,
        last_edited_time: new Date().toISOString()
      };

      // Use the new API endpoint
      const response = await fetch(`/api/update-sacrifice`, {
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
      updateSacrifice(updatedSacrifice.data);

      // Düzenleme modunu kapatalım
      setIsEditing(false);

      toast({
        title: "Başarılı",
        description: "Kurbanlık bilgileri güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: `Kurbanlık güncellenirken bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  // Generate options for empty shares dropdown (0-7)
  const emptyShareOptions = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="space-y-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/kurban-admin/kurbanliklar/tum-kurbanliklar")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Kurbanlık Ayrıntıları</h1>
            {sacrifice.last_edited_by && (
              <p className="text-sm text-muted-foreground mt-1">
                Son düzenleyen: <span className="font-medium">{sacrifice.last_edited_by}</span>
                {sacrifice.last_edited_time ? format(new Date(sacrifice.last_edited_time), " - dd.MM.yyyy HH:mm") : ""}
              </p>
            )}
          </div>
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

      {/* Kurbanlık bilgileri */}
      <div>
        {/* 4 sütunlu grid - ilk satır */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
            <p className="text-sm font-medium text-muted-foreground">Ağırlık/Fiyat</p>
            {isEditing ? (
              <Select
                value={selectedPriceInfo.kg}
                onValueChange={(value) => {
                  const selected = priceInfo.find(item => item.kg === value);
                  if (selected) {
                    setSelectedPriceInfo(selected);
                    handleChange('share_weight', parseFloat(selected.kg.replace(/[^\d.]/g, '')));
                    handleChange('share_price', parseInt(selected.price.replace(/\./g, ''), 10));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ağırlık/Fiyat seçin" />
                </SelectTrigger>
                <SelectContent>
                  {priceInfo.map((item) => (
                    <SelectItem key={item.kg} value={item.kg}>
                      {item.kg} - {item.price} TL
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium">{sacrifice.share_weight} kg - {sacrifice.share_price?.toLocaleString('tr-TR')} TL</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Boş Hisse</p>
            {isEditing ? (
              <Select
                // value olarak boş veride "" ver, 0'da "0" ver
                value={editData.empty_share != null ? String(editData.empty_share) : ""}
                onValueChange={value =>
                  handleChange("empty_share", parseInt(value, 10))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {editData.empty_share != null
                      ? editData.empty_share      // 0 da dahil
                      : "Veri yok"                // null / undefined ise
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {emptyShareOptions.map(option => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            ) : (
              <p className="font-medium">{sacrifice.empty_share}/7</p>
            )}
          </div>
        </div>

        {/* Notlar - resized to half width and half height */}
        <div className="mt-4 space-y-1 w-1/2">
          <p className="text-sm font-medium text-muted-foreground">Notlar</p>
          {isEditing ? (
            <Textarea
              value={editData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Kurbanlık hakkında notlar..."
              className="min-h-[50px]"
            />
          ) : (
            <p className="font-medium">{sacrifice.notes || "-"}</p>
          )}
        </div>
      </div>

      {/* Hissedarlar Listesi - with improved spacing, 2 columns */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Hissedarlar</h2>
        {shareholders.length === 0 ? (
          <p className="text-muted-foreground">Bu kurbanlık için hissedar bulunmamaktadır.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shareholders.map((shareholder) => (
              <div key={shareholder.shareholder_id} className="p-4 bg-white rounded-md border hover:bg-muted/50 transition-colors">
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
    </div>
  );
}

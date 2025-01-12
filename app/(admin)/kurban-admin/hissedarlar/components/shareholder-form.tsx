"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ShareholderFormProps {
  shareholder: {
    shareholder_id: string;
    shareholder_name: string;
    phone_number: string;
    total_amount_to_pay: number;
    deposit_payment: number;
    remaining_payment: number;
    payment_status: "paid" | "pending";
    delivery_fee?: number;
    delivery_type?: "kesimhane" | "toplu-teslimat";
    delivery_location?: string;
    vekalet: "verildi" | "bekleniyor";
    notes?: string;
  };
  section: "personal" | "payment" | "delivery" | "other";
}

export function ShareholderForm({ shareholder, section }: ShareholderFormProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const updatedData = {
        shareholder_name: formData.get("shareholder_name"),
        phone_number: formData.get("phone_number"),
        total_amount_to_pay: Number(formData.get("total_amount_to_pay")),
        deposit_payment: Number(formData.get("deposit_payment")),
        remaining_payment: Number(formData.get("remaining_payment")),
        payment_status: formData.get("payment_status"),
        delivery_fee: Number(formData.get("delivery_fee")) || null,
        delivery_type: formData.get("delivery_type") || null,
        delivery_location: formData.get("delivery_location") || null,
        vekalet: formData.get("vekalet"),
        notes: formData.get("notes") || null,
      };

      const { error } = await supabase
        .from("shareholders")
        .update(updatedData)
        .eq("shareholder_id", shareholder.shareholder_id);

      if (error) throw error;

      toast.success("Hissedar bilgileri güncellendi");
      router.refresh();
    } catch (error) {
      console.error("Error updating shareholder:", error);
      toast.error("Hissedar bilgileri güncellenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("shareholders")
        .delete()
        .eq("shareholder_id", shareholder.shareholder_id);

      if (error) throw error;

      toast.success("Hissedar silindi");
      router.refresh();
      router.push("/kurban-admin/hissedarlar");
    } catch (error) {
      console.error("Error deleting shareholder:", error);
      toast.error("Hissedar silinirken bir hata oluştu");
    }
  };

  const renderPersonalSection = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="shareholder_name">İsim Soyisim</Label>
        <Input
          id="shareholder_name"
          name="shareholder_name"
          defaultValue={shareholder.shareholder_name}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone_number">Telefon</Label>
        <Input
          id="phone_number"
          name="phone_number"
          defaultValue={shareholder.phone_number}
          required
        />
      </div>
    </div>
  );

  const renderPaymentSection = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="total_amount_to_pay">Toplam Tutar (₺)</Label>
        <Input
          id="total_amount_to_pay"
          name="total_amount_to_pay"
          type="number"
          defaultValue={shareholder.total_amount_to_pay}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="deposit_payment">Kapora (₺)</Label>
        <Input
          id="deposit_payment"
          name="deposit_payment"
          type="number"
          defaultValue={shareholder.deposit_payment}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="remaining_payment">Kalan Ödeme (₺)</Label>
        <Input
          id="remaining_payment"
          name="remaining_payment"
          type="number"
          defaultValue={shareholder.remaining_payment}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="payment_status">Ödeme Durumu</Label>
        <Select name="payment_status" defaultValue={shareholder.payment_status}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Tamamlandı</SelectItem>
            <SelectItem value="pending">Bekliyor</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderDeliverySection = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="delivery_type">Teslimat Tipi</Label>
        <Select 
          name="delivery_type" 
          defaultValue={shareholder.delivery_type || "kesimhane"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kesimhane">Kesimhane</SelectItem>
            <SelectItem value="toplu-teslimat">Toplu Teslimat</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {shareholder.delivery_type === "toplu-teslimat" && (
        <div className="grid gap-2">
          <Label htmlFor="delivery_location">Teslimat Noktası</Label>
          <Select 
            name="delivery_location" 
            defaultValue={shareholder.delivery_location}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yenimahalle-camii">Yenimahalle Camii</SelectItem>
              <SelectItem value="kecioren-pazar">Keçiören Pazar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="delivery_fee">Teslimat Ücreti (₺)</Label>
        <Input
          id="delivery_fee"
          name="delivery_fee"
          type="number"
          defaultValue={shareholder.delivery_fee || 0}
        />
      </div>
    </div>
  );

  const renderOtherSection = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="vekalet">Vekalet</Label>
        <Select name="vekalet" defaultValue={shareholder.vekalet}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verildi">Verildi</SelectItem>
            <SelectItem value="bekleniyor">Bekleniyor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={shareholder.notes || ""}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );

  const renderFormButtons = () => (
    <div className="flex justify-between">
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" type="button">
            Hissedarı Sil
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu hissedar kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (section) {
      case "personal":
        return renderPersonalSection();
      case "payment":
        return renderPaymentSection();
      case "delivery":
        return renderDeliverySection();
      case "other":
        return renderOtherSection();
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {renderSection()}
      {section === "other" && renderFormButtons()}
    </form>
  );
} 
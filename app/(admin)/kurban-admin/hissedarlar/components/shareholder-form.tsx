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
    total_amount: number;
    paid_amount: number;
    remaining_payment: number;
    payment_status: "paid" | "pending";
    delivery_fee?: number;
    delivery_type?: "kesimhane" | "toplu-teslimat";
    delivery_location?: string;
    sacrifice_consent: "verildi" | "bekleniyor";
    notes?: string;
  };
  section: "personal" | "payment" | "delivery" | "other";
}

export function ShareholderForm({
  shareholder,
  section,
}: ShareholderFormProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const updatedData = {
        shareholder_name: formData.get("shareholder_name"),
        phone_number: formData.get("phone_number"),
        total_amount: Number(formData.get("total_amount")),
        paid_amount: Number(formData.get("paid_amount")),
        remaining_payment: Number(formData.get("remaining_payment")),
        payment_status: formData.get("payment_status"),
        delivery_fee: Number(formData.get("delivery_fee")) || null,
        delivery_type: formData.get("delivery_type") || null,
        delivery_location: formData.get("delivery_location") || null,
        sacrifice_consent: formData.get("sacrifice_consent"),
        notes: formData.get("notes") || null,
      };

      const { error } = await supabase
        .from("shareholders")
        .update(updatedData)
        .eq("shareholder_id", shareholder.shareholder_id);

      if (error) {
        console.error("Supabase update error:", error);
        toast.error("Güncelleme başarısız", {
          description:
            "Hissedar bilgileri güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
          duration: 3000,
        });
        throw error;
      }

      toast.success("Güncelleme başarılı", {
        description: "Hissedar bilgileri başarıyla güncellendi.",
        duration: 3000,
      });
      router.refresh();
    } catch (error) {
      console.error("Error updating shareholder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      console.log(
        `Attempting to delete shareholder with ID: ${shareholder.shareholder_id}`
      );

      const { error } = await supabase
        .from("shareholders")
        .delete()
        .eq("shareholder_id", shareholder.shareholder_id);

      if (error) {
        console.error("Supabase deletion error:", error);
        toast.error("Silme işlemi başarısız", {
          description:
            "Hissedar silinirken bir hata oluştu. Lütfen tekrar deneyin.",
          duration: 3000,
        });
        throw error;
      }

      console.log("Shareholder deleted successfully");
      toast.success("Silme işlemi başarılı", {
        description: `${shareholder.shareholder_name} isimli hissedar başarıyla silindi.`,
        duration: 3000,
      });

      setShowDeleteDialog(false);
      router.refresh();
      router.push("/kurban-admin/hissedarlar");
    } catch (error) {
      console.error("Detailed deletion error:", error);
    } finally {
      setIsDeleting(false);
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
        <Label htmlFor="total_amount">Toplam Tutar (₺)</Label>
        <Input
          id="total_amount"
          name="total_amount"
          type="number"
          defaultValue={shareholder.total_amount}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="paid_amount">Kapora (₺)</Label>
        <Input
          id="paid_amount"
          name="paid_amount"
          type="number"
          defaultValue={shareholder.paid_amount}
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
              <SelectItem value="yenimahalle-camii">
                Yenimahalle Camii
              </SelectItem>
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
        <Label htmlFor="sacrifice_consent">sacrifice_consent</Label>
        <Select
          name="sacrifice_consent"
          defaultValue={shareholder.sacrifice_consent}
        >
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
          <Button variant="destructive" type="button" disabled={isDeleting}>
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
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting || isDeleting}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting || isDeleting}>
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

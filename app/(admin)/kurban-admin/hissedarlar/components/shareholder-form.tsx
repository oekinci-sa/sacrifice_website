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
import { formatPhoneForDB, formatPhoneForDisplay } from "@/utils/formatters";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
    delivery_type?: "kesimhane" | "toplu-teslimat" | "toplu-teslim-noktasi";
    delivery_location?: string;
    sacrifice_consent: boolean;
    notes?: string;
  };
  section: "personal" | "payment" | "delivery" | "other";
}

const formSchema = z.object({
  name: z.string().min(1, "Ad soyad zorunludur"),
  phone: z.string()
    .regex(/^0/, "Telefon numarası 0 ile başlamalıdır")
    .refine(
      (val) => val.replace(/\s/g, '').length === 11,
      "Telefon numarası 11 haneli olmalıdır"
    ),
  delivery_location: z.string().min(1, "Teslimat noktası seçiniz"),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function ShareholderForm({
  shareholder,
  section,
}: ShareholderFormProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: shareholder.shareholder_name,
      phone: shareholder.phone_number.startsWith("+90")
        ? "0" + shareholder.phone_number.slice(3)
        : shareholder.phone_number,
      delivery_location: shareholder.delivery_location,
      notes: shareholder.notes || "",
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const updatedData = {
        shareholder_name: formData.get("shareholder_name"),
        phone_number: formatPhoneForDB(formData.get("phone_number") as string),
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
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-3">
        <Label htmlFor="shareholder_name" className="text-base">İsim Soyisim</Label>
        <Input
          id="shareholder_name"
          name="shareholder_name"
          defaultValue={shareholder.shareholder_name}
          required
          className="bg-[#F7F7F8] border-0 md:text-[16px]"
        />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="phone_number" className="text-base">Telefon</Label>
        <Input
          id="phone_number"
          name="phone_number"
          defaultValue={formatPhoneForDisplay(shareholder.phone_number)}
          required
          placeholder="05555555555"
          className="bg-[#F7F7F8] border-0 md:text-[16px]"
        />
      </div>
    </div>
  );

  const renderPaymentSection = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-3">
        <Label htmlFor="total_amount" className="text-base">Toplam Tutar (₺)</Label>
        <Input
          id="total_amount"
          name="total_amount"
          type="number"
          defaultValue={shareholder.total_amount}
          required
          className="bg-[#F7F7F8] border-0 md:text-[16px]"
        />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="paid_amount" className="text-base">Ödenen Tutar (₺)</Label>
        <Input
          id="paid_amount"
          name="paid_amount"
          type="number"
          defaultValue={shareholder.paid_amount}
          required
          className="bg-[#F7F7F8] border-0 md:text-[16px]"
        />
      </div>
    </div>
  );

  const renderDeliverySection = () => (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid gap-3">
        <Label htmlFor="delivery_type" className="text-base">Teslimat Şekli</Label>
        <Select
          name="delivery_type"
          defaultValue={shareholder.delivery_type || "kesimhane"}
        >
          <SelectTrigger className="bg-[#F7F7F8] border-0 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kesimhane" className="text-base">Kesimhane</SelectItem>
            <SelectItem value="toplu-teslim-noktasi" className="text-base">Toplu Teslim Noktası</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {shareholder.delivery_type === "toplu-teslim-noktasi" && (
        <div className="grid gap-3">
          <Label htmlFor="delivery_location" className="text-base">Teslimat Noktası</Label>
          <Select
            name="delivery_location"
            defaultValue={shareholder.delivery_location}
          >
            <SelectTrigger className="bg-[#F7F7F8] border-0 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yenimahalle-pazar-yeri" className="text-base">Yenimahalle Pazar Yeri</SelectItem>
              <SelectItem value="kecioren-otoparki" className="text-base">Keçiören Otoparkı</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const renderOtherSection = () => (
    <div className="space-y-4">
      <div className="grid gap-3">
        <Label htmlFor="sacrifice_consent" className="text-base">Vekalet</Label>
        <Select
          name="sacrifice_consent"
          defaultValue={shareholder.sacrifice_consent}
        >
          <SelectTrigger className="bg-[#F7F7F8] border-0 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verildi" className="text-base">Verildi</SelectItem>
            <SelectItem value="bekleniyor" className="text-base">Bekleniyor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3">
        <Label htmlFor="notes" className="text-base">Notlar</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={shareholder.notes}
          className="bg-[#F7F7F8] border-0 text-base"
        />
      </div>
    </div>
  );

  return (
    <>
      {section === "personal" && renderPersonalSection()}
      {section === "payment" && renderPaymentSection()}
      {section === "delivery" && renderDeliverySection()}
      {section === "other" && renderOtherSection()}
    </>
  );
}

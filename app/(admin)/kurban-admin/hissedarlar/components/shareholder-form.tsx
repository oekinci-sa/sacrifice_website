"use client";

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
import { formatPhoneForDisplay } from "@/utils/formatters";

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

export function ShareholderForm({
  shareholder,
  section,
}: ShareholderFormProps) {

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
          defaultValue={shareholder.sacrifice_consent ? "true" : "false"}
        >
          <SelectTrigger className="bg-[#F7F7F8] border-0 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true" className="text-base">Verildi</SelectItem>
            <SelectItem value="false" className="text-base">Bekleniyor</SelectItem>
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

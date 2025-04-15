"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { addDays } from "date-fns";
import { ProgressBar } from "./ProgressBar";

interface PaymentDetailsProps {
  shareholderInfo: shareholderSchema;
  isEditing: boolean;
  editFormData?: Partial<shareholderSchema>;
  handleChange?: (field: string, value: string | number | boolean) => void;
  sectionClass: string;
  labelClass: string;
  valueClass: string;
}

export function PaymentDetails({
  shareholderInfo,
  isEditing,
  editFormData,
  handleChange,
  labelClass,
  valueClass
}: PaymentDetailsProps) {
  // Son kapora ödeme tarihi (kayıt tarihinden 3 gün sonra)
  const lastDepositDate = addDays(new Date(shareholderInfo.purchase_time), 3);

  return (
    <div className="md:w-1/2 p-6">
      <h3 className="text-lg md:text-xl font-semibold mb-4">Ödeme Detayları</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className={labelClass}>Son kapora ödeme tarihi</p>
          <div className="flex items-center gap-2">
            <p className={`${valueClass} text-sm md:text-base`}>{lastDepositDate.toLocaleDateString("tr-TR")}</p>
            {shareholderInfo.paid_amount >= 2000 && (
              <span className="text-[#39C645] text-xs md:text-sm">• Ödeme yapıldı</span>
            )}
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className={labelClass}>Toplam Ücret</p>
          <p className="text-xl md:text-2xl font-semibold">
            {new Intl.NumberFormat("tr-TR", {
              style: "currency",
              currency: "TRY",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(shareholderInfo.total_amount)}
          </p>
        </div>

        <div className="col-span-2">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div className="flex items-center gap-2">
                <p className={`${valueClass} text-sm md:text-base`}>Ödeme Miktarı:</p>
                {isEditing && editFormData && handleChange ? (
                  <Input
                    type="number"
                    value={editFormData.paid_amount}
                    onChange={(e) => handleChange('paid_amount', Number(e.target.value))}
                    className="w-32"
                  />
                ) : (
                  <p className={valueClass}>
                    {new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(shareholderInfo.paid_amount)}
                  </p>
                )}
              </div>
              <p className={cn(
                "text-xs md:text-sm font-medium",
                {
                  "text-[#D22D2D]": shareholderInfo.paid_amount < 2000,
                  "text-[#F9BC06]": shareholderInfo.paid_amount >= 2000 && shareholderInfo.remaining_payment > 0,
                  "text-[#39C645]": shareholderInfo.remaining_payment <= 0,
                }
              )}>
                {shareholderInfo.paid_amount < 2000
                  ? "Kapora Bekleniyor"
                  : shareholderInfo.remaining_payment > 0
                    ? "Tüm Ödeme Bekleniyor"
                    : "Ödeme Tamamlandı"}
              </p>
            </div>
            <ProgressBar
              paidAmount={shareholderInfo.paid_amount}
              totalAmount={shareholderInfo.total_amount}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 
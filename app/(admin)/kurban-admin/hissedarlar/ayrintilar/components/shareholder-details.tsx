"use client";

import { shareholderSchema } from "@/types";
import { PaymentDetails } from "./payment-details";
import { SacrificeInfo } from "./sacrifice-info";
import { ShareholderInfo } from "./shareholder-info";

interface ShareholderDetailsProps {
  shareholderInfo: shareholderSchema;
  isEditing?: boolean;
  editFormData?: Partial<shareholderSchema>;
  handleChange?: (field: string, value: string | number | boolean) => void;
  onSave?: (updatedData: Partial<shareholderSchema>) => void;
  onCancel?: () => void;
}

export function ShareholderDetails({
  shareholderInfo,
  isEditing = false,
  editFormData,
  handleChange,
  onSave,
}: ShareholderDetailsProps) {

  const labelClass = "text-sm text-muted-foreground";
  const valueClass = "font-medium";

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (onSave && editFormData) onSave(editFormData);
    }}>
      <div className="w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shareholder Info Component */}
          {isEditing && editFormData && handleChange ? (
            <ShareholderInfo
              shareholderInfo={shareholderInfo}
              isEditing={isEditing}
              editFormData={editFormData}
              handleChange={handleChange}
              sectionClass="p-6"
              labelClass={labelClass}
              valueClass={valueClass}
            />
          ) : (
            <ShareholderInfo
              shareholderInfo={shareholderInfo}
              isEditing={false}
              sectionClass="p-6"
              labelClass={labelClass}
              valueClass={valueClass}
            />
          )}

          {/* Sacrifice Info Component */}
          <SacrificeInfo
            shareholderInfo={shareholderInfo}
            sectionClass="p-6"
            labelClass={labelClass}
            valueClass={valueClass}
          />
        </div>

        {/* Payment Details Component */}
        {isEditing && editFormData && handleChange ? (
          <PaymentDetails
            shareholderInfo={shareholderInfo}
            isEditing={isEditing}
            editFormData={editFormData}
            handleChange={handleChange}
            sectionClass="p-6"
            labelClass={labelClass}
            valueClass={valueClass}
          />
        ) : (
          <PaymentDetails
            shareholderInfo={shareholderInfo}
            isEditing={false}
            sectionClass="p-6"
            labelClass={labelClass}
            valueClass={valueClass}
          />
        )}
      </div>
    </form>
  );
} 
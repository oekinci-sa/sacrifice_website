"use client";

import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { shareholderSchema } from "@/types";
import { useState } from "react";
import { ShareholderInfo } from "./shareholder-info";
import { SacrificeInfo } from "./sacrifice-info";
import { PaymentDetails } from "./payment-details";

interface ShareholderDetailsProps {
  shareholderInfo: shareholderSchema;
  isEditing?: boolean;
  editFormData?: any;
  handleChange?: (field: string, value: any) => void;
  onSave?: (updatedData: Partial<shareholderSchema>) => void;
  onCancel?: () => void;
}

export function ShareholderDetails({ 
  shareholderInfo, 
  isEditing = false,
  editFormData,
  handleChange,
  onSave,
  onCancel
}: ShareholderDetailsProps) {
  const { toast } = useToast();
  
  // Form state for editable fields
  const [editFormDataState, setEditFormData] = useState({
    shareholder_name: shareholderInfo.shareholder_name,
    phone_number: shareholderInfo.phone_number,
    delivery_location: shareholderInfo.delivery_location,
    sacrifice_consent: shareholderInfo.sacrifice_consent,
    paid_amount: shareholderInfo.paid_amount,
    notes: shareholderInfo.notes || "",
  });

  // Function to update form data
  const handleChangeState = (field: string, value: any) => {
    // Special validation for paid_amount to prevent exceeding total amount
    if (field === 'paid_amount') {
      if (value > shareholderInfo.total_amount) {
        toast({
          title: "Uyarı",
          description: "Ödeme tutarı toplam tutardan fazla olamaz.",
          variant: "destructive"
        });
        value = shareholderInfo.total_amount;
      }
    }
    
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle save button click - now will be triggered from the parent
  const handleSave = () => {
    // Format the phone number if needed
    let formattedPhone = editFormDataState.phone_number;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+90' + formattedPhone.replace(/\D/g, '').substring(1);
    }

    // Calculate remaining payment
    const remaining = shareholderInfo.total_amount - editFormDataState.paid_amount;

    // Prepare the data to save
    const dataToSave = {
      ...editFormDataState,
      phone_number: formattedPhone,
      remaining_payment: remaining >= 0 ? remaining : 0
    };

    if (onSave) onSave(dataToSave);
  };

  const sectionClass = "border border-gray-200 rounded-lg p-6";
  const labelClass = "text-sm text-muted-foreground";
  const valueClass = "font-medium";

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (onSave) onSave(editFormData);
    }}>
      <div className="w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shareholder Info Component */}
          <ShareholderInfo 
            shareholderInfo={shareholderInfo}
            isEditing={isEditing}
            editFormData={editFormData}
            handleChange={handleChange}
            sectionClass="p-6"
            labelClass={labelClass}
            valueClass={valueClass}
          />

          {/* Sacrifice Info Component */}
          <SacrificeInfo 
            shareholderInfo={shareholderInfo}
            sectionClass="p-6"
            labelClass={labelClass}
            valueClass={valueClass}
          />
        </div>

        {/* Payment Details Component */}
        <PaymentDetails
          shareholderInfo={shareholderInfo}
          isEditing={isEditing}
          editFormData={editFormData}
          handleChange={handleChange}
          sectionClass="p-6"
          labelClass={labelClass}
          valueClass={valueClass}
        />
      </div>
    </form>
  );
} 
"use client";

import {
  getDeliveryLocationFromSelection,
  getDeliverySelectionFromLocation,
  requiresSecondPhoneForDelivery,
} from "@/lib/delivery-options";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import {
  useCancelReservation,
  useUpdateShareCount,
} from "@/hooks/useReservations";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { FormData as StoreFormData, useShareSelectionFlowStore } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";

interface ExtendedFormData extends StoreFormData {
  is_purchaser?: boolean;
}

export const formSchema = z.object({
  name: z.string().min(1, "Ad soyad zorunludur"),
  phone: z.string()
    .refine(val => val.startsWith("0"), "Telefon numarası 0 ile başlamalıdır")
    .refine(val => {
      const digitsOnly = val.replace(/\D/g, "");
      return digitsOnly.length === 11;
    }, "Telefon numarası 11 haneli olmalıdır")
    .refine(val => val.startsWith("05"), "Telefon numarası 05XX ile başlamalıdır"),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
  delivery_location: z.string().min(1, "Teslimat noktası seçiniz"),
  is_purchaser: z.boolean().optional().default(false),
});

export type FormErrors = {
  name?: string[];
  phone?: string[];
  email?: string[];
  delivery_location?: string[];
  delivery_address?: string[];
  second_phone?: string[];
  is_purchaser?: string[];
};

export function useCheckoutForm(
  setLastInteractionTime: (time: number) => void,
  onBack: (shareCount: number) => void
) {
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [errors, setErrors] = useState<FormErrors[]>([]);
  const [userAction, setUserAction] = useState<"confirm" | "cancel" | null>(null);
  const [showLastShareDialog, setShowLastShareDialog] = useState(false);
  const [isAddingShare, setIsAddingShare] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const branding = useTenantBranding();
  const {
    selectedSacrifice,
    formData,
    setFormData,
    resetStore,
    goToStep: storeGoToStep,
  } = useShareSelectionFlowStore();

  const extendedFormData = formData as ExtendedFormData[];
  const transaction_id = useReservationIDStore((state) => state.transaction_id);
  const generateNewTransactionId = useReservationIDStore((state) => state.generateNewTransactionId);
  const { sacrifices } = useSacrificeStore();
  const currentSacrifice = sacrifices?.find(
    (s) => s.sacrifice_id === selectedSacrifice?.sacrifice_id
  );
  const updateShareCount = useUpdateShareCount();
  const cancelReservation = useCancelReservation();
  const { toast } = useToast();

  const handleInputChange = (
    index: number,
    field: keyof ExtendedFormData,
    value: string
  ) => {
    setLastInteractionTime(Date.now());
    const newFormData = [...extendedFormData];
    newFormData[index] = { ...newFormData[index], [field]: value };
    setFormData(newFormData as StoreFormData[]);
  };

  const handleInputBlur = (
    index: number,
    field: keyof ExtendedFormData,
    value: string
  ) => {
    setLastInteractionTime(Date.now());
    const newErrors = [...errors];
    if (!newErrors[index]) newErrors[index] = {};

    if (!value) {
      switch (field) {
        case "name":
          newErrors[index].name = ["Ad soyad zorunludur"];
          break;
        case "phone":
          newErrors[index].phone = ["Telefon numarası zorunludur"];
          break;
        case "delivery_location":
          newErrors[index].delivery_location = ["Teslimat noktası seçiniz"];
          break;
        case "second_phone":
          delete newErrors[index].second_phone;
          break;
        case "email":
          delete newErrors[index].email;
          break;
      }
      setErrors(newErrors);
      return;
    }

    // Elya: Adrese teslim adres validasyonu SADECE handleContinue'da yapılır, blur'da değil
    if (field === "delivery_location") {
      delete newErrors[index].delivery_location;
      setErrors(newErrors);
      return;
    }

    if (field === "email") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[index].email = ["Geçerli bir e-posta giriniz"];
      } else {
        delete newErrors[index].email;
      }
      setErrors(newErrors);
      return;
    }

    if (field === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (!value.startsWith("05") && !value.startsWith("5")) {
        newErrors[index].phone = ["Telefon numarası 05XX veya 5XX ile başlamalıdır"];
      } else if (value.startsWith("05") && digitsOnly.length !== 11) {
        newErrors[index].phone = ["Lütfen telefon numaranızı kontrol ediniz"];
      } else if (value.startsWith("5") && digitsOnly.length !== 10) {
        newErrors[index].phone = ["Lütfen telefon numaranızı kontrol ediniz"];
      } else {
        delete newErrors[index].phone;
      }
      setErrors(newErrors);
      return;
    }

    if (field === "second_phone") {
      const digitsOnly = value.replace(/\D/g, "");
      const phoneDigits = (extendedFormData[index]?.phone ?? "").replace(/\D/g, "");
      if (!value.startsWith("05") && !value.startsWith("5")) {
        newErrors[index].second_phone = ["Telefon numarası 05XX veya 5XX ile başlamalıdır"];
      } else if (value.startsWith("05") && digitsOnly.length !== 11) {
        newErrors[index].second_phone = ["Lütfen telefon numaranızı kontrol ediniz"];
      } else if (value.startsWith("5") && digitsOnly.length !== 10) {
        newErrors[index].second_phone = ["Lütfen telefon numaranızı kontrol ediniz"];
      } else if (digitsOnly && phoneDigits && digitsOnly === phoneDigits) {
        newErrors[index].second_phone = ["İkinci telefon numarası birinciden farklı olmalıdır"];
      } else {
        delete newErrors[index].second_phone;
      }
      setErrors(newErrors);
      return;
    }

    try {
      const fieldSchema = formSchema.shape[field];
      fieldSchema.parse(value);
      delete newErrors[index][field];
      setErrors(newErrors);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors[index][field] = [error.errors[0].message];
        setErrors(newErrors);
      }
    }
  };

  const handleSelectChange = (
    index: number,
    field: keyof ExtendedFormData,
    value: string
  ) => {
    setLastInteractionTime(Date.now());
    const newFormData = [...extendedFormData];
    newFormData[index] = { ...newFormData[index], [field]: value };
    if (field === "delivery_location") {
      if (!requiresSecondPhoneForDelivery(branding.logo_slug, value)) {
        newFormData[index].second_phone = "";
      }
    }
    setFormData(newFormData as StoreFormData[]);
    handleInputBlur(index, field, value);
  };

  const handleIsPurchaserChange = (index: number, checked: boolean) => {
    setLastInteractionTime(Date.now());
    const newFormData = [...extendedFormData];
    const newErrors = [...errors];

    if (checked) {
      newFormData.forEach((data, i) => {
        newFormData[i] = { ...data, is_purchaser: i === index };
        if (newErrors[i]?.is_purchaser) delete newErrors[i].is_purchaser;
      });
    } else {
      newFormData[index] = { ...newFormData[index], is_purchaser: false };
    }

    setFormData(newFormData as StoreFormData[]);
    setErrors(newErrors);
  };

  const handleAddShareholder = async () => {
    if (!selectedSacrifice || !currentSacrifice?.empty_share || isAddingShare || updateShareCount.isPending) return;

    try {
      setIsAddingShare(true);
      const newShareCount = formData.length + 1;
      await updateShareCount.mutateAsync({
        transaction_id,
        share_count: newShareCount,
        operation: "add",
      });
      const defaultDeliveryLocation = getDeliveryLocationFromSelection(branding.logo_slug, "Kesimhane");
      const newShareholderData: ExtendedFormData = {
        name: "",
        phone: "",
        email: "",
        delivery_location: defaultDeliveryLocation,
        second_phone: "",
        is_purchaser: false,
      };
      setFormData([...formData, newShareholderData] as StoreFormData[]);
      setErrors([...errors, {}]);
    } catch {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hissedar eklenirken bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsAddingShare(false);
    }
  };

  const handleRemoveShareholder = async (index: number) => {
    if (formData.length === 1) {
      setShowLastShareDialog(true);
      return;
    }
    if (!selectedSacrifice || updateShareCount.isPending) return;

    try {
      const newShareCount = formData.length - 1;
      await updateShareCount.mutateAsync({
        transaction_id,
        share_count: newShareCount,
        operation: "remove",
      });
      const newFormData = [...extendedFormData];
      newFormData.splice(index, 1);
      setFormData(newFormData as StoreFormData[]);
      const newErrors = [...errors];
      newErrors.splice(index, 1);
      setErrors(newErrors);
    } catch {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hissedar silinirken bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  const confirmBack = async () => {
    if (isCanceling) return;
    try {
      setIsCanceling(true);
      await cancelReservation.mutateAsync({ transaction_id });
      setUserAction("confirm");
      setShowBackDialog(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.",
      });
      setShowBackDialog(false);
    } finally {
      setIsCanceling(false);
    }
    // CRITICAL: resetStore + generateNewTransactionId must ALWAYS be called together
    // before navigating back to selection. Without generateNewTransactionId, the next
    // reservation will reuse the old transaction_id and the 15-min timer will resume
    // from where the previous session left off instead of starting fresh.
    resetStore();
    generateNewTransactionId();
    storeGoToStep("selection");
  };

  const cancelBack = () => {
    setUserAction("cancel");
    setShowBackDialog(false);
  };

  useEffect(() => {
    if (userAction === "confirm") {
      onBack(formData.length);
    }
    setUserAction(null);
  }, [userAction, onBack, formData]);

  const handleLastShareAction = async (action: "return" | "stay") => {
    if (action === "return" && selectedSacrifice) {
      if (isCanceling) return;
      try {
        setIsCanceling(true);
        await cancelReservation.mutateAsync({ transaction_id });
        // CRITICAL: see confirmBack comment — same invariant applies here.
        resetStore();
        generateNewTransactionId();
        storeGoToStep("selection");
      } catch {
        // ignore
      } finally {
        setShowLastShareDialog(false);
        setIsCanceling(false);
      }
    } else {
      setShowLastShareDialog(false);
    }
  };

  const handleContinue = () => {
    let hasFormErrors = false;
    let hasPurchaserError = false;
    const newErrors: FormErrors[] = formData.map(() => ({}));

    formData.forEach((data, index) => {
      try {
        const { name, phone, email, delivery_location, second_phone } = data;
        formSchema.omit({ is_purchaser: true }).parse({ name, phone, email: email ?? "", delivery_location });

        const selection = getDeliverySelectionFromLocation(branding.logo_slug, delivery_location);
        if (requiresSecondPhoneForDelivery(branding.logo_slug, delivery_location)) {
          const digitsPhone = (phone ?? "").replace(/\D/g, "");
          const digitsSecond = (second_phone ?? "").replace(/\D/g, "");
          if (!second_phone || !second_phone.trim()) {
            newErrors[index].second_phone = [
              "Bu teslimat seçeneği için ikinci telefon numarası zorunludur",
            ];
            hasFormErrors = true;
          } else if (digitsSecond.length !== 11 || !second_phone.startsWith("05")) {
            newErrors[index].second_phone = ["Geçerli bir telefon numarası giriniz (05XX XXX XX XX)"];
            hasFormErrors = true;
          } else if (digitsPhone && digitsSecond === digitsPhone) {
            newErrors[index].second_phone = ["İkinci telefon numarası birinciden farklı olmalıdır"];
            hasFormErrors = true;
          }
        }

        // Elya: Adrese teslim seçildiyse adres zorunlu, en az 20 karakter (sadece Devam et'te kontrol)
        // Hata teslimat adresi alanının altında gösterilir (delivery_address)
        if (branding.logo_slug === "elya-hayvancilik") {
          if (selection === "Adrese teslim") {
            if (!delivery_location || delivery_location === "-" || delivery_location === "Adrese teslim") {
              newErrors[index].delivery_address = ["Lütfen teslimat adresinizi giriniz"];
              hasFormErrors = true;
            } else if (delivery_location.trim().length < 20) {
              newErrors[index].delivery_address = ["Adres en az 20 karakter olmalıdır"];
              hasFormErrors = true;
            }
          }
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            if (err.path[0]) {
              const field = err.path[0] as keyof FormErrors;
              if (!newErrors[index][field]) newErrors[index][field] = [];
              newErrors[index][field] = [err.message];
              hasFormErrors = true;
            }
          });
        }
      }
    });

    const hasPurchaser =
      formData.length > 1 ? extendedFormData.some((data) => data.is_purchaser === true) : true;
    if (formData.length > 1 && !hasPurchaser) hasPurchaserError = true;

    setErrors(newErrors);

    if (hasFormErrors) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen tüm alanları doğru şekilde doldurunuz",
      });
      return;
    }
    if (hasPurchaserError) {
      toast({
        variant: "destructive",
        title: "İşlemi Yapan Kişi Seçilmedi",
        description: "Lütfen devam etmeden önce, işlemi gerçekleştiren hissedarı işaretleyiniz.",
      });
      return;
    }

    storeGoToStep("confirmation");
  };

  return {
    errors,
    extendedFormData,
    currentSacrifice,
    showBackDialog,
    setShowBackDialog,
    showLastShareDialog,
    setShowLastShareDialog,
    isAddingShare,
    isCanceling,
    cancelReservation,
    updateShareCount,
    handleInputChange,
    handleInputBlur,
    handleSelectChange,
    handleIsPurchaserChange,
    handleAddShareholder,
    handleRemoveShareholder,
    confirmBack,
    cancelBack,
    handleLastShareAction,
    handleContinue,
  };
}

import { useToast } from "@/components/ui/use-toast";
import { useCompleteReservation } from "@/hooks/useReservations";
import { useCreateShareholders } from "@/hooks/useShareholders";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useValidateShareholders } from "@/hooks/useValidateShareholders";
import {
  getDeliveryFeeForLocation,
  getDeliveryLocationFromSelection,
  getDeliverySelectionFromLocation,
} from "@/lib/delivery-options";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { sacrificeSchema } from "@/types";
import { formatPhoneForDB, toTitleCase } from "@/utils/formatters";
import { useCallback, useState } from "react";

interface ShareholderInput {
  name: string;
  phone: string;
  email?: string;
  delivery_location: string;
  is_purchaser?: boolean;
  paid_amount?: number;
}

export function useShareholderSummaryApproval(
  sacrifice: sacrificeSchema | null,
  shareholders: ShareholderInput[],
  onApprove: () => void
) {
  const [showSecurityCodeDialog, setShowSecurityCodeDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const createShareholdersMutation = useCreateShareholders();
  const completeReservationMutation = useCompleteReservation();
  const validateShareholdersMutation = useValidateShareholders();
  const { transaction_id } = useReservationIDStore();
  const { toast } = useToast();
  const branding = useTenantBranding();

  const purchaserIndex = shareholders.findIndex(
    (s) => s.is_purchaser === true
  );
  const effectivePurchaserIndex =
    purchaserIndex === -1 && shareholders.length === 1 ? 0 : purchaserIndex;

  const handleOpenSecurityCodeDialog = useCallback(() => {
    setShowSecurityCodeDialog(true);
    setShowTermsDialog(false);
  }, []);

  const handleSecurityCodeSet = useCallback((code: string) => {
    setSecurityCode(code);
    setShowSecurityCodeDialog(false);
    setShowTermsDialog(true);
  }, []);

  const handleBackToSecurityCode = useCallback(() => {
    setShowTermsDialog(false);
    setShowSecurityCodeDialog(true);
  }, []);

  const handleTermsConfirm = useCallback(async () => {
    if (isProcessing || !transaction_id) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem zaten devam ediyor veya işlem kimliği eksik.",
      });
      return;
    }
    setIsProcessing(true);

    const purchaserName = toTitleCase(
      effectivePurchaserIndex !== -1
        ? shareholders[effectivePurchaserIndex].name
        : shareholders[0]?.name ?? ""
    );

    try {
      if (!sacrifice?.sacrifice_id) {
        throw new Error("Kurbanlık ID bilgisi eksik!");
      }

      const validateMethod =
        validateShareholdersMutation?.mutateAsync ||
        (validateShareholdersMutation as { validate?: (a: unknown) => Promise<unknown> })?.validate;
      if (!validateShareholdersMutation || !validateMethod) {
        throw new Error("Hissedar doğrulama fonksiyonu bulunamadı!");
      }

      await validateMethod({
        sacrificeId: sacrifice.sacrifice_id,
        newShareholderCount: shareholders.length,
      });

      const shareholderDataForApi = shareholders.map((shareholder) => {
        const deliveryLocation =
          shareholder.delivery_location === "Kesimhane"
            ? getDeliveryLocationFromSelection(branding.logo_slug, "Kesimhane")
            : shareholder.delivery_location;
        const delivery_type = getDeliverySelectionFromLocation(
          branding.logo_slug,
          deliveryLocation
        );
        const delivery_fee = getDeliveryFeeForLocation(
          branding.logo_slug,
          deliveryLocation
        );
        const share_price = sacrifice?.share_price || 0;
        const totalAmount = share_price + delivery_fee;
        const paidAmount =
          shareholder.paid_amount !== undefined ? shareholder.paid_amount : 0;
        const remainingPayment = totalAmount - paidAmount;

        return {
          shareholder_name: toTitleCase(shareholder.name),
          phone_number: formatPhoneForDB(shareholder.phone),
          email: shareholder.email?.trim() || undefined,
          transaction_id,
          sacrifice_id: sacrifice?.sacrifice_id || "",
          delivery_fee,
          delivery_location: deliveryLocation,
          delivery_type,
          security_code: securityCode,
          purchased_by: purchaserName,
          last_edited_by: purchaserName,
          sacrifice_consent: false,
          total_amount: totalAmount,
          remaining_payment: remainingPayment,
        };
      });

      const createMethod =
        createShareholdersMutation?.mutateAsync ||
        createShareholdersMutation?.mutate;
      if (!createShareholdersMutation || !createMethod) {
        throw new Error("Hissedar kaydetme fonksiyonu bulunamadı!");
      }
      await createMethod(shareholderDataForApi);

      const completeMethod =
        completeReservationMutation?.mutateAsync ||
        completeReservationMutation?.mutate;
      if (!completeReservationMutation || !completeMethod) {
        throw new Error("Rezervasyon tamamlama fonksiyonu bulunamadı!");
      }
      await completeMethod({ transaction_id });

      setShowTermsDialog(false);
      onApprove();
    } catch (_error) {
      setShowTermsDialog(false);
      if (_error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description:
            _error.message || "Hissedarlar kaydedilirken bir hata oluştu.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hissedarlar kaydedilirken bir hata oluştu.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    transaction_id,
    sacrifice,
    shareholders,
    effectivePurchaserIndex,
    securityCode,
    branding.logo_slug,
    onApprove,
    toast,
    validateShareholdersMutation,
    createShareholdersMutation,
    completeReservationMutation,
  ]);

  return {
    showSecurityCodeDialog,
    setShowSecurityCodeDialog,
    showTermsDialog,
    setShowTermsDialog,
    securityCode,
    isProcessing,
    effectivePurchaserIndex,
    handleOpenSecurityCodeDialog,
    handleSecurityCodeSet,
    handleBackToSecurityCode,
    handleTermsConfirm,
  };
}

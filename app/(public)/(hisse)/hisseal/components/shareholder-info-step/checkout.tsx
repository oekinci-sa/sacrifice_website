"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sacrificeSchema } from "@/types";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import {
  useUpdateShareCount,
  useCancelReservation,
} from "@/hooks/useReservations";
import SacrificeInfo from "./sacrifice-info";
import ShareholderForm from "./shareholder-form";
import TripleButtons from "../common/triple-buttons";
import { cn } from "@/lib/utils";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useShareSelectionFlowStore } from "@/stores/only-public-pages/useShareSelectionFlowStore";

const formSchema = z.object({
  name: z.string().min(1, "Ad soyad zorunludur"),
  phone: z.string().refine((val) => {
    const digitsOnly = val.replace(/\D/g, "");
    if (val.startsWith("05")) {
      return digitsOnly.length === 11;
    }
    return val.startsWith("5") && digitsOnly.length === 10;
  }, "Lütfen telefon numaranızı kontrol ediniz"),
  delivery_location: z.string().min(1, "Teslimat noktası seçiniz"),
  is_purchaser: z.boolean().optional().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface CheckoutProps {
  onApprove: () => void;
  onBack: (shareCount: number) => void;
  setLastInteractionTime: (time: number) => void;
}

type FormErrors = {
  name?: string[];
  phone?: string[];
  delivery_location?: string[];
  is_purchaser?: string[];
};

export default function Checkout({
  onBack,
  setLastInteractionTime,
}: CheckoutProps) {
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [errors, setErrors] = useState<FormErrors[]>([]);
  const [userAction, setUserAction] = useState<"confirm" | "cancel" | null>(
    null
  );
  const [showLastShareDialog, setShowLastShareDialog] = useState(false);
  const [isAddingShare, setIsAddingShare] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Get sacrifices data from Zustand store
  const { sacrifices, refetchSacrifices } = useSacrificeStore();
  
  // Get UI state from ShareSelectionFlowStore
  const { 
    selectedSacrifice, 
    formData, 
    setFormData,
    resetStore,
    goToStep
  } = useShareSelectionFlowStore();
  
  const currentSacrifice = sacrifices?.find(
    (s) => s.sacrifice_id === selectedSacrifice?.sacrifice_id
  );

  // Refresh data when the component mounts or when users revisit it
  useEffect(() => {
    console.log("Checkout component - Fetching fresh sacrifice data");
    refetchSacrifices();
  }, [refetchSacrifices]);

  // Also refresh data when the formData changes
  useEffect(() => {
    console.log("formData changed - Refreshing sacrifice data");
    refetchSacrifices();
  }, [formData.length, refetchSacrifices]);

  // Mutation hook'ları
  const updateShareCount = useUpdateShareCount();
  const cancelReservation = useCancelReservation();

  // Reservation store'dan transaction_id'yi alalım
  const transaction_id = useReservationIDStore((state) => state.transaction_id);

  const { toast } = useToast();

  const handleInputChange = (
    index: number,
    field: keyof FormData,
    value: string
  ) => {
    setLastInteractionTime(Date.now()); // Reset timeout
    const newFormData = [...formData];
    newFormData[index] = {
      ...newFormData[index],
      [field]: value,
    };
    setFormData(newFormData);
  };

  const handleInputBlur = (
    index: number,
    field: keyof FormData,
    value: string
  ) => {
    setLastInteractionTime(Date.now()); // Reset timeout
    const newErrors = [...errors];
    if (!newErrors[index]) newErrors[index] = {};

    // Boş alan kontrolü
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
      }
      setErrors(newErrors);
      return;
    }

    // Telefon numarası için özel kontroller
    if (field === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (!value.startsWith("05") && !value.startsWith("5")) {
        newErrors[index].phone = [
          "Telefon numarası 05XX veya 5XX ile başlamalıdır",
        ];
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

    // Diğer alanlar için Zod validasyonu
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

  // Select değişikliğini yakalayalım
  const handleSelectChange = (
    index: number,
    field: keyof FormData,
    value: string
  ) => {
    console.log("handleSelectChange called with:", { index, field, value });
    setLastInteractionTime(Date.now()); // Reset timeout
    const newFormData = [...formData];
    newFormData[index] = {
      ...newFormData[index],
      [field]: value,
    };
    console.log("Updated form data:", newFormData);
    setFormData(newFormData);
    handleInputBlur(index, field, value);
  };

  // Yeni "İşlemi yapan kişi" durumunu yönetmek için fonksiyon
  const handleIsPurchaserChange = (index: number, checked: boolean) => {
    setLastInteractionTime(Date.now()); // Reset timeout

    const newFormData = [...formData];
    const newErrors = [...errors];

    if (checked) {
      // Eğer yeni bir seçim yapıldıysa, önce tüm diğer seçimleri kaldır
      newFormData.forEach((data, i) => {
        newFormData[i] = {
          ...data,
          is_purchaser: i === index, // Sadece seçilen indeksi true yap
        };

        // Seçim yapıldığında tüm hata mesajlarını temizle (Checkbox ile ilgili)
        if (newErrors[i] && newErrors[i].is_purchaser) {
          delete newErrors[i].is_purchaser;
        }
      });
    } else {
      // Eğer seçim kaldırılıyorsa, sadece o elemanın seçimini kaldır
      newFormData[index] = {
        ...newFormData[index],
        is_purchaser: false,
      };
    }

    setFormData(newFormData);
    setErrors(newErrors); // Hata durumunu da güncelle
  };

  const handleAddShareholder = async () => {
    // İşlem zaten devam ediyorsa veya mutation yükleme durumundaysa çık
    if (
      !selectedSacrifice ||
      !currentSacrifice?.empty_share ||
      isAddingShare ||
      updateShareCount.isPending
    )
      return;

    try {
      setIsAddingShare(true);

      // Şu anki hisse sayısı + 1 ile API'yi çağıralım
      const newShareCount = formData.length + 1;

      // API'yi çağırarak rezervasyon işlemini güncelle
      await updateShareCount.mutateAsync({
        transaction_id,
        share_count: newShareCount,
        operation: "add",
      });

      // Form state'ini güncelle - is_purchaser varsayılan olarak false
      setFormData([
        ...formData,
        {
          name: "",
          phone: "",
          delivery_location: "",
          is_purchaser: false,
        },
      ]);
      setErrors([...errors, {}]);
    } catch (error) {
      console.error("Error adding shareholder:", error);
      // Hata durumunda kullanıcıyı bilgilendir
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          "Hissedar eklenirken bir hata oluştu. Lütfen tekrar deneyin.",
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
      // Yeni hisse sayısı
      const newShareCount = formData.length - 1;

      // API'yi çağırarak rezervasyon işlemini güncelle
      await updateShareCount.mutateAsync({
        transaction_id,
        share_count: newShareCount,
        operation: "remove",
      });

      // Form state'ini güncelle
      const newFormData = [...formData];
      newFormData.splice(index, 1);
      setFormData(newFormData);

      const newErrors = [...errors];
      newErrors.splice(index, 1);
      setErrors(newErrors);
    } catch (error) {
      console.error("Error removing shareholder:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          "Hissedar silinirken bir hata oluştu. Lütfen tekrar deneyin.",
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
    } catch (error) {
      console.error("Error canceling reservation in confirmBack:", error);
      setShowBackDialog(false);
    } finally {
      setIsCanceling(false);
    }
    resetStore();
    goToStep("selection");
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

        resetStore();
        goToStep("selection");
      } catch (error) {
        console.error("Error handling last share action:", error);
      } finally {
        setShowLastShareDialog(false);
        setIsCanceling(false);
      }
    } else {
      setShowLastShareDialog(false);
    }
  };

  const handleContinue = () => {
    let hasFormErrors = false; // Formdaki hataları takip etmek için
    let hasPurchaserError = false; // İşlemi yapan kişi hatasını takip etmek için
    const newErrors: FormErrors[] = formData.map(() => ({}));

    // Tüm formları validate et
    formData.forEach((data, index) => {
      // Zod validasyonu
      try {
        // is_purchaser hariç alanları kontrol et
        const { name, phone, delivery_location } = data;
        formSchema
          .omit({ is_purchaser: true })
          .parse({ name, phone, delivery_location });
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            if (err.path[0]) {
              const field = err.path[0] as keyof FormErrors;
              if (!newErrors[index][field]) {
                newErrors[index][field] = [];
              }
              newErrors[index][field] = [err.message];
              hasFormErrors = true;
            }
          });
        }
      }
    });

    // Birden fazla hissedar varsa, en az biri "işlemi yapan kişi" olarak işaretlenmiş olmalı
    const hasPurchaser =
      formData.length > 1
        ? formData.some((data) => data.is_purchaser === true)
        : true;

    if (formData.length > 1 && !hasPurchaser) {
      hasPurchaserError = true;
    }

    // Hataları state'e kaydet (ama is_purchaser hatalarını kaydetme)
    setErrors(newErrors);

    // Eğer hem form hataları hem de purchaser hatası varsa
    if (hasFormErrors) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen tüm alanları doğru şekilde doldurunuz",
      });
      return;
    }

    // Eğer sadece purchaser hatası varsa
    if (hasPurchaserError) {
      toast({
        variant: "destructive",
        title: "İşlemi Yapan Kişi Seçilmedi",
        description:
          "Lütfen devam etmeden önce, işlemi gerçekleştiren hissedarı işaretleyiniz.",
      });
      return;
    }

    // Hata yoksa devam et
    goToStep("confirmation");
  };

  return (
    <div className="space-y-16">
      <div className="w-full">
        <SacrificeInfo sacrifice={selectedSacrifice} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-12 w-full mx-auto mt-8">
        {formData.map((data, index) => (
          <div
            key={index}
            className={cn(
              "w-full",
              formData.length === 1 ? "sm:col-span-2 sm:w-1/2 sm:mx-auto" : "",
              formData.length % 2 === 1 && index === formData.length - 1
                ? "sm:col-span-2 sm:w-1/2 sm:mx-auto"
                : ""
            )}
          >
            <ShareholderForm
              data={data}
              index={index}
              errors={errors[index] || {}}
              onInputChange={handleInputChange}
              onInputBlur={handleInputBlur}
              onSelectChange={(index, field, value) =>
                handleSelectChange(index, field, value)
              }
              onRemove={handleRemoveShareholder}
              onIsPurchaserChange={handleIsPurchaserChange}
              isOtherPurchaserSelected={formData.some(
                (d, i) => i !== index && d.is_purchaser === true
              )}
              totalForms={formData.length}
            />
          </div>
        ))}
      </div>

      <TripleButtons
        onBack={() => setShowBackDialog(true)}
        onContinue={handleContinue}
        onAddShareholder={handleAddShareholder}
        canAddShareholder={Boolean(
          currentSacrifice?.empty_share && currentSacrifice.empty_share > 0
        )}
        isAddingShare={isAddingShare}
        isUpdatePending={updateShareCount.isPending}
        maxShareholderReached={formData.length >= 7}
      />

      <AlertDialog open={showBackDialog} onOpenChange={setShowBackDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader className="space-y-4 sm:space-y-6">
            <AlertDialogTitle className="text-base sm:text-xl font-semibold">
              Emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-base leading-relaxed">
              Eğer geri dönerseniz, yaptığınız değişiklikler kaybolacaktır.
              Ayrıca, daha önce seçmiş olduğunuz hisseler başkaları tarafından
              seçilebilir hale gelecektir. Devam etmek istediğinize emin
              misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6">
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 sm:h-10 text-xs sm:text-base"
              onClick={confirmBack}
              disabled={isCanceling || cancelReservation.isPending}
            >
              {isCanceling || cancelReservation.isPending
                ? "İşleminiz yapılıyor..."
                : "Evet, geri dönmek istiyorum"}
            </AlertDialogAction>
            <AlertDialogCancel
              className="flex-1 h-8 sm:h-10 text-xs sm:text-base"
              onClick={cancelBack}
              disabled={isCanceling || cancelReservation.isPending}
            >
              Hayır, bu sayfada kalmak istiyorum
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showLastShareDialog}
        onOpenChange={setShowLastShareDialog}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader className="space-y-6">
            <AlertDialogTitle className="text-xl font-semibold">
              Uyarı
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              Formdaki son hisseyi silemezsiniz. Lütfen yapmak istediğiniz
              işlemi seçiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex space-x-4 pt-6">
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleLastShareAction("return")}
              disabled={isCanceling || cancelReservation.isPending}
            >
              {isCanceling || cancelReservation.isPending
                ? "İşleminiz yapılıyor..."
                : "Hisse Seçim Ekranına Dön"}
            </AlertDialogAction>
            <AlertDialogCancel
              className="flex-1"
              onClick={() => handleLastShareAction("stay")}
              disabled={isCanceling || cancelReservation.isPending}
            >
              Bu sayfada kal
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

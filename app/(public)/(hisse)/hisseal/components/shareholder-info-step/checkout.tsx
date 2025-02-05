"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { sacrificeSchema } from "@/types"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/utils/supabaseClient"
import { useUpdateSacrifice } from "@/hooks/useSacrifices"
import SacrificeInfo from "./sacrifice-info"
import { useSacrifices } from "@/hooks/useSacrifices"
import ShareholderForm from "./shareholder-form"
import TripleButtons from "../common/triple-buttons"

const formSchema = z.object({
  name: z.string().min(1, "Ad soyad zorunludur"),
  phone: z.string()
    .regex(/^0/, "Telefon numarası 0 ile başlamalıdır")
    .refine(
      (val) => val.replace(/\D/g, '').length === 11,
      "Telefon numarası 11 haneli olmalıdır"
    ),
  delivery_location: z.string().min(1, "Teslimat noktası seçiniz"),
})

type FormData = z.infer<typeof formSchema>

type Step = "selection" | "details" | "confirmation"

interface CheckoutProps {
  sacrifice: sacrificeSchema | null
  formData: FormData[]
  setFormData: (data: FormData[]) => void
  onApprove: () => void
  onBack: (shareCount: number) => void
  resetStore: () => void
  setCurrentStep: (step: Step) => void
  setLastInteractionTime: (time: number) => void
}

type FormErrors = {
  name?: string[]
  phone?: string[]
  delivery_location?: string[]
}

const getGridClass = (shareholderCount: number) => {
  switch (shareholderCount) {
    case 1:
      return "grid grid-cols-1 [&>*]:w-1/2 [&>*]:mx-auto" // Tek div, yarı genişlikte ve ortada
    case 2:
      return "grid grid-cols-2 gap-12 [&>*]:w-full" // İki div, tam genişlikte yan yana
    case 3:
      return "grid grid-cols-2 gap-12 [&>*]:w-full [&>*:last-child]:col-span-2 [&>*:last-child]:w-1/2 [&>*:last-child]:mx-auto" // Son div ortada ve yarı genişlikte
    case 4:
      return "grid grid-cols-2 gap-12 [&>*]:w-full" // İkişerli iki satır, tam genişlikte
    case 5:
      return "grid grid-cols-2 gap-12 [&>*]:w-full [&>*:last-child]:col-span-2 [&>*:last-child]:w-1/2 [&>*:last-child]:mx-auto" // Son div ortada ve yarı genişlikte
    case 6:
      return "grid grid-cols-2 gap-12 [&>*]:w-full" // İkişerli üç satır, tam genişlikte
    case 7:
      return "grid grid-cols-2 gap-12 [&>*]:w-full [&>*:last-child]:col-span-2 [&>*:last-child]:w-1/2 [&>*:last-child]:mx-auto" // Son div ortada ve yarı genişlikte
    default:
      return "grid grid-cols-2 gap-12 [&>*]:w-full" // Varsayılan olarak tam genişlikte
  }
}

export default function Checkout({
  sacrifice,
  formData,
  setFormData,
  onBack,
  resetStore,
  setCurrentStep,
  setLastInteractionTime,
}: CheckoutProps) {
  const [showBackDialog, setShowBackDialog] = useState(false)
  const [errors, setErrors] = useState<FormErrors[]>([])
  const [userAction, setUserAction] = useState<"confirm" | "cancel" | null>(null)
  const [showLastShareDialog, setShowLastShareDialog] = useState(false)
  const updateSacrifice = useUpdateSacrifice()
  const [isAddingShare, setIsAddingShare] = useState(false)

  // React Query ile güncel sacrifice verisini al
  const { data: sacrifices } = useSacrifices()
  const currentSacrifice = sacrifices?.find(s => s.sacrifice_id === sacrifice?.sacrifice_id)

  const { toast } = useToast()

  const handleInputChange = (index: number, field: keyof FormData, value: string) => {
    setLastInteractionTime(Date.now()); // Reset timeout
    const newFormData = [...formData]
    newFormData[index] = {
      ...newFormData[index],
      [field]: value,
    }
    setFormData(newFormData)
  }

  const handleInputBlur = (index: number, field: keyof FormData, value: string) => {
    setLastInteractionTime(Date.now()); // Reset timeout
    const newErrors = [...errors]
    if (!newErrors[index]) newErrors[index] = {}

    // Boş alan kontrolü
    if (!value) {
      switch (field) {
        case "name":
          newErrors[index].name = ["Ad soyad zorunludur"]
          break
        case "phone":
          newErrors[index].phone = ["Telefon numarası zorunludur"]
          break
        case "delivery_location":
          newErrors[index].delivery_location = ["Teslimat noktası seçiniz"]
          break
      }
      setErrors(newErrors)
      return
    }

    // Telefon numarası için özel kontroller
    if (field === "phone") {
      if (!/^0/.test(value)) {
        newErrors[index].phone = ["Telefon numarası 0 ile başlamalıdır"]
      } else if (value.replace(/\D/g, '').length !== 11) {
        newErrors[index].phone = ["Telefon numarası 11 haneli olmalıdır"]
      } else {
        delete newErrors[index].phone
      }
      setErrors(newErrors)
      return
    }

    // Diğer alanlar için Zod validasyonu
    try {
      const fieldSchema = formSchema.shape[field]
      fieldSchema.parse(value)
      delete newErrors[index][field]
      setErrors(newErrors)
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors[index][field] = [error.errors[0].message]
        setErrors(newErrors)
      }
    }
  }

  // Select değişikliğini yakalayalım
  const handleSelectChange = (index: number, field: keyof FormData, value: string) => {
    console.log('handleSelectChange called with:', { index, field, value });
    setLastInteractionTime(Date.now()); // Reset timeout
    const newFormData = [...formData];
    newFormData[index] = {
      ...newFormData[index],
      [field]: value,
    };
    console.log('Updated form data:', newFormData);
    setFormData(newFormData);
    handleInputBlur(index, field, value);
  }

  const handleAddShareholder = async () => {
    // İşlem zaten devam ediyorsa veya mutation yükleme durumundaysa çık
    if (!sacrifice || !currentSacrifice?.empty_share || isAddingShare || updateSacrifice.isPending) return;

    try {
      setIsAddingShare(true);

      // Önce güncel kurban bilgisini kontrol et
      const { data: latestSacrifice, error } = await supabase
        .from("sacrifice_animals")
        .select("empty_share")
        .eq("sacrifice_id", sacrifice.sacrifice_id)
        .single();

      if (error || !latestSacrifice) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
        });
        return;
      }

      // Eğer empty_share değeri değiştiyse işlemi iptal et
      if (latestSacrifice.empty_share !== currentSacrifice.empty_share) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kurbanlık bilgileri değişti. Lütfen sayfayı yenileyiniz.",
        });
        return;
      }

      // Form state'ini güncelle
      setFormData([...formData, {
        name: "",
        phone: "",
        delivery_location: "",
      }]);
      setErrors([...errors, {}]);

      // DB'de empty_share'i 1 azalt
      await updateSacrifice.mutateAsync({
        sacrificeId: sacrifice.sacrifice_id,
        emptyShare: currentSacrifice.empty_share - 1,
      });

    } catch (error) {
      console.error('Error adding shareholder:', error);
      // Hata durumunda form state'ini geri al
      const newFormData = [...formData];
      newFormData.pop();
      setFormData(newFormData);

      const newErrors = [...errors];
      newErrors.pop();
      setErrors(newErrors);

      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
      });
    } finally {
      setIsAddingShare(false);
    }
  }

  const handleRemoveShareholder = async (index: number) => {
    if (formData.length === 1) {
      setShowLastShareDialog(true);
      return;
    }

    if (!sacrifice) return;

    try {
      // Önce güncel kurban bilgisini al
      const { data: currentSacrifice, error } = await supabase
        .from("sacrifice_animals")
        .select("empty_share")
        .eq("sacrifice_id", sacrifice.sacrifice_id)
        .single();

      if (error || !currentSacrifice) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
        });
        return;
      }

      // DB'de empty_share'i 1 artır
      await updateSacrifice.mutateAsync({
        sacrificeId: sacrifice.sacrifice_id,
        emptyShare: currentSacrifice.empty_share + 1,
      });

      // Form state'ini güncelle
      const newFormData = [...formData];
      newFormData.splice(index, 1);
      setFormData(newFormData);

      const newErrors = [...errors];
      newErrors.splice(index, 1);
      setErrors(newErrors);
    } catch {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
      });
    }
  }

  const handleLastShareAction = async (action: 'return' | 'stay') => {
    if (action === 'return' && sacrifice) {
      try {
        // Önce güncel kurban bilgisini al
        const { data: currentSacrifice, error } = await supabase
          .from("sacrifice_animals")
          .select("empty_share")
          .eq("sacrifice_id", sacrifice.sacrifice_id)
          .single();

        if (error || !currentSacrifice) {
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
          });
          return;
        }

        // DB'de empty_share'i 1 artır
        await updateSacrifice.mutateAsync({
          sacrificeId: sacrifice.sacrifice_id,
          emptyShare: currentSacrifice.empty_share + 1,
        });

        // Store'u sıfırla ve selection state'ine dön
        resetStore();
        setCurrentStep("selection");
      } catch {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "İşlem sırasında bir hata oluştu.",
        });
      }
    }

    // Her durumda popup'ı kapat
    setShowLastShareDialog(false);
  }

  const confirmBack = () => {
    setUserAction("confirm")
    setShowBackDialog(false)
  }

  const cancelBack = () => {
    setUserAction("cancel")
    setShowBackDialog(false)
  }

  useEffect(() => {
    if (userAction === "confirm") {
      onBack(formData.length)
    }
    setUserAction(null)
  }, [userAction, onBack, formData])

  const handleContinue = () => {
    let hasErrors = false;
    const newErrors: FormErrors[] = formData.map(() => ({}));

    // Tüm formları validate et
    formData.forEach((data, index) => {
      // Zod validasyonu
      try {
        formSchema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            if (err.path[0]) {
              const field = err.path[0] as keyof FormErrors;
              if (!newErrors[index][field]) {
                newErrors[index][field] = [];
              }
              newErrors[index][field] = [err.message];
              hasErrors = true;
            }
          });
        }
      }
    });

    // Hataları state'e kaydet
    setErrors(newErrors);

    if (hasErrors) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen tüm alanları doğru şekilde doldurunuz",
      });
      return;
    }

    // Hata yoksa devam et
    setCurrentStep("confirmation");
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <SacrificeInfo sacrifice={sacrifice} />
        </div>
      </div>

      <div className={`grid ${getGridClass(formData.length)} gap-12 mt-8`}>
        {formData.map((data, index) => (
          <div key={index}>
            <ShareholderForm
              data={data}
              index={index}
              errors={errors[index] || {}}
              onInputChange={handleInputChange}
              onInputBlur={handleInputBlur}
              onSelectChange={(index, field, value) => handleSelectChange(index, field, value)}
              onRemove={handleRemoveShareholder}
            />
          </div>
        ))}
      </div>

      <TripleButtons
        onBack={() => setShowBackDialog(true)}
        onContinue={handleContinue}
        onAddShareholder={handleAddShareholder}
        canAddShareholder={Boolean(currentSacrifice?.empty_share && currentSacrifice.empty_share > 0)}
        isAddingShare={isAddingShare}
        isUpdatePending={updateSacrifice.isPending}
        maxShareholderReached={formData.length >= 7}
      />

      <AlertDialog
        open={showBackDialog}
        onOpenChange={setShowBackDialog}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader className="space-y-6">
            <AlertDialogTitle className="text-xl font-semibold">
              Emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              Eğer geri dönerseniz, yaptığınız değişiklikler kaybolacaktır. Ayrıca, daha önce seçmiş olduğunuz hisseler başkaları tarafından seçilebilir hale gelecektir. Devam etmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex space-x-4 pt-6">
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmBack}
            >
              Evet, geri dönmek istiyorum
            </AlertDialogAction>
            <AlertDialogCancel
              className="flex-1"
              onClick={cancelBack}
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
              Formdaki son hisseyi silemezsiniz. Lütfen yapmak istediğiniz işlemi seçiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex space-x-4 pt-6">
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleLastShareAction('return')}
            >
              Hisse Seçim Ekranına Dön
            </AlertDialogAction>
            <AlertDialogCancel
              className="flex-1"
              onClick={() => handleLastShareAction('stay')}
            >
              Bu sayfada kal
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

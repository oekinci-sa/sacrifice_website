"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
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
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { X, ArrowLeft, ArrowRight, Plus } from "lucide-react"
import { supabase } from "@/utils/supabaseClient"
import { useUpdateSacrifice } from "@/hooks/useSacrifices"
import SacrificeInfo from "./sacrifice-info"
import { useSacrifices } from "@/hooks/useSacrifices"

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

const getGridClass = (shareholderCount: number) => {
  if (shareholderCount <= 2 || shareholderCount === 4) {
    return "grid-cols-2" // 2 columns for 1-2 or 4 shareholders
  }
  return "grid-cols-3" // 3 columns for 3, 5, 6, or 7 shareholders
}

export default function Checkout({
  sacrifice,
  formData,
  setFormData,
  onApprove,
  onBack,
  resetStore,
  setCurrentStep,
  setLastInteractionTime,
}: CheckoutProps) {
  const [showBackDialog, setShowBackDialog] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>[]>([])
  const [userAction, setUserAction] = useState<"confirm" | "cancel" | null>(null)
  const [showLastShareDialog, setShowLastShareDialog] = useState(false)
  const [shareToRemove, setShareToRemove] = useState<number | null>(null)
  const updateSacrifice = useUpdateSacrifice()
  const [isAddingShare, setIsAddingShare] = useState(false)

  // React Query ile güncel sacrifice verisini al
  const { data: sacrifices } = useSacrifices()
  const currentSacrifice = sacrifices?.find(s => s.sacrifice_id === sacrifice?.sacrifice_id)

  const validateField = (index: number, field: keyof FormData, value: string) => {
    try {
      const fieldSchema = formSchema.shape[field]
      fieldSchema.parse(value)
      const newErrors = [...errors]
      if (!newErrors[index]) {
        newErrors[index] = {}
      }
      delete newErrors[index][field]
      setErrors(newErrors)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = [...errors]
        if (!newErrors[index]) {
          newErrors[index] = {}
        }
        newErrors[index][field] = error.errors[0].message
        setErrors(newErrors)
      }
    }
  }

  const validateAllFields = (index: number, data: FormData) => {
    Object.keys(formSchema.shape).forEach((field) => {
      validateField(index, field as keyof FormData, data[field as keyof FormData])
    })
  }

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
          newErrors[index].name = "Ad soyad zorunludur"
          break
        case "phone":
          newErrors[index].phone = "Telefon numarası zorunludur"
          break
        case "delivery_location":
          newErrors[index].delivery_location = "Teslimat noktası seçiniz"
          break
      }
      setErrors(newErrors)
      return
    }

    // Telefon numarası için özel kontroller
    if (field === "phone") {
      if (!/^0/.test(value)) {
        newErrors[index].phone = "Telefon numarası 0 ile başlamalıdır"
      } else if (value.replace(/\D/g, '').length !== 11) {
        newErrors[index].phone = "Telefon numarası 11 haneli olmalıdır"
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
        newErrors[index][field] = error.errors[0].message
        setErrors(newErrors)
      }
    }
  }

  // Select değişikliğini yakalayalım
  const handleSelectChange = (index: number, value: string) => {
    setLastInteractionTime(Date.now()); // Reset timeout
    handleInputChange(index, "delivery_location", value);
    handleInputBlur(index, "delivery_location", value);
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
        toast.error("Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.");
        return;
      }

      // Eğer empty_share değeri değiştiyse işlemi iptal et
      if (latestSacrifice.empty_share !== currentSacrifice.empty_share) {
        toast.error("Kurbanlık bilgileri değişti. Lütfen sayfayı yenileyiniz.");
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

      // Son hisse eklendiyse toast göster
      if (currentSacrifice.empty_share === 1) {
        toast.success("Bu Kurbanlık Tamamlandı!", {
          description: "Bu kurbanlıktaki son hisseyi eklediniz.",
          duration: 5000,
        });
      }
    } catch (error) {
      // Hata durumunda form state'ini geri al
      const newFormData = [...formData];
      newFormData.pop();
      setFormData(newFormData);

      const newErrors = [...errors];
      newErrors.pop();
      setErrors(newErrors);

      toast.error("Yeni hisse eklenirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsAddingShare(false);
    }
  }

  const handleRemoveShareholder = async (index: number) => {
    if (formData.length === 1) {
      setShareToRemove(index);
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
        toast.error("Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.");
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
    } catch (error) {
      toast.error("Hisse silinirken bir hata oluştu. Lütfen tekrar deneyin.");
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
          toast.error("Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.");
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
      } catch (error) {
        toast.error("İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      }
    }

    // Her durumda popup'ı kapat
    setShowLastShareDialog(false);
    setShareToRemove(null);
  }

  const handleBack = () => {
    setShowBackDialog(true)
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
    let hasErrors = false
    const newErrors = [...errors]

    // Tüm formları validate et
    formData.forEach((data, index) => {
      if (!newErrors[index]) newErrors[index] = {}

      // Her alan için boş kontrol
      if (!data.name) {
        newErrors[index].name = "Ad soyad zorunludur"
        hasErrors = true
      }

      if (!data.phone) {
        newErrors[index].phone = "Telefon numarası zorunludur"
        hasErrors = true
      } else if (!/^0/.test(data.phone)) {
        newErrors[index].phone = "Telefon numarası 0 ile başlamalıdır"
        hasErrors = true
      } else if (data.phone.replace(/\D/g, '').length !== 11) {
        newErrors[index].phone = "Telefon numarası 11 haneli olmalıdır"
        hasErrors = true
      }

      if (!data.delivery_location) {
        newErrors[index].delivery_location = "Teslimat noktası seçiniz"
        hasErrors = true
      }
    })

    // Hataları state'e kaydet
    setErrors(newErrors)

    if (hasErrors) {
      toast.error("Lütfen tüm alanları doldurunuz")
      return
    }

    onApprove()
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <SacrificeInfo sacrifice={sacrifice} />
        </div>
      </div>
      <div className="flex justify-end items-center bg-white">
        {currentSacrifice && currentSacrifice.empty_share > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={handleAddShareholder}
              className="bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300"
              disabled={formData.length >= 7 || isAddingShare || updateSacrifice.isPending}
            >
              <Plus className="h-5 w-5 mr-2" />
              Yeni Hissedar Ekle
            </Button>
          </div>
        )}
      </div>

      <div className={`grid ${getGridClass(formData.length)} gap-12 mt-8`}>
        {formData.map((data, index) => (
          <div key={index} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {index + 1}. Hissedar
              </h3>
              <Button
                variant="ghost"
                className="flex items-center justify-center gap-2 bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300"
                onClick={() => handleRemoveShareholder(index)}
              >
                <span className="text-lg flex items-center">×</span>
                <span>Hisseyi sil</span>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="relative pb-8">
                <Input
                  placeholder="Ad Soyad"
                  value={data.name}
                  onChange={(e) => handleInputChange(index, "name", e.target.value)}
                  onBlur={(e) => handleInputBlur(index, "name", e.target.value)}
                  className="bg-[#F7F7F8] border-0 text-[#4B5675] focus:bg-[#F7F7F8] focus-visible:ring-0 h-11"
                  style={{ fontSize: '1.125rem' }}
                />
                {errors[index]?.name && (
                  <p className="text-sm text-destructive absolute -bottom-1 left-0">{errors[index].name}</p>
                )}
              </div>
              <div className="relative pb-8">
                <Input
                  placeholder="Telefon (05XX XXX XX XX)"
                  value={data.phone}
                  onChange={(e) => handleInputChange(index, "phone", e.target.value)}
                  onBlur={(e) => handleInputBlur(index, "phone", e.target.value)}
                  className="bg-[#F7F7F8] border-0 text-[#4B5675] focus:bg-[#F7F7F8] focus-visible:ring-0 h-11"
                  style={{ fontSize: '1.125rem' }}
                />
                {errors[index]?.phone && (
                  <p className="text-sm text-destructive absolute -bottom-1 left-0">{errors[index].phone}</p>
                )}
              </div>
              <div className="relative pb-8">
                <Select
                  value={data.delivery_location}
                  onValueChange={(value) => {
                    handleSelectChange(index, value)
                  }}
                >
                  <SelectTrigger
                    className="bg-[#F7F7F8] border-0 text-[#4B5675] focus:bg-[#F7F7F8] focus-visible:ring-0 h-11"
                    style={{ fontSize: '1.125rem' }}
                  >
                    <SelectValue placeholder="Teslimat Noktası" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kesimhane" className="text-lg">Kesimhanede Teslim</SelectItem>
                    <SelectItem value="yenimahalle-pazar-yeri" className="text-lg">Yenimahalle Pazar Yeri (+500₺)</SelectItem>
                    <SelectItem value="kecioren-otoparki" className="text-lg">Keçiören Otoparkı (+500₺)</SelectItem>
                  </SelectContent>
                </Select>
                {errors[index]?.delivery_location && (
                  <p className="text-sm text-destructive absolute -bottom-1 left-0">{errors[index].delivery_location}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center gap-4 pt-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">Geri Dön</span>
          <Button
            variant="ghost"
            className="bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full"
            onClick={() => setShowBackDialog(true)}
          >
            <ArrowLeft className="h-12 w-12" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full"
            onClick={handleContinue}
          >
            <ArrowRight className="h-12 w-12" />
          </Button>
          <span className="text-lg">Devam Et</span>
        </div>
      </div>

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

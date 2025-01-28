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
import { X } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, "Ad soyad zorunludur"),
  phone: z.string()
    .regex(/^0/, "Telefon numarası 0 ile başlamalıdır")
    .refine(
      (val) => val.replace(/\D/g, '').length === 11,
      "Telefon numarası 11 haneli olmalıdır (Boşluklar hariç)"
    ),
  delivery_location: z.string().min(1, "Teslimat noktası seçiniz"),
})

type FormData = z.infer<typeof formSchema>

interface CheckoutProps {
  sacrifice: sacrificeSchema | null
  formData: FormData[]
  setFormData: (data: FormData[]) => void
  onApprove: () => void
  onBack: (shareCount: number) => void
}

export default function Checkout({
  sacrifice,
  formData,
  setFormData,
  onApprove,
  onBack,
}: CheckoutProps) {
  const [showBackDialog, setShowBackDialog] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>[]>([])
  const [userAction, setUserAction] = useState<"confirm" | "cancel" | null>(null)

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
    const newFormData = [...formData]
    newFormData[index] = {
      ...newFormData[index],
      [field]: value,
    }
    setFormData(newFormData)
  }

  const handleInputBlur = (index: number, field: keyof FormData, value: string) => {
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
        newErrors[index].phone = "Telefon numarası 11 haneli olmalıdır (Boşluklar hariç)"
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

  const handleAddShareholder = () => {
    if (!sacrifice) return
    setFormData([...formData, {
      name: "",
      phone: "",
      delivery_location: "",
    }])
    setErrors([...errors, {}])
  }

  const handleRemoveShareholder = (index: number) => {
    const newFormData = [...formData]
    newFormData.splice(index, 1)
    setFormData(newFormData)

    const newErrors = [...errors]
    newErrors.splice(index, 1)
    setErrors(newErrors)
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
      {formData.map((data, index) => (
        <div key={index}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {index + 1}. Hissedar
              </h3>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-destructive hover:bg-red-50"
                onClick={() => handleRemoveShareholder(index)}
              >
                <span className="text-lg">×</span>
                <span>Hisseyi sil</span>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-2">
                <Input
                  placeholder="Ad Soyad"
                  value={data.name}
                  onChange={(e) => handleInputChange(index, "name", e.target.value)}
                  onBlur={(e) => handleInputBlur(index, "name", e.target.value)}
                  className="bg-[#F7F7F8] border-0 text-[#4B5675] focus:bg-[#F7F7F8] focus-visible:ring-0"
                />
                {errors[index]?.name && (
                  <p className="text-sm text-destructive">{errors[index].name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Telefon (05XX XXX XX XX)"
                  value={data.phone}
                  onChange={(e) => handleInputChange(index, "phone", e.target.value)}
                  onBlur={(e) => handleInputBlur(index, "phone", e.target.value)}
                  className="bg-[#F7F7F8] border-0 text-[#4B5675] focus:bg-[#F7F7F8] focus-visible:ring-0"
                />
                {errors[index]?.phone && (
                  <p className="text-sm text-destructive">{errors[index].phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Select
                  value={data.delivery_location}
                  onValueChange={(value) => {
                    handleInputChange(index, "delivery_location", value)
                    handleInputBlur(index, "delivery_location", value)
                  }}
                >
                  <SelectTrigger 
                    className="bg-[#F7F7F8] border-0 text-[#4B5675] focus:bg-[#F7F7F8] focus-visible:ring-0"
                  >
                    <SelectValue placeholder="Teslimat Noktası" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kesimhane">Kesimhanede Teslim</SelectItem>
                    <SelectItem value="yenimahalle-pazar-yeri">Yenimahalle Pazar Yeri (+500₺)</SelectItem>
                    <SelectItem value="kecioren-otoparki">Keçiören Otoparkı (+500₺)</SelectItem>
                  </SelectContent>
                </Select>
                {errors[index]?.delivery_location && (
                  <p className="text-sm text-destructive">{errors[index].delivery_location}</p>
                )}
              </div>
            </div>
          </div>
          {index < formData.length - 1 && (
            <div className="mb-8 mt-12 border-t border-gray-200" />
          )}
        </div>
      ))}

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={() => setShowBackDialog(true)}
        >
          Geri Dön
        </Button>
        <Button onClick={handleContinue}>
          Devam Et
        </Button>
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
            <AlertDialogCancel 
              className="flex-1"
              onClick={cancelBack}
            >
              Hayır, bu sayfada kalmak istiyorum
            </AlertDialogCancel>
            <AlertDialogAction 
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmBack}
            >
              Evet, geri dönmek istiyorum
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

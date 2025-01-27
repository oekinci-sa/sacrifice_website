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
      (val) => val.replace(/\s/g, '').length === 11,
      "Telefon numarası 11 haneli olmalıdır"
    ),
  delivery_location: z.string().min(1, "Teslimat noktası seçiniz"),
})

type FormData = z.infer<typeof formSchema>

interface CheckoutProps {
  sacrifice: sacrificeSchema | null
  formData: FormData[]
  setFormData: (data: FormData[]) => void
  onApprove: () => void
  onBack: () => void
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

  const validateField = (index: number, field: keyof FormData, value: string) => {
    try {
      const fieldSchema = formSchema.shape[field]
      fieldSchema.parse(value)
      const newErrors = [...errors]
      if (newErrors[index]) {
        delete newErrors[index][field]
      }
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

  const handleInputChange = (index: number, field: keyof FormData, value: string) => {
    const newFormData = [...formData]
    newFormData[index] = {
      ...newFormData[index],
      [field]: value,
    }
    setFormData(newFormData)
    validateField(index, field, value)
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
    setShowBackDialog(false)
    onBack()
  }

  const validateForm = () => {
    // Validate all form fields
    const isValid = formData.every((data) => {
      const isPhoneValid = /^0[0-9]{10}$/.test(data.phone)
      const hasName = data.name.trim() !== ""
      const hasLocation = data.delivery_location !== ""

      if (!hasName) {
        toast.error("Lütfen tüm hissedarların isimlerini girin")
        return false
      }
      if (!isPhoneValid) {
        toast.error("Lütfen geçerli bir telefon numarası girin (05XX XXX XX XX formatında)")
        return false
      }
      if (!hasLocation) {
        toast.error("Lütfen teslimat noktasını seçin")
        return false
      }

      return true
    })

    return isValid
  }

  const handleContinue = () => {
    if (validateForm()) {
      onApprove()
    }
  }

  return (
    <div className="space-y-8">
      {formData.map((data, index) => (
        <div key={index} className="space-y-4">
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

          <div className="grid gap-4">
            <Input
              placeholder="Ad Soyad"
              value={data.name}
              onChange={(e) => handleInputChange(index, "name", e.target.value)}
            />
            <Input
              placeholder="Telefon (05XX XXX XX XX)"
              value={data.phone}
              onChange={(e) => handleInputChange(index, "phone", e.target.value)}
            />
            <Select
              value={data.delivery_location}
              onValueChange={(value) => handleInputChange(index, "delivery_location", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Teslimat Noktası" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kesimhane">Kesimhanede Teslim</SelectItem>
                <SelectItem value="yenimahalle-pazar-yeri">Yenimahalle Pazar Yeri (+500₺)</SelectItem>
                <SelectItem value="kecioren-otoparki">Keçiören Otoparkı (+500₺)</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

      <AlertDialog open={showBackDialog} onOpenChange={setShowBackDialog}>
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
            <AlertDialogCancel className="flex-1">
              Hayır, bu sayfada kalmak istiyorum
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmBack} className="flex-1">
              Evet, geri dönmek istiyorum
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

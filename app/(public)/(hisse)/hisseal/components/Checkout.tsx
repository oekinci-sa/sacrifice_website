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

interface CheckoutProps {
  sacrifice: sacrificeSchema | null
  formData: any[]
  setFormData: (data: any[]) => void
  onApprove: () => void
  setActiveTab: (tab: string) => void
}

export default function Checkout({
  sacrifice,
  formData,
  setFormData,
  onApprove,
  setActiveTab,
}: CheckoutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [showBackDialog, setShowBackDialog] = useState(false)
  const [errors, setErrors] = useState<any[]>([])
  const router = useRouter()

  const validateField = (index: number, field: keyof typeof formSchema.shape, value: string) => {
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

  const handleInputChange = (index: number, field: keyof typeof formSchema.shape, value: string) => {
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
    setActiveTab("tab-1")
    router.push("/hisseal")
  }

  const handleApprove = () => {
    // Validate all fields
    const newErrors = formData.map(data => {
      const result: any = {}
      Object.keys(formSchema.shape).forEach(field => {
        try {
          const fieldSchema = formSchema.shape[field as keyof typeof formSchema.shape]
          fieldSchema.parse(data[field])
        } catch (error) {
          if (error instanceof z.ZodError) {
            result[field] = error.errors[0].message
          }
        }
      })
      return result
    })

    setErrors(newErrors)

    // Check if there are any errors
    const hasErrors = newErrors.some(error => Object.keys(error).length > 0)
    if (hasErrors) {
      toast.error("Lütfen tüm alanları doğru şekilde doldurun")
      return
    }

    // Log form data to console
    console.log("Form Data:", formData)

    onApprove()
  }

  return (
    <div className="space-y-8">
      {formData.map((data, index) => (
        <div key={index} className="bg-white">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">{index + 1}. Hissedar</h3>
            <Button
              variant="ghost"
              onClick={() => handleRemoveShareholder(index)}
              className="hover:bg-red-50 text-destructive hover:text-destructive flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              <span>Hisseyi sil</span>
            </Button>
          </div>

          {/* Form fields */}
          <div className="flex gap-16">
            <div className="flex-1">
              <Label htmlFor={`name-${index}`} className="mb-3 block">Ad Soyad</Label>
              <Input
                id={`name-${index}`}
                value={data.name}
                onChange={(e) => handleInputChange(index, "name", e.target.value)}
                onBlur={() => validateField(index, "name", data.name)}
                className="bg-[#F7F7F8] border-0 text-[#4B5675]"
              />
              {errors[index]?.name && (
                <p className="text-sm text-destructive mt-1">{errors[index].name}</p>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor={`phone-${index}`} className="mb-3 block">Telefon</Label>
              <Input
                id={`phone-${index}`}
                value={data.phone}
                onChange={(e) => handleInputChange(index, "phone", e.target.value)}
                onBlur={() => validateField(index, "phone", data.phone)}
                placeholder="05XX XXX XX XX"
                className="bg-[#F7F7F8] border-0 text-[#4B5675]"
              />
              {errors[index]?.phone && (
                <p className="text-sm text-destructive mt-1">{errors[index].phone}</p>
              )}
            </div>
            <div className="flex-1">
              <Label className="mb-3 block">Teslimat Noktası Tercihi</Label>
              <Select
                value={data.delivery_location}
                onValueChange={(value) => handleInputChange(index, "delivery_location", value)}
                onOpenChange={() => validateField(index, "delivery_location", data.delivery_location)}
              >
                <SelectTrigger className="bg-[#F7F7F8] border-0 text-[#4B5675]">
                  <SelectValue placeholder="Lütfen seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kesimhane">Kesimhane'de Teslim</SelectItem>
                  <SelectSeparator />
                  <SelectItem value="yenimahalle-pazar-yeri">Yenimahalle Pazar Yeri</SelectItem>
                  <SelectItem value="kecioren-otoparki">Keçiören Otoparkı</SelectItem>
                </SelectContent>
              </Select>
              {errors[index]?.delivery_location && (
                <p className="text-sm text-destructive mt-1">{errors[index].delivery_location}</p>
              )}
            </div>
          </div>

          {index < formData.length - 1 && (
            <div className="border-t mt-12 mb-8" />
          )}
        </div>
      ))}
      
      <div className="flex justify-between items-center gap-4 pt-4">
        <Button
          variant="outline"
          onClick={handleBack}
        >
          Geri Dön
        </Button>
        <Button
          variant="outline"
          onClick={handleAddShareholder}
        >
          Yeni Hissedar Ekle
        </Button>
        <Button
          onClick={handleApprove}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Devam Et
        </Button>
      </div>

      <AlertDialog open={showBackDialog} onOpenChange={setShowBackDialog}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader className="space-y-6">
            <AlertDialogTitle className="text-xl">Dikkat</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              Eğer geri dönerseniz, yaptığınız tüm değişiklikler kaybolacaktır. Ayrıca, daha önce seçmiş olduğunuz hisseler başkaları tarafından seçilebilir hale gelecektir. Devam etmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-4 pt-6">
            <AlertDialogCancel className="bg-muted hover:bg-muted/90 flex-1">
              Hayır, bu sayfada kalmak istiyorum
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmBack} className="bg-destructive hover:bg-destructive/90 flex-1">
              Eminim, geri döneceğim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShareholderFormProps {
    data: {
        name: string
        phone: string
        delivery_location: string
    }
    index: number
    errors: {
        name?: string[]
        phone?: string[]
        delivery_location?: string[]
    }
    onInputChange: (index: number, field: "name" | "phone" | "delivery_location", value: string) => void
    onInputBlur: (index: number, field: "name" | "phone" | "delivery_location", value: string) => void
    onSelectChange: (index: number, field: "name" | "phone" | "delivery_location", value: string) => void
    onRemove: (index: number) => void
}

const getDeliveryLocationText = (location: string) => {
    switch (location) {
        case "kesimhane":
            return "Kesimhanede Teslim"
        case "yenimahalle-pazar-yeri":
            return "Yenimahalle Pazar Yeri"
        case "kecioren-otoparki":
            return "Keçiören Otoparkı"
        default:
            return location
    }
}

export default function ShareholderForm({
    data,
    index,
    errors,
    onInputChange,
    onInputBlur,
    onSelectChange,
    onRemove,
}: ShareholderFormProps) {
    return (
        <div className="bg-[#fcfcfa] rounded-[8px] border border-dashed border-[#c7ddcd] p-6">
            <div className="space-y-4">
                {/* İlk satır */}
                <div className="flex items-center justify-between mb-4">

                    <h3 className="text-lg font-semibold">
                        {index + 1}. Hissedar
                    </h3>
                    <Button
                        variant="ghost"
                        className="flex items-center justify-center gap-2 hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300"
                        onClick={() => onRemove(index)}
                    >
                        <X className="h-2 w-2" />
                        <span>Hisseyi sil</span>
                    </Button>
                </div>

                {/* Formlar */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor={`name-${index}`} className="text-sm font-medium mb-2 block">
                            Ad Soyad
                        </Label>
                        <Input
                            id={`name-${index}`}
                            value={data.name}
                            onChange={(e) => onInputChange(index, "name", e.target.value)}
                            onBlur={(e) => onInputBlur(index, "name", e.target.value)}
                            className={cn(
                                "border border-dashed border-[#c7ddcd] focus-visible:ring-0 focus-visible:border-[#c7ddcd] h-11",
                                errors?.name ? "border-destructive/50 bg-destructive/10" : ""
                            )}
                        />
                        {errors?.name && (
                            <p className="text-sm text-destructive mt-2">{errors.name.join(', ')}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor={`phone-${index}`} className="text-sm font-medium mb-2 block">
                            Telefon
                        </Label>
                        <Input
                            id={`phone-${index}`}
                            placeholder="Telefon (05XX XXX XX XX)"
                            value={data.phone}
                            onChange={(e) => onInputChange(index, "phone", e.target.value)}
                            onBlur={(e) => onInputBlur(index, "phone", e.target.value)}
                            className={cn(
                                "border border-dashed border-[#c7ddcd] focus-visible:ring-0 focus-visible:border-[#c7ddcd] h-11",
                                errors?.phone ? "border-destructive/50 bg-destructive/10" : ""
                            )}
                        />
                        {errors?.phone && (
                            <p className="text-sm text-destructive mt-2">{errors.phone.join(', ')}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor={`delivery-${index}`} className="text-sm font-medium mb-2 block">
                            Teslimat Noktası
                        </Label>
                        <Select
                            value={data.delivery_location}
                            onValueChange={(value) => onSelectChange(index, "delivery_location", value)}
                        >
                            <SelectTrigger
                                className={cn(
                                    "w-full border border-dashed border-[#c7ddcd] focus-visible:ring-0 focus-visible:border-[#c7ddcd] h-11",
                                    errors?.delivery_location ? "border-destructive/50 bg-destructive/10" : ""
                                )}
                            >
                                <SelectValue placeholder="Teslimat noktası seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="kesimhane">Kesimhanede Teslim</SelectItem>
                                <SelectItem value="yenimahalle-pazar-yeri">Yenimahalle Pazar Yeri (+500₺)</SelectItem>
                                <SelectItem value="kecioren-otoparki">Keçiören Otoparkı (+500₺)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors?.delivery_location && (
                            <p className="text-sm text-destructive mt-2">{errors.delivery_location.join(', ')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 
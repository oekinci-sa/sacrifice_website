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
import { Checkbox } from "@/components/ui/checkbox"

interface ShareholderFormProps {
    data: {
        name: string
        phone: string
        delivery_location: string
        is_purchaser?: boolean
    }
    index: number
    errors: {
        name?: string[]
        phone?: string[]
        delivery_location?: string[]
        is_purchaser?: string[]
    }
    onInputChange: (index: number, field: "name" | "phone" | "delivery_location", value: string) => void
    onInputBlur: (index: number, field: "name" | "phone" | "delivery_location", value: string) => void
    onSelectChange: (index: number, field: "name" | "phone" | "delivery_location", value: string) => void
    onRemove: (index: number) => void
    onIsPurchaserChange: (index: number, checked: boolean) => void
    isOtherPurchaserSelected?: boolean
    totalForms: number // Toplam form sayısı
}

const formatPhoneNumber = (value: string) => {
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');
    
    // Eğer numara boşsa, boş string döndür
    if (!numbers) return '';

    // Başında 0 varsa
    if (value.startsWith('0')) {
        if (numbers.length <= 4) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
        if (numbers.length <= 9) return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`;
        return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
    }
    
    // Başında 0 yoksa
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 8)} ${numbers.slice(8, 10)}`;
}

export default function ShareholderForm({
    data,
    index,
    errors,
    onInputChange,
    onInputBlur,
    onSelectChange,
    onRemove,
    onIsPurchaserChange,
    isOtherPurchaserSelected = false,
    totalForms = 1, // Varsayılan olarak 1 form var
}: ShareholderFormProps) {
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        onInputChange(index, "phone", formattedValue);
    };

    // Checkbox durumu için hesaplama
    const isCurrentPurchaser = data.is_purchaser === true;

    return (
        <div className="rounded-[8px] border border-dashed border-[#c7ddcd] p-4 sm:p-6">
            <div className="space-y-4">
                {/* İlk satır */}
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold">
                        {index + 1}. Hissedar
                    </h3>
                    <Button
                        variant="ghost"
                        className="flex items-center justify-center gap-1 sm:gap-2 hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 text-xs sm:text-sm h-8 sm:h-10"
                        onClick={() => onRemove(index)}
                    >
                        <X className="h-2 w-2 sm:h-3 sm:w-3" />
                        <span>Hisseyi sil</span>
                    </Button>
                </div>

                {/* Formlar */}
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <Label htmlFor={`name-${index}`} className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                            Ad Soyad
                        </Label>
                        <Input
                            id={`name-${index}`}
                            value={data.name}
                            onChange={(e) => onInputChange(index, "name", e.target.value)}
                            onBlur={(e) => onInputBlur(index, "name", e.target.value)}
                            className={cn(
                                "border border-dashed border-[#c7ddcd] focus-visible:ring-0 focus-visible:border-[#c7ddcd] h-9 sm:h-11 text-xs sm:text-sm",
                                errors?.name ? "border-destructive/50 bg-destructive/10" : ""
                            )}
                        />
                        {errors?.name && (
                            <p className="text-xs sm:text-sm text-destructive mt-1.5 sm:mt-2">{errors.name.join(', ')}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor={`phone-${index}`} className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                            Telefon
                        </Label>
                        <Input
                            id={`phone-${index}`}
                            placeholder="05XX XXX XX XX"
                            value={data.phone}
                            onChange={handlePhoneChange}
                            onBlur={(e) => onInputBlur(index, "phone", e.target.value)}
                            className={cn(
                                "border border-dashed border-[#c7ddcd] focus-visible:ring-0 focus-visible:border-[#c7ddcd] h-9 sm:h-11 text-xs sm:text-sm placeholder:text-muted-foreground",
                                errors?.phone ? "border-destructive/50 bg-destructive/10" : ""
                            )}
                        />
                        {errors?.phone && (
                            <p className="text-xs sm:text-sm text-destructive mt-1.5 sm:mt-2">{errors.phone.join(', ')}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor={`delivery-${index}`} className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                            Teslimat Noktası
                        </Label>
                        <Select
                            value={data.delivery_location}
                            onValueChange={(value) => onSelectChange(index, "delivery_location", value)}
                        >
                            <SelectTrigger
                                className={cn(
                                    "w-full border border-dashed border-[#c7ddcd] focus-visible:ring-0 focus-visible:border-[#c7ddcd] h-9 sm:h-11 text-xs sm:text-sm",
                                    errors?.delivery_location ? "border-destructive/50 bg-destructive/10" : "",
                                    !data.delivery_location && "text-muted-foreground"
                                )}
                            >
                                <SelectValue placeholder="Teslimat noktası seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="kesimhane" className="text-xs sm:text-sm">Kesimhanede Teslim</SelectItem>
                                <SelectItem value="yenimahalle-pazar-yeri" className="text-xs sm:text-sm">Yenimahalle Pazar Yeri (+500₺)</SelectItem>
                                <SelectItem value="kecioren-otoparki" className="text-xs sm:text-sm">Keçiören Otoparkı (+500₺)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors?.delivery_location && (
                            <p className="text-xs sm:text-sm text-destructive mt-1.5 sm:mt-2">{errors.delivery_location.join(', ')}</p>
                        )}
                    </div>
                    
                    {/* İşlemi yapan kişi checkbox'ı - birden fazla hissedar varsa göster */}
                    {totalForms > 1 && (
                        <div className={cn(
                            "flex items-center space-x-2 mt-3 pt-2 sm:pt-3",
                            isOtherPurchaserSelected && !isCurrentPurchaser ? "opacity-70" : ""
                        )}>
                            <Checkbox 
                                id={`is-purchaser-${index}`} 
                                checked={isCurrentPurchaser}
                                onCheckedChange={(checked) => {
                                    // Eğer zaten seçiliyse ve tekrar tıklanırsa, seçimi kaldırabiliriz
                                    if (isCurrentPurchaser && !checked) {
                                        onIsPurchaserChange(index, false);
                                    } else if (checked) {
                                        onIsPurchaserChange(index, true);
                                    }
                                }}
                                className={cn(
                                    isCurrentPurchaser 
                                        ? "border-black bg-primary text-primary-foreground shadow-none" 
                                        : "border-gray-400 shadow-none",
                                    "transition-colors duration-200 border"
                                )}
                            />
                            <Label 
                                htmlFor={`is-purchaser-${index}`}
                                className={cn(
                                    "text-xs sm:text-sm cursor-pointer transition-colors duration-200",
                                    isCurrentPurchaser 
                                        ? "font-medium" 
                                        : isOtherPurchaserSelected 
                                            ? "text-muted-foreground" 
                                            : ""
                                )}
                            >
                                İşlem bu hissedar tarafından gerçekleştirilmiştir.
                            </Label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 
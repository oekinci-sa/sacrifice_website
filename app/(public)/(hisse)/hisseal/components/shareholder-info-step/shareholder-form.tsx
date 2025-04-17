"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

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
    // Remove non-digits
    const numbers = value.replace(/\D/g, '');

    // If empty, return empty string
    if (!numbers) return '';

    // If first character is not 0, add it
    let formattedNumbers = numbers;
    if (!numbers.startsWith('0')) {
        formattedNumbers = '0' + numbers;
    }

    // Ensure second character is 5
    if (formattedNumbers.length >= 2 && formattedNumbers[1] !== '5') {
        return formattedNumbers.slice(0, 1); // Only keep the first digit
    }

    // Format the number
    if (formattedNumbers.length <= 4) return formattedNumbers;
    if (formattedNumbers.length <= 7) return `${formattedNumbers.slice(0, 4)} ${formattedNumbers.slice(4)}`;
    if (formattedNumbers.length <= 9) return `${formattedNumbers.slice(0, 4)} ${formattedNumbers.slice(4, 7)} ${formattedNumbers.slice(7)}`;
    return `${formattedNumbers.slice(0, 4)} ${formattedNumbers.slice(4, 7)} ${formattedNumbers.slice(7, 9)} ${formattedNumbers.slice(9, 11)}`;
};

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
    const deliveryOptions = ["Kesimhane", "Ulus"];
    const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const digitsOnly = value.replace(/\D/g, '');

        if (!value.startsWith('0')) {
            onInputChange(index, "phone", '0' + value);
        }

        if (!value.startsWith('05')) {
            onInputBlur(index, "phone", value);
            return;
        }

        if (digitsOnly.length !== 11) {
            onInputBlur(index, "phone", value);
            return;
        }

        onInputBlur(index, "phone", value);
    };

    // Checkbox durumu için hesaplama
    const isCurrentPurchaser = data.is_purchaser === true;

    return (
        <div className="space-y-4 rounded-[8px] border border-dashed border-[#c7ddcd] p-4 sm:p-6 ">
            {/* İlk satır */}
            <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold">
                    {index + 1}. Hissedar
                </h3>
                <Button
                    variant="ghost"
                    className="flex items-center justify-center gap-1 sm:gap-2 hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 text-lg h-9 sm:h-11"
                    onClick={() => onRemove(index)}
                >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Hisseyi sil</span>
                </Button>
            </div>

            {/* Formlar */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-4">
                    {/* Ad Soyad */}
                    <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor={`name-${index}`} className="text-slate-600 text-sm sm:text-base">
                            Ad Soyad
                        </Label>
                        <Input
                            id={`name-${index}`}
                            placeholder="Adınız"
                            value={data.name}
                            onChange={(e) => onInputChange(index, "name", e.target.value)}
                            onBlur={(e) => onInputBlur(index, "name", e.target.value)}
                            className={cn(
                                "border border-dashed border-[#c7ddcd] focus-visible:ring-0 focus-visible:border-[#c7ddcd] h-10 sm:h-12 placeholder:text-muted-foreground placeholder:text-sm sm:placeholder:text-base",
                                errors?.name ? "border-destructive/50 bg-destructive/10" : ""
                            )}
                        />
                        {errors?.name && (
                            <p className="text-lg text-destructive mt-1.5 sm:mt-2">{errors.name.join(', ')}</p>
                        )}
                    </div>
                    {/* Telefon */}
                    <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor={`phone-${index}`} className="text-slate-600 text-sm sm:text-base">
                            Telefon
                        </Label>
                        <Input
                            id={`phone-${index}`}
                            placeholder="05XX XXX XX XX"
                            value={data.phone}
                            onChange={handlePhoneChange}
                            onBlur={handlePhoneBlur}
                            className={cn(
                                "border border-dashed border-[#c7ddcd] focus-visible:ring-0 focus-visible:border-[#c7ddcd] h-10 sm:h-12 placeholder:text-muted-foreground placeholder:text-sm sm:placeholder:text-base",
                                errors?.phone ? "border-destructive/50 bg-destructive/10" : ""
                            )}
                        />
                        {errors?.phone && (
                            <p className="text-lg text-destructive mt-1.5 sm:mt-2">{errors.phone.join(', ')}</p>
                        )}
                    </div>
                </div>
                {/* Teslimat Tercihi */}
                <div className="space-y-1.5 sm:space-y-2">
                    <Label
                        htmlFor={`delivery_location-${index}`}
                        className="text-slate-600 text-sm sm:text-base"
                    >
                        Teslimat Tercihi
                    </Label>

                    <div className="flex gap-4 w-1/2">
                        {deliveryOptions.map((option) => (
                            <Button
                                key={option}
                                type="button"
                                onClick={() => onSelectChange(index, "delivery_location", option)}
                                className={cn(
                                    "flex-1 border border-gray-200 hover:text-white transition-all text-base h-12",
                                    data.delivery_location === option
                                        ? "bg-sac-primary text-white hover:bg-sac-primary"
                                        : "bg-background text-foreground hover:bg-sac-primary",
                                    errors?.delivery_location ? "border-destructive/50 bg-destructive/10" : ""
                                )}
                            >
                                {option}
                            </Button>
                        ))}
                    </div>

                    {errors?.delivery_location && (
                        <p className="text-lg text-destructive mt-1.5 sm:mt-2">{errors.delivery_location.join(', ')}</p>
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
                                "text-lg cursor-pointer transition-colors duration-200",
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
    )
} 
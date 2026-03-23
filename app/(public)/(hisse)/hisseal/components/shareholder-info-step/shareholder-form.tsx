"use client"

import { useTenantBranding } from "@/hooks/useTenantBranding"
import { getDeliveryOptions, getDeliveryLocationFromSelection, getDeliverySelectionFromLocation, hasAdreseTeslimOption } from "@/lib/delivery-options"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toTitleCase } from "@/utils/formatters"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ShareholderFormProps {
    data: {
        name: string
        phone: string
        email?: string
        delivery_location: string
        second_phone?: string
        is_purchaser?: boolean
    }
    index: number
    errors: {
        name?: string[]
        phone?: string[]
        email?: string[]
        delivery_location?: string[]
        delivery_address?: string[]
        second_phone?: string[]
        is_purchaser?: string[]
    }
    onInputChange: (index: number, field: "name" | "phone" | "email" | "delivery_location" | "second_phone", value: string) => void
    onInputBlur: (index: number, field: "name" | "phone" | "email" | "delivery_location" | "second_phone", value: string) => void
    onSelectChange: (index: number, field: "name" | "phone" | "email" | "delivery_location", value: string) => void
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
    const handleSecondPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        onInputChange(index, "second_phone", formattedValue);
    };
    const branding = useTenantBranding();
    const deliveryOptionsData = getDeliveryOptions(branding.logo_slug);

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

    const handleSecondPhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!value.startsWith("0") && value) {
            onInputChange(index, "second_phone", "0" + value);
        }
        onInputBlur(index, "second_phone", value);
    };

    const showSecondPhone = hasAdreseTeslimOption(branding.logo_slug) &&
        getDeliverySelectionFromLocation(branding.logo_slug, data.delivery_location || "") === "Adrese teslim";

    // Checkbox durumu için hesaplama
    const isCurrentPurchaser = data.is_purchaser === true;

    return (
        <div className="max-w-3xl p-4 md:p-6 border border-dashed border-sac-border-light rounded-[8px] md:space-y-4 ">
            {/* İlk satır */}
            <div className="flex items-center justify-between mb-2 md:mb-4">
                <h3 className="text-sm md:text-xl font-semibold">
                    {index + 1}. Hissedar
                </h3>
                <Button
                    variant="ghost"
                    className="flex items-center justify-center gap-1 md:gap-2 hover:bg-sac-red text-sac-red hover:text-white transition-all duration-300 text-lg h-9 md:h-11"
                    onClick={() => onRemove(index)}
                >
                    <X className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-sm md:text-base">Hisseyi sil</span>
                </Button>
            </div>

            {/* Inputlar */}
            <div className="flex flex-col gap-3 md:gap-4">
                {/* Ad Soyad */}
                <div className="space-y-1.5 md:space-y-2 w-full">
                    <Label htmlFor={`name-${index}`} className="text-slate-600 text-sm md:text-base">
                        Ad Soyad
                    </Label>
                    <Input
                        id={`name-${index}`}
                        placeholder="Adınız"
                        value={data.name}
                        onChange={(e) => onInputChange(index, "name", e.target.value)}
                        onBlur={(e) => {
                          const formatted = toTitleCase(e.target.value);
                          if (formatted !== e.target.value) {
                            onInputChange(index, "name", formatted);
                          }
                          onInputBlur(index, "name", formatted);
                        }}
                        className={cn(
                            "h-10 md:h-12 text-base md:text-[18px] border border-dashed border-sac-border-light focus-visible:ring-0 focus-visible:border-sac-border-light placeholder:text-muted-foreground placeholder:text-base md:placeholder:text-[18px]",
                            errors?.name ? "border-destructive/50 bg-destructive/10" : ""
                        )}
                    />
                    {errors?.name && (
                        <p className="text-sm md:text-lg text-destructive mt-1.5 md:mt-2">{errors.name.join(', ')}</p>
                    )}
                </div>

                {/* Telefon ve İkinci Telefon (yan yana, birbirine yakın) */}
                <div className={cn("flex flex-col gap-4", showSecondPhone ? "md:flex-row md:gap-4" : "")}>
                    <div className="space-y-1.5 md:space-y-2 flex-1">
                        <Label htmlFor={`phone-${index}`} className="text-slate-600 text-sm md:text-base">
                            Telefon
                        </Label>
                        <Input
                            id={`phone-${index}`}
                            placeholder="05XX XXX XX XX"
                            value={data.phone}
                            onChange={handlePhoneChange}
                            onBlur={handlePhoneBlur}
                            className={cn(
                                "h-10 md:h-12 text-base md:text-[18px] border border-dashed border-sac-border-light focus-visible:ring-0 focus-visible:border-sac-border-light placeholder:text-muted-foreground placeholder:text-base md:placeholder:text-[18px]",
                                errors?.phone ? "border-destructive/50 bg-destructive/10" : ""
                            )}
                        />
                        {errors?.phone && (
                            <p className="text-sm md:text-lg text-destructive mt-1.5 md:mt-2">{errors.phone.join(', ')}</p>
                        )}
                    </div>
                    {showSecondPhone && (
                        <div className="space-y-1.5 md:space-y-2 flex-1">
                            <Label htmlFor={`second_phone-${index}`} className="text-slate-600 text-sm md:text-base">
                                İkinci Telefon (Teslimat için)
                            </Label>
                            <Input
                                id={`second_phone-${index}`}
                                placeholder="05XX XXX XX XX"
                                value={data.second_phone ?? ""}
                                onChange={handleSecondPhoneChange}
                                onBlur={handleSecondPhoneBlur}
                                className={cn(
                                    "h-10 md:h-12 text-base md:text-[18px] border border-dashed border-sac-border-light focus-visible:ring-0 focus-visible:border-sac-border-light placeholder:text-muted-foreground placeholder:text-base md:placeholder:text-[18px]",
                                    errors?.second_phone ? "border-destructive/50 bg-destructive/10" : ""
                                )}
                            />
                            {errors?.second_phone && (
                                <p className="text-sm md:text-lg text-destructive mt-1.5 md:mt-2">{errors.second_phone.join(", ")}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* E-posta (İsteğe bağlı) */}
                <div className="space-y-1.5 md:space-y-2 w-full">
                    <Label
                        htmlFor={`email-${index}`}
                        className="text-slate-600 text-sm md:text-base"
                    >
                        E-posta (İsteğe bağlı)
                    </Label>
                    <Input
                        id={`email-${index}`}
                        type="email"
                        placeholder="ornek@email.com"
                        value={data.email ?? ""}
                        onChange={(e) => onInputChange(index, "email", e.target.value)}
                        onBlur={(e) => onInputBlur(index, "email", e.target.value)}
                        className={cn(
                            "h-10 md:h-12 text-base md:text-[18px] border border-dashed border-sac-border-light focus-visible:ring-0 focus-visible:border-sac-border-light placeholder:text-muted-foreground placeholder:text-base md:placeholder:text-[18px]",
                            errors?.email ? "border-destructive/50 bg-destructive/10" : ""
                        )}
                    />
                    {errors?.email && (
                        <p className="text-sm md:text-lg text-destructive mt-1.5 md:mt-2">{errors.email.join(", ")}</p>
                    )}
                </div>

                {/* Teslimat Tercihi ve Teslimat Adresi — her zaman alt alta */}
                <div className="flex flex-col gap-4 w-full">
                    <div className="space-y-1.5 md:space-y-2 w-full">
                        <Label
                            htmlFor={`delivery_location-${index}`}
                            className="text-slate-600 text-sm md:text-base"
                        >
                            Teslimat Tercihi
                        </Label>
                        <Select
                            value={getDeliverySelectionFromLocation(branding.logo_slug, data.delivery_location || "")}
                            onValueChange={(selection) => {
                                const loc = getDeliveryLocationFromSelection(branding.logo_slug, selection);
                                onSelectChange(index, "delivery_location", loc);
                            }}
                        >
                            <SelectTrigger
                                id={`delivery_location-${index}`}
                                className={cn(
                                    "h-10 md:h-12 text-base md:text-[18px] border border-dashed border-sac-border-light",
                                    errors?.delivery_location ? "border-destructive/50 bg-destructive/10" : ""
                                )}
                            >
                                <SelectValue placeholder="Teslimat tercihini seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {deliveryOptionsData.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.delivery_location && (
                            <p className="text-sm md:text-lg text-destructive mt-1.5 md:mt-2">{errors.delivery_location.join(", ")}</p>
                        )}
                    </div>
                    {/* Teslimat Adresi — teslimat tercihinin altında (Elya + Adrese teslim) */}
                    {branding.logo_slug === "elya-hayvancilik" &&
                     getDeliverySelectionFromLocation(branding.logo_slug, data.delivery_location || "") === "Adrese teslim" && (
                        <div className="space-y-1.5 md:space-y-2 w-full">
                            <Label htmlFor={`delivery_address-${index}`} className="text-slate-600 text-sm md:text-base">
                                Teslimat Adresi
                            </Label>
                            <Input
                                id={`delivery_address-${index}`}
                                placeholder="Lütfen adresinizi ayrıntılı bir şekilde yazınız. (en az 20 karakter)"
                                value={
                                    data.delivery_location &&
                                    data.delivery_location !== "Gölbaşı" &&
                                    data.delivery_location !== "Adrese teslim" &&
                                    data.delivery_location !== "-"
                                        ? data.delivery_location
                                        : ""
                                }
                                onChange={(e) => onInputChange(index, "delivery_location", e.target.value)}
                                onBlur={(e) => onInputBlur(index, "delivery_location", e.target.value)}
                                className={cn(
                                    "h-10 md:h-12 text-base md:text-[18px] border border-dashed border-sac-border-light",
                                    errors?.delivery_address ? "border-destructive/50 bg-destructive/10" : ""
                                )}
                            />
                            {errors?.delivery_address && (
                                <p className="text-sm md:text-lg text-destructive mt-1.5 md:mt-2">{errors.delivery_address.join(", ")}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* İşlemi yapan kişi checkbox'ı - birden fazla hissedar varsa göster */}
                {totalForms > 1 && (
                    <div className={cn(
                        "flex items-center space-x-2 mt-3 pt-2 md:pt-3",
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
                                "text-sm md:text-base cursor-pointer transition-colors duration-200",
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
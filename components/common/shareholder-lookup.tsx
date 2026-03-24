"use client";

import { ShareholderDetails } from "@/app/(public)/(hisse)/hissesorgula/components/shareholder-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useShareholderLookupByPhone } from "@/hooks/useShareholderLookupByPhone";
import { formatDateShort } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ShareholderAccordionProps {
    shareholders: shareholderSchema[];
    phoneDigits: string;
    securityCode: string;
}

function ShareholderAccordion({ shareholders, phoneDigits, securityCode }: ShareholderAccordionProps) {
    return (
        <AccordionPrimitive.Root
            type="multiple"
            defaultValue={[]}
            className="w-full space-y-3"
        >
            {shareholders.map((info, index) => (
                <AccordionPrimitive.Item
                    key={info.shareholder_id}
                    value={`shareholder-${index}`}
                    className="rounded-xl border border-border overflow-hidden"
                >
                    <AccordionPrimitive.Header className="flex">
                        <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between px-4 py-4 md:px-6 text-left font-semibold text-base md:text-lg bg-muted/40 hover:bg-muted/60 transition-colors [&[data-state=open]>svg]:rotate-180">
                            <span className="flex items-baseline gap-2 flex-wrap">
                                <span>{index + 1}. {info.shareholder_name}</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    {formatDateShort(info.purchase_time)}
                                </span>
                            </span>
                            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ml-3" />
                        </AccordionPrimitive.Trigger>
                    </AccordionPrimitive.Header>
                    <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <ShareholderDetails
                            shareholderInfo={info}
                            lookupContext={{ phoneDigits, securityCode }}
                            inAccordion
                        />
                    </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
            ))}
        </AccordionPrimitive.Root>
    );
}

interface ShareholderLookupProps {
    onResultsFound?: (shareholders: shareholderSchema[]) => void;
}

// Telefon numarası formatlama fonksiyonu
const formatPhoneNumber = (value: string) => {
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');

    // Eğer numara boşsa, boş string döndür
    if (!numbers) return '';

    // Başında 0 varsa
    if (numbers.startsWith('0')) {
        if (numbers.length <= 4) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
        if (numbers.length <= 10) return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`;
        return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
    }

    // Başında 0 yoksa, otomatik ekle
    const withZero = '0' + numbers;
    if (withZero.length <= 4) return withZero;
    if (withZero.length <= 7) return `${withZero.slice(0, 4)} ${withZero.slice(4)}`;
    if (withZero.length <= 10) return `${withZero.slice(0, 4)} ${withZero.slice(4, 7)} ${withZero.slice(7)}`;
    return `${withZero.slice(0, 4)} ${withZero.slice(4, 7)} ${withZero.slice(7, 9)} ${withZero.slice(9, 11)}`;
};

// Telefon numarası doğrulama fonksiyonu
const validatePhoneNumber = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (!digitsOnly.startsWith('0')) return false;
    if (digitsOnly.length !== 11) return false;
    if (!digitsOnly.startsWith('05')) return false;
    return true;
};

export function ShareholderLookup({ onResultsFound }: ShareholderLookupProps) {
    const [phone, setPhone] = useState("");
    const [securityCode, setSecurityCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [shareholderInfoList, setShareholderInfoList] = useState<shareholderSchema[]>([]);
    const { toast } = useToast();

    // Use the shareholder lookup mutation (phone + security code)
    const shareholderLookup = useShareholderLookupByPhone();

    // Animation variants for results
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 50 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const resultsRef = useRef<HTMLDivElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);

    // Scroll to results when shareholders are loaded
    useEffect(() => {
        if (shareholderInfoList.length > 0 && resultsRef.current) {
            resultsRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [shareholderInfoList]);

    // Call callback when results are found
    useEffect(() => {
        if (shareholderInfoList.length > 0 && onResultsFound) {
            onResultsFound(shareholderInfoList);
        }
    }, [shareholderInfoList, onResultsFound]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const sel = input.selectionStart ?? 0;
        const digitsBefore = input.value.slice(0, sel).replace(/\D/g, "").length;

        const numbers = input.value.replace(/\D/g, "").slice(0, 11);
        const formattedValue = formatPhoneNumber(numbers);
        setPhone(formattedValue);
        setError(null);

        requestAnimationFrame(() => {
            const el = phoneInputRef.current;
            if (!el) return;
            let digitCount = 0;
            let newPos = formattedValue.length;
            for (let i = 0; i < formattedValue.length; i++) {
                if (/\d/.test(formattedValue[i])) {
                    digitCount += 1;
                    if (digitCount >= digitsBefore) {
                        newPos = i + 1;
                        break;
                    }
                }
            }
            el.setSelectionRange(newPos, newPos);
        });
    };

    const handleSearch = async () => {
        // Telefon numarası kontrolü
        if (!phone) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Lütfen telefon numarası giriniz.",
            });
            return;
        }

        // Güvenlik kodu kontrolü
        const codeDigits = securityCode.replace(/\D/g, "");
        if (codeDigits.length !== 6) {
            setError("Lütfen 6 haneli güvenlik kodunuzu giriniz.");
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Lütfen 6 haneli güvenlik kodunuzu giriniz.",
            });
            return;
        }

        // Telefon numarası doğrulama
        if (!validatePhoneNumber(phone)) {
            setError("Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX)");
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX)",
            });
            return;
        }

        try {
            setError(null);
            setShareholderInfoList([]);

            // Use our mutation to lookup shareholders (phone + security code)
            const result = await shareholderLookup.mutateAsync({
                phone,
                securityCode: codeDigits,
            });

            // If we get here, the lookup was successful
            const shareholders = result.shareholders;

            setShareholderInfoList(shareholders);

            toast({
                title: "Başarılı",
                description: `${shareholders.length} adet hissedar kaydı bulundu.`,
            });
        } catch (err) {
            // Show the error message from the API or a fallback
            const errorMessage = err instanceof Error
                ? err.message
                : "Bilgiler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.";

            setError(errorMessage);

            toast({
                variant: "destructive",
                title: "Hata",
                description: errorMessage,
            });
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div>
            {/* Search Form */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto rounded-md mb-8">
                <Input
                    ref={phoneInputRef}
                    id="phone"
                    type="tel"
                    placeholder="Telefon numaranızı giriniz."
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyPress={handleKeyPress}
                    className={cn(
                        "text-sm md:text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-center",
                        error ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                />
                <Input
                    id="security_code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 haneli güvenlik kodu"
                    value={securityCode}
                    onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setSecurityCode(v);
                        setError(null);
                    }}
                    onKeyPress={handleKeyPress}
                    className={cn(
                        "text-sm md:text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-center",
                        error ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                />
                <Button
                    onClick={handleSearch}
                    className="whitespace-nowrap font-light text-base md:text-lg"
                    disabled={shareholderLookup.isPending}
                >
                    <Search className="w-4 h-4 mr-1" />
                    {shareholderLookup.isPending ? "Yükleniyor..." : "Sorgula"}
                </Button>
            </div>

            {/* Results Section */}
            {shareholderInfoList.length > 0 && (
                <motion.div
                    ref={resultsRef}
                    className="w-full"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {shareholderInfoList.length === 1 ? (
                        <motion.div variants={item}>
                            <ShareholderDetails
                                shareholderInfo={shareholderInfoList[0]}
                                lookupContext={{
                                    phoneDigits: phone.replace(/\D/g, ""),
                                    securityCode: securityCode.replace(/\D/g, "").slice(0, 6),
                                }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div variants={item}>
                            <ShareholderAccordion
                                shareholders={shareholderInfoList}
                                phoneDigits={phone.replace(/\D/g, "")}
                                securityCode={securityCode.replace(/\D/g, "").slice(0, 6)}
                            />
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
} 
"use client";

import { ShareholderDetails } from "@/app/(public)/(hisse)/hissesorgula/components/shareholder-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useShareholderLookupByPhone } from "@/hooks/useShareholderLookupByPhone";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    const [error, setError] = useState<string | null>(null);
    const [shareholderInfoList, setShareholderInfoList] = useState<shareholderSchema[]>([]);
    const { toast } = useToast();

    // Use the shareholder lookup mutation
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
        const formattedValue = formatPhoneNumber(e.target.value);
        setPhone(formattedValue);
        setError(null);
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

            // Use our mutation to lookup shareholders
            const result = await shareholderLookup.mutateAsync({
                phone
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
            <div className="flex gap-4 max-w-md mx-auto rounded-md mb-8">
                <Input
                    id="phone"
                    type="tel"
                    placeholder="Telefon numaranızı giriniz."
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyPress={handleKeyPress}
                    className={cn(
                        " text-sm md:text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-center",
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
                    <div className="grid grid-cols-1 gap-y-8">
                        {shareholderInfoList.map((info, index) => (
                            <motion.div
                                key={info.shareholder_id}
                                className="w-full"
                                variants={item}
                            >
                                {shareholderInfoList.length > 1 && (
                                    <h3 className="md:text-lg text-center font-medium mb-2 md:mb-4">
                                        {index + 1}. Kayıt - {new Date(info.purchase_time).toLocaleDateString('tr-TR')}
                                    </h3>
                                )}
                                <ShareholderDetails shareholderInfo={info} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
} 
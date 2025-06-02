import { shareholderSchema } from "@/types";
import { useState } from "react";

interface ShareholderLookupByPhoneParams {
    phone: string;
}

interface ShareholderLookupResponse {
    shareholders: shareholderSchema[];
}

export const useShareholderLookupByPhone = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<ShareholderLookupResponse | null>(null);

    const mutate = async ({ phone }: ShareholderLookupByPhoneParams) => {
        setIsLoading(true);
        setError(null);

        try {
            // Format phone for query
            const formattedPhone = phone.replace(/\D/g, '');

            // Ensure valid parameters
            if (!formattedPhone) {
                throw new Error("Telefon numarası gereklidir");
            }

            // Make API request
            const response = await fetch(
                `/api/get-shareholders-by-phone?phone=${encodeURIComponent(formattedPhone)}`
            );

            if (!response.ok) {
                const errorData = await response.json();

                // Handle different error types based on status
                if (response.status === 404) {
                    throw new Error("Bu telefon numarasına ait kayıt bulunamadı");
                } else {
                    throw new Error(errorData.error || "Bir hata oluştu. Lütfen tekrar deneyiniz");
                }
            }

            const responseData = await response.json();
            setData(responseData);
            setIsLoading(false);
            return responseData;
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            setIsLoading(false);
            throw errorObj;
        }
    };

    // React Query API uyumluluğu için mutateAsync da ekleyelim
    return {
        mutate,
        mutateAsync: mutate,
        isLoading,
        isPending: isLoading,
        error,
        data,
        status: isLoading ? 'loading' : error ? 'error' : data ? 'success' : 'idle'
    };
}; 
import { shareholderSchema } from "@/types";
import { useState } from "react";

interface ShareholderLookupParams {
  phone: string;
  securityCode: string;
}

interface ShareholderLookupResponse {
  shareholders: shareholderSchema[];
}

export const useShareholderLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ShareholderLookupResponse | null>(null);

  const mutate = async ({ phone, securityCode }: ShareholderLookupParams) => {
    setIsLoading(true);
    setError(null);

    try {
      // Format phone for query
      const formattedPhone = phone.replace(/\D/g, '');
      
      // Ensure valid parameters
      if (!formattedPhone || !securityCode) {
        throw new Error("Telefon numarası ve güvenlik kodu gereklidir");
      }
      
      // Make API request
      const response = await fetch(
        `/api/get-shareholder-by-phone-and-code?phone=${encodeURIComponent(formattedPhone)}&security_code=${encodeURIComponent(securityCode)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle different error types based on status
        if (response.status === 404) {
          throw new Error("Bu telefon numarasına ait kayıt bulunamadı");
        } else if (response.status === 401) {
          throw new Error("Güvenlik kodu hatalı. Lütfen tekrar deneyiniz");
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
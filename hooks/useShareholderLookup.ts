import { useMutation } from "@tanstack/react-query";
import { shareholderSchema } from "@/types";

interface ShareholderLookupParams {
  phone: string;
  securityCode: string;
}

interface ShareholderLookupResponse {
  shareholders: shareholderSchema[];
}

export const useShareholderLookup = () => {
  return useMutation<ShareholderLookupResponse, Error, ShareholderLookupParams>({
    mutationFn: async ({ phone, securityCode }: ShareholderLookupParams) => {
      // Format phone for query
      let formattedPhone = phone.replace(/\D/g, '');
      
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
      
      const data = await response.json();
      return data;
    },
  });
}; 
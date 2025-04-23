import { useToast } from "@/components/ui/use-toast";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import { useEffect, useState } from "react";


// Define the structure for a single shareholder as expected by the API
interface ShareholderInput {
  shareholder_name: string;
  phone_number: string;
  transaction_id: string;
  sacrifice_id: string;
  share_price: number;
  delivery_fee?: number; // Optional
  delivery_location: string;
  security_code: string;
  purchased_by: string;
  last_edited_by: string;
  is_purchaser?: boolean; // Made optional as it's only used locally
  sacrifice_consent?: boolean; // Made optional since it's not required when creating shareholders
  total_amount: number; // Total amount = share_price + delivery_fee
  remaining_payment: number; // Remaining payment = total_amount - paid_amount
}

// Create shareholders hook with Zustand
export const useCreateShareholders = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const updateShareholder = useShareholderStore(state => state.updateShareholder);

  const mutate = async (shareholdersData: ShareholderInput[]) => {
    if (!shareholdersData || shareholdersData.length === 0) {
      throw new Error("Hissedar bilgileri boş olamaz");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-shareholders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shareholdersData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Hissedarlar oluşturulamadı.");
      }

      // Update store with the new shareholders
      if (Array.isArray(result.data)) {
        result.data.forEach((shareholder: shareholderSchema) => {
          updateShareholder(shareholder);
        });
      }

      setIsLoading(false);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Hissedar bilgileri kaydedilirken bir hata oluştu";

      toast({
        variant: "destructive",
        title: "Hata",
        description: errorMessage,
      });

      setError(err instanceof Error ? err : new Error(errorMessage));
      setIsLoading(false);
      throw err;
    }
  };

  return {
    mutate,
    mutateAsync: mutate, // React Query uyumluluğu için mutateAsync ekledik
    isLoading,
    error,
    isPending: isLoading,
    status: isLoading ? 'loading' : error ? 'error' : 'idle'
  };
};

// Get shareholders hook is already implemented

// Update shareholder hook with Zustand
export const useUpdateShareholder = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const updateStoreSharehoder = useShareholderStore(state => state.updateShareholder);

  const mutate = async ({
    shareholderId,
    data
  }: {
    shareholderId: string
    data: Partial<shareholderSchema>
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Include the shareholderId in the request body
      const payload = {
        ...data,
        shareholder_id: shareholderId,
        // Make sure last_edited_by is included if not already in data
        last_edited_by: data.last_edited_by || 'admin-user'
      };

      const response = await fetch(`/api/update-shareholder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Hissedar güncellenirken bir hata oluştu');
      }

      const result = await response.json();

      // Update the store with the updated data
      if (result.data) {
        updateStoreSharehoder(result.data);
      }

      setIsLoading(false);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hissedar güncellenirken bir hata oluştu';

      toast({
        variant: 'destructive',
        title: 'Hata',
        description: errorMessage
      });

      setError(err instanceof Error ? err : new Error(errorMessage));
      setIsLoading(false);
      throw err;
    }
  };

  return {
    mutate,
    isLoading,
    error
  };
};

// Delete shareholder hook with Zustand
export const useDeleteShareholder = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { updateShareholder, fetchShareholders } = useShareholderStore();

  const mutate = async (shareholderId: string) => {
    if (!shareholderId) {
      throw new Error("Silinecek hissedar ID'si gerekli");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/delete-shareholder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareholder_id: shareholderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Hissedar silinirken bir hata oluştu');
      }

      // Refresh shareholders after deletion
      await fetchShareholders();

      setIsLoading(false);
      return { deleted: true, shareholder_id: shareholderId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hissedar silinirken bir hata oluştu';

      toast({
        variant: 'destructive',
        title: 'Hata',
        description: errorMessage
      });

      setError(err instanceof Error ? err : new Error(errorMessage));
      setIsLoading(false);
      throw err;
    }
  };

  return {
    mutate,
    isLoading,
    error
  };
};

// Get all shareholders with Zustand
export const useGetShareholders = () => {
  const { fetchShareholders, shareholders, isLoading, error } = useShareholderStore();

  useEffect(() => {
    fetchShareholders();
  }, [fetchShareholders]);

  return {
    data: shareholders,
    isLoading,
    error,
    refetch: fetchShareholders
  };
};

// Get shareholders by sacrifice ID
export const useGetShareholdersBySacrificeId = (sacrificeId: string) => {
  const { shareholders, isLoading, error, fetchShareholders } = useShareholderStore();
  const [filteredData, setFilteredData] = useState<shareholderSchema[]>([]);

  useEffect(() => {
    // Ensure we have shareholders data
    if (shareholders.length === 0) {
      fetchShareholders();
    }

    // Filter shareholders by sacrifice_id
    if (sacrificeId && shareholders.length > 0) {
      const filtered = shareholders.filter(
        shareholder => shareholder.sacrifice_id === sacrificeId
      );
      setFilteredData(filtered);
    } else {
      setFilteredData([]);
    }
  }, [sacrificeId, shareholders, fetchShareholders]);

  return {
    data: filteredData,
    isLoading,
    error,
    refetch: fetchShareholders
  };
};

// Get shareholders by transaction ID with Zustand
export const useGetShareholdersByTransactionId = (transactionId: string) => {
  const { fetchShareholdersByTransactionId } = useShareholderStore();
  const [data, setData] = useState<shareholderSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setData([]);
      return;
    }

    setIsLoading(true);
    fetchShareholdersByTransactionId(transactionId)
      .then((result) => {
        setData(result);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  }, [transactionId, fetchShareholdersByTransactionId]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchShareholdersByTransactionId(transactionId)
  };
};
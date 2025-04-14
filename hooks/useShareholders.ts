import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/utils/supabaseClient"
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"
import { shareholderSchema } from "@/types"

// Türkiye saati için yardımcı fonksiyon
function getTurkeyDateTime() {
  return new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    .replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, function(_, day, month, year, hour, minute, second) {
      // Formatlı tarih string'i: YYYY-MM-DD HH:MM:SS.ssssss
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}.000000`;
    });
}

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

// Modified hook to use the API endpoint
export const useCreateShareholders = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, ShareholderInput[]>({
    mutationFn: async (shareholdersData) => {
      if (!shareholdersData || shareholdersData.length === 0) {
        throw new Error("Hissedar bilgileri boş olamaz");
      }

      console.log('[HOOK] Calling /api/create-shareholders with:', shareholdersData);

      const response = await fetch("/api/create-shareholders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shareholdersData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[HOOK] API Error creating shareholders:', result);
        throw new Error(result.error || "Hissedarlar oluşturulamadı.");
      }
      
      console.log('[HOOK] API Success creating shareholders:', result);
      return result.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["shareholders"] });
      // Optionally return snapshot value here if needed for optimistic updates
    },
    onError: (error) => {
      console.error("[HOOK] Error creating shareholders:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Hissedar bilgileri kaydedilirken bir hata oluştu",
      });
    },
    onSuccess: () => {
      // Invalidate cache to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["shareholders"] });
      // We might not need a success toast here if the parent component handles it
      // toast({
      //   title: "Başarılı",
      //   description: "Hissedarlar başarıyla kaydedildi",
      // });
    },
  });
};

// New hook for fetching shareholders with real-time updates
export const useGetShareholders = (searchQuery?: string) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Define the query key including the search parameter
  const queryKey = searchQuery 
    ? ["shareholders", { search: searchQuery }] 
    : ["shareholders"]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("shareholders")
        .select(`
          *,
          sacrifice:sacrifice_id (
            sacrifice_id,
            sacrifice_no,
            sacrifice_time,
            share_price
          )
        `)
        .order('purchase_time', { ascending: false })
      
      // Apply search filter if provided - keeping this for compatibility
      if (searchQuery) {
        const formattedSearch = searchQuery.toLowerCase()
        query = query.or(
          `shareholder_name.ilike.%${formattedSearch}%,phone_number.ilike.%${formattedSearch}%,sacrifice.sacrifice_no.ilike.%${formattedSearch}%`
        )
      }
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(`Hissedar verileri alınamadı: ${error.message}`)
      }
      
      return data as shareholderSchema[]
    },
  })

  // Set up real-time subscription
  useEffect(() => {
    // Only set up subscription if the query was successful
    if (query.isSuccess) {
      const subscription = supabase
        .channel('shareholders-changes')
        .on('postgres_changes', 
          {
            event: '*', 
            schema: 'public',
            table: 'shareholders'
          }, 
          (payload) => {
            // Handle the different types of changes
            if (payload.eventType === 'INSERT') {
              // Fetch the complete record with joins
              supabase
                .from("shareholders")
                .select(`
                  *,
                  sacrifice:sacrifice_id (
                    sacrifice_id,
                    sacrifice_no,
                    sacrifice_time,
                    share_price
                  )
                `)
                .eq('shareholder_id', payload.new.shareholder_id)
                .single()
                .then(({ data, error }) => {
                  if (!error && data) {
                    // Update cache with the new record
                    queryClient.setQueryData(["shareholders"], (oldData: shareholderSchema[] | undefined) => {
                      if (!oldData) return [data as shareholderSchema]
                      return [data as shareholderSchema, ...oldData]
                    })
                  }
                })
            } else if (payload.eventType === 'UPDATE') {
              // Fetch the updated record with joins
              supabase
                .from("shareholders")
                .select(`
                  *,
                  sacrifice:sacrifice_id (
                    sacrifice_id,
                    sacrifice_no,
                    sacrifice_time,
                    share_price
                  )
                `)
                .eq('shareholder_id', payload.new.shareholder_id)
                .single()
                .then(({ data, error }) => {
                  if (!error && data) {
                    // Update the specific record in the cache
                    queryClient.setQueryData(["shareholders"], (oldData: shareholderSchema[] | undefined) => {
                      if (!oldData) return [data as shareholderSchema]
                      return oldData.map(item => 
                        item.shareholder_id === data.shareholder_id 
                          ? data as shareholderSchema 
                          : item
                      )
                    })
                  }
                })
            } else if (payload.eventType === 'DELETE') {
              // Remove the deleted record from the cache
              queryClient.setQueryData(["shareholders"], (oldData: shareholderSchema[] | undefined) => {
                if (!oldData) return []
                return oldData.filter(item => item.shareholder_id !== payload.old.shareholder_id)
              })
            }
        })
        .subscribe()

      // Clean up subscription on unmount
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [query.isSuccess, queryClient])

  return query
}

// Update a shareholder
export const useUpdateShareholder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      shareholderId,
      data
    }: {
      shareholderId: string
      data: Partial<shareholderSchema>
    }) => {
      const { error } = await supabase
        .from("shareholders")
        .update(data)
        .eq("shareholder_id", shareholderId)

      if (error) {
        throw new Error(error.message)
      }
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["shareholders"] })
      // Optimistic update logic can be added here
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Hissedar güncellenirken hata oluştu",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareholders"] })
      toast({
        title: "Başarılı",
        description: "Hissedar başarıyla güncellendi"
      })
    }
  })
}

// Delete a shareholder
export const useDeleteShareholder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (shareholderId: string) => {
      const { error } = await supabase
        .from("shareholders")
        .delete()
        .eq("shareholder_id", shareholderId)

      if (error) {
        throw new Error(error.message)
      }
    },
    onMutate: async (shareholderId) => {
      await queryClient.cancelQueries({ queryKey: ["shareholders"] })
      // Optimistic update: remove the shareholder from the cache
      const previousShareholders = queryClient.getQueryData<shareholderSchema[]>(["shareholders"])
      queryClient.setQueryData<shareholderSchema[]>(["shareholders"], (old) => 
        old?.filter((s) => s.shareholder_id !== shareholderId) ?? []
      )
      return { previousShareholders } // Return snapshot
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousShareholders) {
        queryClient.setQueryData(["shareholders"], context.previousShareholders)
      }
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Hissedar silinirken hata oluştu",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareholders"] })
      toast({
        title: "Başarılı",
        description: "Hissedar başarıyla silindi"
      })
    }
  })
}

// Transaction ID ile hissedarları getiren hook
export const useGetShareholdersByTransactionId = (transaction_id: string) => {
  return useQuery({
    queryKey: ['shareholders', transaction_id],
    queryFn: async () => {
      if (!transaction_id) {
        throw new Error('transaction_id is required');
      }
      
      const response = await fetch(`/api/get-shareholder-by-transaction_id?transaction_id=${transaction_id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch shareholder data');
      }
      
      return response.json();
    },
    enabled: !!transaction_id, // Sorguyu yalnızca transaction_id varsa aktifleştir
    staleTime: 0, // Her zaman güncel veri almak için
    retry: 1, // Hata durumunda bir kez daha dene
  });
};
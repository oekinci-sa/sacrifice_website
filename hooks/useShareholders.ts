import { useToast } from "@/components/ui/use-toast"
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore"
import { shareholderSchema } from "@/types"
import { supabase } from "@/utils/supabaseClient"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"

// Türkiye saati için yardımcı fonksiyon
function getTurkeyDateTime() {
  return new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    .replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, function (_, day, month, year, hour, minute, second) {
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
  // Get the store's addShareholder action
  const addShareholder = useShareholderStore(state => state.addShareholder);

  return useMutation<any, Error, ShareholderInput[]>({
    mutationFn: async (shareholdersData) => {
      if (!shareholdersData || shareholdersData.length === 0) {
        throw new Error("Hissedar bilgileri boş olamaz");
      }


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

      return result.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["shareholders"] });
      // Optionally return snapshot value here if needed for optimistic updates
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Hissedar bilgileri kaydedilirken bir hata oluştu",
      });
    },
    onSuccess: (data) => {
      // Update global store directly with the new shareholders
      if (Array.isArray(data)) {
        data.forEach(shareholder => {
          addShareholder(shareholder);
        });
      }

      // Also invalidate the cache for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["shareholders"] });
    },
  });
};

// New hook for fetching shareholders with real-time updates
export const useGetShareholders = (searchQuery?: string) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const store = useShareholderStore()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribing = useRef(false);

  // Define the query key including the search parameter
  const queryKey = searchQuery
    ? ["shareholders", { search: searchQuery }]
    : ["shareholders"]

  // Setup the real-time subscription with useCallback
  const setupRealtimeChannel = useCallback(() => {
    // Only set up subscription if not searching and not already subscribing
    if (searchQuery || isSubscribing.current) return;
    isSubscribing.current = true;

    try {
      // Cleanup existing subscription
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Create channel with unique name
      const channelName = `shareholders-changes-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create new subscription
      channelRef.current = supabase
        .channel(channelName)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shareholders'
          },
          (payload) => {
            // Handle the different types of changes
            if (payload.eventType === 'INSERT') {
              // Use async function to handle promises with try/catch
              (async () => {
                try {
                  // Fetch the complete record with joins
                  const { data, error } = await supabase
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
                    .single();

                  if (error) {
                    console.error("Error fetching inserted shareholder:", error);
                    return;
                  }

                  if (data) {
                    // Update cache with the new record
                    queryClient.setQueryData(["shareholders"], (oldData: shareholderSchema[] | undefined) => {
                      if (!oldData) return [data as shareholderSchema]
                      return [data as shareholderSchema, ...oldData]
                    });

                    // Also update the store
                    store.addShareholder(data as shareholderSchema);
                  }
                } catch (error) {
                  console.error("Error processing inserted shareholder:", error);
                }
              })();
            } else if (payload.eventType === 'UPDATE') {
              // Use async function to handle promises with try/catch
              (async () => {
                try {
                  // Fetch the updated record with joins
                  const { data, error } = await supabase
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
                    .single();

                  if (error) {
                    console.error("Error fetching updated shareholder:", error);
                    return;
                  }

                  if (data) {
                    // Update the specific record in the cache
                    queryClient.setQueryData(["shareholders"], (oldData: shareholderSchema[] | undefined) => {
                      if (!oldData) return [data as shareholderSchema]
                      return oldData.map(item =>
                        item.shareholder_id === data.shareholder_id
                          ? data as shareholderSchema
                          : item
                      )
                    });

                    // Also update the store
                    store.updateShareholder(data as shareholderSchema);
                  }
                } catch (error) {
                  console.error("Error processing updated shareholder:", error);
                }
              })();
            } else if (payload.eventType === 'DELETE') {
              // Remove the deleted record from the cache
              queryClient.setQueryData(["shareholders"], (oldData: shareholderSchema[] | undefined) => {
                if (!oldData) return []
                return oldData.filter(item => item.shareholder_id !== payload.old.shareholder_id)
              })

              // Also update the store
              if (payload.old && payload.old.shareholder_id) {
                store.removeShareholder(payload.old.shareholder_id);
              }
            }
          })
        .subscribe((status) => {
          console.log(`Shareholders subscription status: ${status}`);
          isSubscribing.current = false;
        });
    } catch (error) {
      console.error("Error setting up shareholders subscription:", error);
      isSubscribing.current = false;
    }
  }, [queryClient, searchQuery, store]);

  // Query definition
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // If store already has data and no search query, return it
      if (store.shareholders.length > 0 && !searchQuery) {
        return store.shareholders;
      }

      try {
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

        // Update store if not a search query
        if (!searchQuery) {
          store.setShareholders(data as shareholderSchema[]);
        }

        return data as shareholderSchema[]
      } catch (error) {
        console.error("Error fetching shareholders:", error);
        // If we have data in the store, return it instead of throwing
        if (store.shareholders.length > 0) {
          return store.shareholders;
        }
        throw error;
      }
    },
    // Initial data from store if available and no search
    initialData: store.shareholders.length > 0 && !searchQuery
      ? store.shareholders
      : undefined,
    // Disable automatic refetching
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: undefined,
    staleTime: 0,
  })

  // Set up real-time subscription
  useEffect(() => {
    // Set up the channel
    setupRealtimeChannel();

    // Clean up subscription on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [setupRealtimeChannel]);

  return query
}

// Update a shareholder
export const useUpdateShareholder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  // Get the store's updateShareholder function
  const updateStoreSharehoder = useShareholderStore(state => state.updateShareholder)

  return useMutation({
    mutationFn: async ({
      shareholderId,
      data
    }: {
      shareholderId: string
      data: Partial<shareholderSchema>
    }) => {
      // Include the shareholderId in the request body as shareholder_id
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
      return result.data;
    },
    onSuccess: (data) => {
      // Directly update the store with the updated data
      if (data) {
        updateStoreSharehoder(data);
      }

      // Also invalidate queries for backward compatibility
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Hissedar güncellenirken bir hata oluştu'
      });
    }
  });
}

// Delete a shareholder
export const useDeleteShareholder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  // Get the store's removeShareholder function
  const removeStoreSharehoder = useShareholderStore(state => state.removeShareholder)

  return useMutation({
    mutationFn: async (shareholderId: string) => {
      if (!shareholderId) {
        throw new Error("Silinecek hissedar ID'si gerekli");
      }

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

      return { deleted: true, shareholder_id: shareholderId };
    },
    onSuccess: (data) => {
      // Update the store directly
      if (data && data.shareholder_id) {
        removeStoreSharehoder(data.shareholder_id);
      }

      // Also invalidate queries for backward compatibility
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Hissedar silinirken bir hata oluştu'
      });
    }
  });
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
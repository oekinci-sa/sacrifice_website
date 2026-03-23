import { shareholderSchema } from '@/types';
import { supabase } from '@/utils/supabaseClient';
import { create } from 'zustand';

interface ShareholderState {
  shareholders: shareholderSchema[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  realtimeEnabled: boolean;

  // Actions
  fetchShareholders: (year?: number | null) => Promise<void>;
  fetchShareholdersByTransactionId: (transactionId: string) => Promise<shareholderSchema[]>;
  setShareholders: (data: shareholderSchema[]) => void;
  updateShareholder: (shareholder: shareholderSchema) => void;
  addShareholder: (shareholder: shareholderSchema) => void;
  removeShareholder: (shareholderId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearShareholders: () => void;

  // Realtime functions
  enableRealtime: () => void;
  disableRealtime: () => void;
}

// Create a realtime channel for shareholders table
const setupRealtimeSubscription = (set: any, get: any) => {
  const channel = supabase
    .channel('shareholders-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shareholders',
      },
      (payload) => {
        const state = get();

        // Handle INSERT events - API üzerinden çek (RLS bypass, tenant filtresi)
        if (payload.eventType === 'INSERT') {
          const newId = payload.new?.shareholder_id;
          const newTenantId = payload.new?.tenant_id;
          if (!newId) return;

          fetch(`/api/admin/shareholders/${newId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data: shareholderSchema | null) => {
              if (!data) return;
              const exists = get().shareholders.some((s: shareholderSchema) => s.shareholder_id === data.shareholder_id);
              if (!exists) {
                set((state: ShareholderState) => ({ shareholders: [data, ...state.shareholders] }));
              }
            })
            .catch(() => {});
        }

        // Handle UPDATE events
        else if (payload.eventType === 'UPDATE') {
          // For UPDATE events, preserve the existing relationship data
          // by merging the new data with the existing record
          const updatedShareholder = payload.new as shareholderSchema;
          const existingShareholder = state.shareholders.find(
            (s: shareholderSchema) => s.shareholder_id === updatedShareholder.shareholder_id
          );

          if (existingShareholder) {
            const sid = updatedShareholder.shareholder_id;
            fetch(`/api/admin/shareholders/${sid}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((data: shareholderSchema | null) => {
                if (data) {
                  const sacrificeChanged =
                    data.sacrifice_id !== existingShareholder.sacrifice_id;
                  const sacrifice = sacrificeChanged
                    ? data.sacrifice
                    : data.sacrifice ?? existingShareholder.sacrifice;
                  set({
                    shareholders: get().shareholders.map((s: shareholderSchema) =>
                      s.shareholder_id === data.shareholder_id
                        ? { ...data, sacrifice }
                        : s
                    ),
                  });
                } else {
                  const mergedShareholder = {
                    ...updatedShareholder,
                    sacrifice: existingShareholder.sacrifice,
                  };
                  set({
                    shareholders: get().shareholders.map((s: shareholderSchema) =>
                      s.shareholder_id === updatedShareholder.shareholder_id ? mergedShareholder : s
                    ),
                  });
                }
              })
              .catch(() => {
                const mergedShareholder = {
                  ...updatedShareholder,
                  sacrifice: existingShareholder.sacrifice,
                };
                set({
                  shareholders: get().shareholders.map((s: shareholderSchema) =>
                    s.shareholder_id === updatedShareholder.shareholder_id ? mergedShareholder : s
                  ),
                });
              });
          } else {
            // If we can't find the existing record, just use the update as is
            set({
              shareholders: state.shareholders.map((s: shareholderSchema) =>
                s.shareholder_id === updatedShareholder.shareholder_id ? updatedShareholder : s
              ),
            });
          }
        }

        // Handle DELETE events
        else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.shareholder_id;
          set({
            shareholders: state.shareholders.filter((s: shareholderSchema) => s.shareholder_id !== deletedId),
          });
        }
      }
    )
    .subscribe();

  return channel;
};

export const useShareholderStore = create<ShareholderState>((set, get) => {
  // Reference to store the channel for cleanup
  let channelRef: ReturnType<typeof supabase.channel> | null = null;

  return {
    shareholders: [],
    isLoading: false,
    error: null,
    isInitialized: false,
    realtimeEnabled: false,

    // Fetch shareholders from API
    fetchShareholders: async (year?: number | null) => {
      try {
        set({ isLoading: true, error: null });

        const url = year != null
          ? `/api/get-shareholders?year=${year}`
          : '/api/get-shareholders';
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || response.statusText);
        }

        const data = await response.json();
        set({
          shareholders: data.shareholders || [],
          isLoading: false,
          error: null,
          isInitialized: true
        });

        if (!get().realtimeEnabled) {
          get().enableRealtime();
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Unknown error",
          isLoading: false
        });
      }
    },

    // Yeni metot: Belirli bir transaction_id ile ilişkili hissedarları getir
    fetchShareholdersByTransactionId: async (transactionId: string): Promise<shareholderSchema[]> => {
      try {
        set({ isLoading: true, error: null });

        const response = await fetch(`/api/get-shareholder-by-transaction_id?transaction_id=${transactionId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || response.statusText);
        }

        const data = await response.json();

        // Dönen veriyi formatla
        const shareholders = data.shareholders || [];

        // Store'da güncelleme yapmadan veriyi döndür
        set({ isLoading: false, error: null });
        return shareholders;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Unknown error",
          isLoading: false
        });
        return [];
      }
    },

    // Set all shareholders
    setShareholders: (data) => set({
      shareholders: data,
      isLoading: false,
      error: null,
      isInitialized: true
    }),

    // Update a single shareholder
    updateShareholder: (shareholder) => set((state) => ({
      shareholders: state.shareholders.map(s =>
        s.shareholder_id === shareholder.shareholder_id ? shareholder : s
      ),
    })),

    // Add a new shareholder
    addShareholder: (shareholder) => set((state) => ({
      shareholders: [...state.shareholders, shareholder],
    })),

    // Remove a shareholder
    removeShareholder: (shareholderId) => set((state) => ({
      shareholders: state.shareholders.filter(s => s.shareholder_id !== shareholderId),
    })),

    // Set loading state
    setLoading: (isLoading) => set({ isLoading }),

    // Set error state
    setError: (error) => set({ error, isLoading: false }),

    // Clear all shareholders
    clearShareholders: () => set({ shareholders: [], error: null }),

    // Enable realtime subscription
    enableRealtime: () => {
      // First, clean up existing subscription if any
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }

      // Create new subscription
      channelRef = setupRealtimeSubscription(set, get);
      set({ realtimeEnabled: true });
    },

    // Disable realtime subscription
    disableRealtime: () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
        channelRef = null;
      }
      set({ realtimeEnabled: false });
    },
  };
}); 
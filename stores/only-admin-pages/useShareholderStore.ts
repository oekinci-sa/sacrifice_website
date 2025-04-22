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
  fetchShareholders: () => Promise<void>;
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

        // Handle INSERT events
        if (payload.eventType === 'INSERT') {
          // For INSERT events, we need to fetch the complete record with relations
          // since the payload might not include the sacrifice relation
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
                // Check if not already in the store
                const exists = state.shareholders.some(
                  (s: shareholderSchema) => s.shareholder_id === data.shareholder_id
                );

                if (!exists) {
                  set({
                    shareholders: [...state.shareholders, data as shareholderSchema],
                  });
                }
              }
            });
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
            // Fetch the complete updated record with relations
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
              .eq('shareholder_id', updatedShareholder.shareholder_id)
              .single()
              .then(({ data, error }) => {
                if (!error && data) {
                  set({
                    shareholders: state.shareholders.map((s: shareholderSchema) =>
                      s.shareholder_id === data.shareholder_id ? data as shareholderSchema : s
                    ),
                  });
                } else {
                  // If fetch fails, fallback to merging the existing sacrifice data
                  const mergedShareholder = {
                    ...updatedShareholder,
                    sacrifice: existingShareholder.sacrifice
                  };

                  set({
                    shareholders: state.shareholders.map((s: shareholderSchema) =>
                      s.shareholder_id === updatedShareholder.shareholder_id ? mergedShareholder : s
                    ),
                  });
                }
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
    fetchShareholders: async () => {
      // Skip if already initialized and has data
      if (get().isInitialized && get().shareholders.length > 0) {
        return;
      }

      try {
        set({ isLoading: true, error: null });

        const response = await fetch('/api/get-shareholders');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || response.statusText);
        }

        const data = await response.json();
        set({
          shareholders: data.shareholders || [], // Extract the shareholders array from the response
          isLoading: false,
          error: null,
          isInitialized: true
        });

        // Enable realtime subscriptions after initial load
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
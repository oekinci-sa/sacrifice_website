import { supabase } from '@/utils/supabaseClient';
import { create } from 'zustand';

interface ReservationTransaction {
  transaction_id: string;
  sacrifice_id: string;
  share_count: number;
  status: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface ReservationTransactionsState {
  transactions: ReservationTransaction[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  realtimeEnabled: boolean;

  // Actions
  fetchTransactions: () => Promise<void>;
  setTransactions: (data: ReservationTransaction[]) => void;
  updateTransaction: (transaction: ReservationTransaction) => void;
  addTransaction: (transaction: ReservationTransaction) => void;
  removeTransaction: (transactionId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearTransactions: () => void;

  // Realtime functions
  enableRealtime: () => void;
  disableRealtime: () => void;
}

// Create a realtime channel for reservation_transactions table
const setupRealtimeSubscription = (set: any, get: any) => {
  const channel = supabase
    .channel('reservation-transactions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservation_transactions',
      },
      (payload) => {
        const state = get();

        // Handle INSERT events
        if (payload.eventType === 'INSERT') {
          // For INSERT events, we need to fetch the complete record with any relations
          // that might be needed in the UI
          supabase
            .from("reservation_transactions")
            .select("*")
            .eq('transaction_id', payload.new.transaction_id)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                // Check if not already in the store
                const exists = state.transactions.some(
                  (t: ReservationTransaction) => t.transaction_id === data.transaction_id
                );

                if (!exists) {
                  set({
                    transactions: [...state.transactions, data as ReservationTransaction],
                  });
                }
              }
            });
        }

        // Handle UPDATE events
        else if (payload.eventType === 'UPDATE') {
          // For UPDATE events, get the complete updated record
          // to ensure we have all the data we need
          supabase
            .from("reservation_transactions")
            .select("*")
            .eq('transaction_id', payload.new.transaction_id)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                set({
                  transactions: state.transactions.map((t: ReservationTransaction) =>
                    t.transaction_id === data.transaction_id ? data as ReservationTransaction : t
                  ),
                });
              } else {
                // Fallback to the payload data if the fetch fails
                const updatedTransaction = payload.new as ReservationTransaction;
                set({
                  transactions: state.transactions.map((t: ReservationTransaction) =>
                    t.transaction_id === updatedTransaction.transaction_id ? updatedTransaction : t
                  ),
                });
              }
            });
        }

        // Handle DELETE events
        else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.transaction_id;
          set({
            transactions: state.transactions.filter((t: ReservationTransaction) => t.transaction_id !== deletedId),
          });
        }
      }
    )
    .subscribe();

  return channel;
};

export const useReservationTransactionsStore = create<ReservationTransactionsState>((set, get) => {
  // Reference to store the channel for cleanup
  let channelRef: ReturnType<typeof supabase.channel> | null = null;

  return {
    transactions: [],
    isLoading: false,
    error: null,
    isInitialized: false,
    realtimeEnabled: false,

    // Fetch transactions from API
    fetchTransactions: async () => {
      // Skip if already initialized and has data
      if (get().isInitialized && get().transactions.length > 0) {
        return;
      }

      try {
        set({ isLoading: true, error: null });

        const response = await fetch('/api/get-reservation-transactions');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || response.statusText);
        }

        const data = await response.json();
        set({
          transactions: data.transactions || [],
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

    // Set all transactions
    setTransactions: (data) => set({
      transactions: data,
      isLoading: false,
      error: null,
      isInitialized: true
    }),

    // Update a single transaction
    updateTransaction: (transaction) => set((state) => ({
      transactions: state.transactions.map(t =>
        t.transaction_id === transaction.transaction_id ? transaction : t
      ),
    })),

    // Add a new transaction
    addTransaction: (transaction) => set((state) => ({
      transactions: [...state.transactions, transaction],
    })),

    // Remove a transaction
    removeTransaction: (transactionId) => set((state) => ({
      transactions: state.transactions.filter(t => t.transaction_id !== transactionId),
    })),

    // Set loading state
    setLoading: (isLoading) => set({ isLoading }),

    // Set error state
    setError: (error) => set({ error, isLoading: false }),

    // Clear all transactions
    clearTransactions: () => set({ transactions: [], error: null }),

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
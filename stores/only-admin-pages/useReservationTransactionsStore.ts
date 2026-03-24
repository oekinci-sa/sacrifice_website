import { supabase } from '@/utils/supabaseClient';
import { create } from 'zustand';

export interface ReservationTransactionRow {
  transaction_id: string;
  sacrifice_id: string;
  share_count: number;
  status: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  last_heartbeat_at?: string | null;
  _displayNo?: number;
}

interface ReservationTransactionsState {
  transactions: ReservationTransactionRow[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  realtimeEnabled: boolean;
  /** Son başarılı fetch’te kullanılan yıl — Realtime sonrası API yenilemesi için */
  lastFetchedYear: number | null;

  fetchTransactions: (
    year?: number | null,
    options?: { silent?: boolean }
  ) => Promise<void>;
  setTransactions: (data: ReservationTransactionRow[]) => void;
  updateTransaction: (transaction: ReservationTransactionRow) => void;
  addTransaction: (transaction: ReservationTransactionRow) => void;
  removeTransaction: (transactionId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearTransactions: () => void;
  enableRealtime: () => void;
  disableRealtime: () => void;
}

const setupRealtimeSubscription = (get: () => ReservationTransactionsState) => {
  return supabase
    .channel('reservation-transactions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservation_transactions',
      },
      () => {
        const y = get().lastFetchedYear;
        void get().fetchTransactions(y, { silent: true });
      }
    )
    .subscribe();
};

export const useReservationTransactionsStore = create<ReservationTransactionsState>((set, get) => {
  let channelRef: ReturnType<typeof supabase.channel> | null = null;

  return {
    transactions: [],
    isLoading: false,
    error: null,
    isInitialized: false,
    realtimeEnabled: false,
    lastFetchedYear: null,

    fetchTransactions: async (year?: number | null, options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      try {
        if (!silent) set({ isLoading: true, error: null });
        set({ lastFetchedYear: year ?? null });

        const url =
          year != null
            ? `/api/get-reservation-transactions?year=${year}`
            : '/api/get-reservation-transactions';
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || response.statusText);
        }

        const data = await response.json();
        set({
          transactions: data.transactions || [],
          isLoading: false,
          error: null,
          isInitialized: true,
        });

        if (!get().realtimeEnabled) {
          get().enableRealtime();
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false,
        });
      }
    },

    setTransactions: (data) =>
      set({
        transactions: data,
        isLoading: false,
        error: null,
        isInitialized: true,
      }),

    updateTransaction: (transaction) =>
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.transaction_id === transaction.transaction_id ? transaction : t
        ),
      })),

    addTransaction: (transaction) =>
      set((state) => ({
        transactions: [...state.transactions, transaction],
      })),

    removeTransaction: (transactionId) =>
      set((state) => ({
        transactions: state.transactions.filter((t) => t.transaction_id !== transactionId),
      })),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error, isLoading: false }),

    clearTransactions: () => set({ transactions: [], error: null }),

    enableRealtime: () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
      channelRef = setupRealtimeSubscription(get);
      set({ realtimeEnabled: true });
    },

    disableRealtime: () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
        channelRef = null;
      }
      set({ realtimeEnabled: false });
    },
  };
});

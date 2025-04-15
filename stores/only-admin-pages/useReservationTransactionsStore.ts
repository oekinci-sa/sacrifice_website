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
  
  // Actions
  setTransactions: (data: ReservationTransaction[]) => void;
  updateTransaction: (transaction: ReservationTransaction) => void;
  addTransaction: (transaction: ReservationTransaction) => void;
  removeTransaction: (transactionId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearTransactions: () => void;
}

export const useReservationTransactionsStore = create<ReservationTransactionsState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,
  
  // Set all transactions
  setTransactions: (data) => set({ transactions: data, isLoading: false, error: null }),
  
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
})); 
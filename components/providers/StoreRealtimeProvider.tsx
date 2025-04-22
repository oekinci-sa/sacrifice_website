"use client";

import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { useReservationTransactionsStore } from "@/stores/only-admin-pages/useReservationTransactionsStore";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useEffect } from "react";

/**
 * StoreRealtimeProvider - A component that initializes real-time subscriptions
 * for all Zustand stores that need real-time updates.
 * 
 * This component should be placed high in the component tree,
 * preferably in a layout component that's loaded on every page.
 */
export function StoreRealtimeProvider({ children }: { children: React.ReactNode }) {
  // Get access to store initialization methods
  const { fetchShareholders } = useShareholderStore();
  const { fetchTransactions } = useReservationTransactionsStore();
  const { refetchSacrifices } = useSacrificeStore();
  
  // Initialize all stores and their real-time subscriptions on mount
  useEffect(() => {
    // Initialize the stores
    fetchShareholders().catch(console.error);
    fetchTransactions().catch(console.error);
    refetchSacrifices().catch(console.error);
    
    // No cleanup needed as the stores handle their own subscription cleanup
  }, [fetchShareholders, fetchTransactions, refetchSacrifices]);
  
  // Just render children, this is a context-less provider
  return <>{children}</>;
}

export default StoreRealtimeProvider; 
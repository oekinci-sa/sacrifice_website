"use client";

import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
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
  const { fetchShareholders } = useShareholderStore();
  const { refetchSacrifices } = useSacrificeStore();

  useEffect(() => {
    fetchShareholders().catch(console.error);
    refetchSacrifices().catch(console.error);
  }, [fetchShareholders, refetchSacrifices]);

  return <>{children}</>;
}

export default StoreRealtimeProvider;

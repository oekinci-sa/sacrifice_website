"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useRef } from "react";

import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useReservationTransactionsStore } from "@/stores/only-admin-pages/useReservationTransactionsStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";

import { useToast } from "@/components/ui/use-toast";
import { sacrificeSchema } from "@/types";
import { supabase } from "@/utils/supabaseClient";

interface AdminDataProviderProps {
  children: ReactNode;
}

export function AdminDataProvider({ children }: AdminDataProviderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hasInitialized = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Get store methods
  const {
    shareholders,
    setShareholders,
    setLoading: setShareholdersLoading,
    setError: setShareholdersError
  } = useShareholderStore();

  const {
    transactions,
    setTransactions,
    setLoading: setTransactionsLoading,
    setError: setTransactionsError
  } = useReservationTransactionsStore();

  // Get sacrifice store methods for realtime updates
  const {
    sacrifices,
    isInitialized: sacrificesInitialized,
    updateSacrifice,
    refetchSacrifices
  } = useSacrificeStore();

  // Fetch shareholders data with React Query
  const {
    refetch: refetchShareholders,
  } = useQuery({
    queryKey: ["shareholders"],
    queryFn: async () => {
      setShareholdersLoading(true);
      try {
        const response = await fetch("/api/get-shareholders");
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch shareholders");
        }
        const data = await response.json();
        setShareholders(data.shareholders);
        return data.shareholders;
      } catch (error) {
        const message = error instanceof Error ? error.message : "An error occurred";
        setShareholdersError(message);
        toast({
          title: "Error",
          description: `Failed to load shareholders: ${message}`,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: false, // Disable auto-fetching, we'll trigger manually
  });

  // Fetch reservation transactions data with React Query
  const {
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["reservation-transactions"],
    queryFn: async () => {
      setTransactionsLoading(true);
      try {
        const response = await fetch("/api/get-reservation-transactions");
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch reservation transactions");
        }
        const data = await response.json();
        setTransactions(data.transactions);
        return data.transactions;
      } catch (error) {
        const message = error instanceof Error ? error.message : "An error occurred";
        setTransactionsError(message);
        toast({
          title: "Error",
          description: `Failed to load reservation transactions: ${message}`,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: false, // Disable auto-fetching, we'll trigger manually
  });

  // Load data on provider mount
  useEffect(() => {
    // Setup Supabase Realtime subscription for sacrifice_animals table
    const setupRealtimeSubscription = () => {
      // Clean up existing subscription if any
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }

      // Create new subscription
      channelRef.current = supabase
        .channel("admin-sacrifice-changes-" + Date.now())
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sacrifice_animals",
          },
          (payload) => {

            // Update Zustand store based on the event type
            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              updateSacrifice(payload.new as sacrificeSchema);
              // Invalidate React Query cache
              queryClient.invalidateQueries({ queryKey: ["sacrifices"] });
            } else if (payload.eventType === "DELETE") {
              // For deletes, we need to refetch the whole list
              refetchSacrifices();
            }
          }
        )
        .subscribe(() => {
        });
    };

    if (!hasInitialized.current) {
      hasInitialized.current = true;

      // Only fetch if data is not already in store
      if (shareholders.length === 0) {
        refetchShareholders();
      }

      if (transactions.length === 0) {
        refetchTransactions();
      }

      // Initialize sacrifice data if not already loaded
      if (!sacrificesInitialized || sacrifices.length === 0) {
        refetchSacrifices();
      }

      // Setup Supabase Realtime subscription
      setupRealtimeSubscription();
    }

    // Check subscription status periodically
    const checkSubscription = setInterval(() => {
      if (!channelRef.current) {
        setupRealtimeSubscription();
      }
    }, 10000); // Check every 10 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(checkSubscription);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [
    shareholders.length,
    transactions.length,
    sacrifices.length,
    sacrificesInitialized,
    refetchShareholders,
    refetchTransactions,
    updateSacrifice,
    refetchSacrifices,
    queryClient
  ]);

  return <>{children}</>;
} 
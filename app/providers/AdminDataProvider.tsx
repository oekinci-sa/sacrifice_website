"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useCallback, useEffect, useRef } from "react";

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
  const isSubscribing = useRef(false);
  const isFetching = useRef(false);

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

  // Setup Supabase Realtime subscription for sacrifice_animals table
  const setupRealtimeSubscription = useCallback(() => {
    // Prevent multiple subscription attempts
    if (isSubscribing.current) return;
    isSubscribing.current = true;

    try {
      // Clean up existing subscription if any
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Create new subscription with a unique channel name
      channelRef.current = supabase
        .channel(`admin-sacrifice-changes-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
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
              refetchSacrifices().catch(error => {
                console.error("Error refetching after delete:", error);
              });
            }
          }
        )
        .subscribe((status) => {
          console.log(`Admin subscription status: ${status}`);
          isSubscribing.current = false;
        });
    } catch (error) {
      console.error("Error setting up admin realtime subscription:", error);
      isSubscribing.current = false;
    }
  }, [queryClient, refetchSacrifices, updateSacrifice]);

  // Load data on provider mount
  useEffect(() => {
    const loadAllData = async () => {
      // Only initialize once and prevent concurrent fetches
      if (hasInitialized.current || isFetching.current) return;
      isFetching.current = true;

      try {
        if (!hasInitialized.current) {
          hasInitialized.current = true;

          // Create an array of promises for parallel execution
          const dataPromises = [];

          // Only fetch if data is not already in store
          if (shareholders.length === 0) {
            dataPromises.push(refetchShareholders());
          }

          if (transactions.length === 0) {
            dataPromises.push(refetchTransactions());
          }

          // Initialize sacrifice data if not already loaded
          if (!sacrificesInitialized || sacrifices.length === 0) {
            dataPromises.push(refetchSacrifices());
          }

          // Only wait for promises if there are any
          if (dataPromises.length > 0) {
            await Promise.all(dataPromises);
          }
        }

        // Setup Supabase Realtime subscription after data is loaded
        setupRealtimeSubscription();
      } catch (error) {
        console.error("Error loading admin data:", error);
        toast({
          title: "Error",
          description: "Failed to load some data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        isFetching.current = false;
      }
    };

    loadAllData();

    // Cleanup on unmount
    return () => {
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
    queryClient,
    toast,
    setupRealtimeSubscription // Add setupRealtimeSubscription to dependencies
  ]);

  return <>{children}</>;
} 
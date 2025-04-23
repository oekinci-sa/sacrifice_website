"use client";

import { ReactNode, useEffect, useRef } from "react";

import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useReservationTransactionsStore } from "@/stores/only-admin-pages/useReservationTransactionsStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";

import { useToast } from "@/components/ui/use-toast";

interface AdminDataProviderProps {
  children: ReactNode;
}

export function AdminDataProvider({ children }: AdminDataProviderProps) {
  const { toast } = useToast();
  const hasInitialized = useRef(false);

  // Get store methods
  const {
    fetchShareholders,
    isLoading: shareholdersLoading,
    error: shareholdersError
  } = useShareholderStore();

  const {
    fetchTransactions,
    isLoading: transactionsLoading,
    error: transactionsError
  } = useReservationTransactionsStore();

  // Get sacrifice store methods for realtime updates
  const {
    isInitialized: sacrificesInitialized,
    refetchSacrifices
  } = useSacrificeStore();

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      // Load all data in parallel
      const loadAllData = async () => {
        try {
          // Create an array of promises for parallel execution
          const dataPromises = [];

          // Fetch shareholders data
          dataPromises.push(
            fetchShareholders().catch(error => {
              const message = error instanceof Error ? error.message : "An error occurred";
              toast({
                title: "Error",
                description: `Failed to load shareholders: ${message}`,
                variant: "destructive",
              });
            })
          );

          // Fetch transactions data
          dataPromises.push(
            fetchTransactions().catch(error => {
              const message = error instanceof Error ? error.message : "An error occurred";
              toast({
                title: "Error",
                description: `Failed to load reservation transactions: ${message}`,
                variant: "destructive",
              });
            })
          );

          // Initialize sacrifice data if not already loaded
          if (!sacrificesInitialized) {
            dataPromises.push(
              refetchSacrifices().catch(error => {
                const message = error instanceof Error ? error.message : "An error occurred";
                toast({
                  title: "Error",
                  description: `Failed to load sacrifices: ${message}`,
                  variant: "destructive",
                });
              })
            );
          }

          // Wait for all data to load
          await Promise.all(dataPromises);
        } catch (error) {
          console.error("Error loading admin data:", error);
          toast({
            title: "Error",
            description: "Failed to load some data. Please refresh the page.",
            variant: "destructive",
          });
        }
      };

      loadAllData();
    }
  }, [
    fetchShareholders,
    fetchTransactions,
    refetchSacrifices,
    sacrificesInitialized,
    toast
  ]);

  return <>{children}</>;
} 
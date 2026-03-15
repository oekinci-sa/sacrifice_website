"use client";

import { ReactNode, useEffect, useRef } from "react";

import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useReservationTransactionsStore } from "@/stores/only-admin-pages/useReservationTransactionsStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";

import { useToast } from "@/components/ui/use-toast";

interface AdminDataProviderProps {
  children: ReactNode;
}

export function AdminDataProvider({ children }: AdminDataProviderProps) {
  const { toast } = useToast();
  const hasInitialized = useRef(false);

  const { selectedYear, fetchActiveYear } = useAdminYearStore();
  const { fetchShareholders } = useShareholderStore();
  const { fetchTransactions } = useReservationTransactionsStore();
  const { isInitialized: sacrificesInitialized, refetchSacrifices } = useSacrificeStore();

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      const loadAllData = async () => {
        try {
          const year = await fetchActiveYear();

          await Promise.all([
            fetchShareholders(year).catch((error) => {
              const message = error instanceof Error ? error.message : "An error occurred";
              toast({
                title: "Error",
                description: `Failed to load shareholders: ${message}`,
                variant: "destructive",
              });
            }),
            fetchTransactions(year).catch((error) => {
              const message = error instanceof Error ? error.message : "An error occurred";
              toast({
                title: "Error",
                description: `Failed to load reservation transactions: ${message}`,
                variant: "destructive",
              });
            }),
            sacrificesInitialized
              ? Promise.resolve()
              : refetchSacrifices(year).catch((error) => {
                  const message = error instanceof Error ? error.message : "An error occurred";
                  toast({
                    title: "Error",
                    description: `Failed to load sacrifices: ${message}`,
                    variant: "destructive",
                  });
                }),
          ]);
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
    fetchActiveYear,
    fetchShareholders,
    fetchTransactions,
    refetchSacrifices,
    sacrificesInitialized,
    toast,
  ]);

  const prevYearRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedYear == null) return;
    if (prevYearRef.current !== null && prevYearRef.current !== selectedYear) {
      fetchShareholders(selectedYear).catch(console.error);
      fetchTransactions(selectedYear).catch(console.error);
      refetchSacrifices(selectedYear).catch(console.error);
    }
    prevYearRef.current = selectedYear;
  }, [selectedYear, fetchShareholders, fetchTransactions, refetchSacrifices]);

  return <>{children}</>;
} 
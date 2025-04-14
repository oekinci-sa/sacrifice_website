"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabaseClient";
import { sacrificeSchema } from "@/types";
import { useHisseStore } from "@/stores/useHisseStore";
import { useToast } from "@/components/ui/use-toast";

interface SacrificeDataProviderProps {
  children: ReactNode;
}

export function SacrificeDataProvider({ children }: SacrificeDataProviderProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const hasInitialized = useRef(false);
  const { 
    setSacrifices, 
    updateSacrifice, 
    setEmptyShareCount, 
    setIsLoadingSacrifices,
    setIsInitialized,
    sacrifices,
    isInitialized
  } = useHisseStore();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Function to fetch sacrifice data and update the store
  const fetchSacrificesData = async () => {
    try {
      setIsLoadingSacrifices(true);
      console.log("Initial sacrifice data fetch");
      
      const response = await fetch("/api/get-sacrifice-animals");
      
      if (!response.ok) {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kurban verileri yüklenirken bir hata oluştu: " + (errorData.error || response.statusText)
        });
        throw new Error(errorData.error || response.statusText);
      }
      
      const data = await response.json() as sacrificeSchema[];
      
      // Set the data in Zustand store
      setSacrifices(data);
      
      // Calculate and update total empty shares
      const totalEmptyShares = data.reduce((sum, sacrifice) => sum + sacrifice.empty_share, 0);
      setEmptyShareCount(totalEmptyShares);
      
      // Update React Query cache
      queryClient.setQueryData(["sacrifices"], data);
      
      // Mark the store as initialized
      setIsInitialized(true);
      
      return data;
    } catch (error) {
      console.error("Error fetching sacrifices:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kurban verileri yüklenirken bir hata oluştu."
      });
      // Even on error, mark as initialized but with empty data
      setIsInitialized(true);
      return [];
    } finally {
      setIsLoadingSacrifices(false);
    }
  };

  // Setup Supabase Realtime subscription
  const setupRealtimeSubscription = () => {
    // Clean up existing subscription if any
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Create new subscription
    channelRef.current = supabase.channel('sacrifice-global-changes-' + Date.now())
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sacrifice_animals'
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          
          // Update Zustand store based on the event type
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            updateSacrifice(payload.new as sacrificeSchema);
            // Invalidate React Query cache
            queryClient.invalidateQueries({ queryKey: ["sacrifices"] });
          } else if (payload.eventType === 'DELETE') {
            // For deletes, we need to refetch the whole list
            fetchSacrificesData();
          }
        }
      )
      .subscribe((status) => {
        console.log('Global subscription status:', status);
      });
  };

  // Initialize data fetching and subscription only once on component mount
  useEffect(() => {
    // If we're already initialized and have data, don't refetch
    if (isInitialized && sacrifices.length > 0) {
      console.log("Store already initialized with data, skipping initial fetch");
      return;
    }
    
    // If we're not initialized yet or initialized but with no data, fetch it
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchSacrificesData();
      setupRealtimeSubscription();
    }
    
    // Check subscription status periodically
    const checkSubscription = setInterval(() => {
      if (!channelRef.current) {
        console.log('Reestablishing lost subscription');
        setupRealtimeSubscription();
      }
    }, 10000); // Check every 10 seconds
    
    // Cleanup on unmount
    return () => {
      clearInterval(checkSubscription);
      if (channelRef.current) {
        console.log('Unsubscribing from global channel');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [isInitialized, sacrifices.length]); // Add dependencies to decide whether to fetch

  return <>{children}</>;
} 
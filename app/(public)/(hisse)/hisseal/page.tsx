"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState, useEffect, useCallback } from "react";
import Checkout from "./components/Checkout";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { supabase } from "@/utils/supabaseClient";
import { sacrificeSchema } from "@/types";
import { ShareSelectDialog } from "./components/share-select-dialog";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

const TIMEOUT_DURATION = 20; // 3 minutes
const WARNING_THRESHOLD = 10; // Show warning at 1 minute
const API_ENDPOINT = '/api/update-empty-share';

const Page = () => {
  const router = useRouter();
  const [data, setData] = useState<sacrificeSchema[]>([]);
  const [selectedSacrifice, setSelectedSacrifice] = useState<sacrificeSchema | null>(null);
  const [tempSelectedSacrifice, setTempSelectedSacrifice] = useState<sacrificeSchema | null>(null);
  const [formData, setFormData] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [showWarning, setShowWarning] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: initialData, error } = await supabase
        .from("sacrifice_animals")
        .select("*")
        .order('sacrifice_no', { ascending: true });

      if (error) {
        toast({
          variant: "destructive",
          title: "Veri Yükleme Hatası",
          description: "Veriler yüklenirken bir hata oluştu: " + error.message,
        });
        return;
      }

      setData(initialData || []);

      const channel = supabase.channel('db-changes', {
        config: {
          broadcast: { self: true }
        }
      });

      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sacrifice_animals'
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setData((currentData) => {
                const newData = [...currentData, payload.new as sacrificeSchema];
                return newData.sort((a, b) => a.sacrifice_no - b.sacrifice_no);
              });
            } else if (payload.eventType === "UPDATE") {
              setData((currentData) =>
                currentData.map((item) =>
                  item.sacrifice_id === payload.new.sacrifice_id ? (payload.new as sacrificeSchema) : item
                ).sort((a, b) => a.sacrifice_no - b.sacrifice_no)
              );
            } else if (payload.eventType === "DELETE") {
              setData((currentData) =>
                currentData.filter((item) => item.sacrifice_id !== payload.old.sacrifice_id)
              );
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    };

    fetchData();
  }, [toast]);

  // Function to update empty_share in the database
  const updateEmptyShare = useCallback(async (sacrificeId: string, change: number) => {
    const { data: currentSacrifice, error: fetchError } = await supabase
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("sacrifice_id", sacrificeId)
      .single();

    if (fetchError || !currentSacrifice) {
      console.error("Error fetching current empty_share:", fetchError);
      return;
    }

    console.log("Current empty_share:", currentSacrifice.empty_share);
    console.log("Change amount:", change);
    const newEmptyShare = currentSacrifice.empty_share + change;
    console.log("New empty_share will be:", newEmptyShare);
    
    const { error: updateError } = await supabase
      .from("sacrifice_animals")
      .update({ empty_share: newEmptyShare })
      .eq("sacrifice_id", sacrificeId);

    if (updateError) {
      console.error("Error updating empty_share:", updateError);
    } else {
      console.log("Successfully updated empty_share to:", newEmptyShare);
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (selectedSacrifice && formData?.length > 0) {
      console.log("Cleanup triggered with formData length:", formData.length);
      const data = {
        sacrificeId: selectedSacrifice.sacrifice_id,
        increaseAmount: formData.length
      };
      
      // Use Beacon API to send the request
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(API_ENDPOINT, blob);
      console.log("Beacon API request sent with data:", data);

      setSelectedSacrifice(null);
      setFormData([]);
    }
  }, [selectedSacrifice, formData]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (activeTab === "tab-2") {
      timer = setInterval(() => {
        const now = Date.now();
        const timeSinceLastInteraction = Math.floor((now - lastInteractionTime) / 1000);
        const timeRemaining = TIMEOUT_DURATION - timeSinceLastInteraction;

        if (timeRemaining <= WARNING_THRESHOLD && timeRemaining > 0 && !showWarning) {
          setShowWarning(true);
        }
        
        if (timeRemaining <= 0) {
          console.log("Timeout occurred, resetting to share selection tab");
          cleanup();
          setActiveTab("tab-1");
          setShowWarning(false);
          return;
        }
        
        setTimeLeft(timeRemaining);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [activeTab, lastInteractionTime, showWarning, cleanup]);

  // Handle user interactions
  const handleInteraction = useCallback(() => {
    setLastInteractionTime(Date.now());
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  // Handle page unload and navigation with Beacon API
  useEffect(() => {
    const sendBeaconData = () => {
      if (selectedSacrifice && formData?.length > 0 && activeTab === "tab-2") {
        const data = {
          sacrificeId: selectedSacrifice.sacrifice_id,
          increaseAmount: formData.length
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const sent = navigator.sendBeacon(API_ENDPOINT, blob);
        console.log("Beacon API request sent:", sent, "with data:", data);
      }
    };

    // Add event listener for page unload
    window.addEventListener('pagehide', sendBeaconData);
    
    // Handle navigation within the app
    const handleNavigation = (e: PopStateEvent) => {
      sendBeaconData();
    };
    
    window.addEventListener('popstate', handleNavigation);
    
    // Handle clicks on links
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.includes(window.location.origin + '/hisseal')) {
        sendBeaconData();
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('pagehide', sendBeaconData);
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('click', handleClick);
    };
  }, [selectedSacrifice, formData, activeTab]);

  const handleSacrificeSelect = async (sacrifice: sacrificeSchema) => {
    const { data: latestSacrifice, error } = await supabase
      .from("sacrifice_animals")
      .select("*")
      .eq("sacrifice_id", sacrifice.sacrifice_id)
      .single();

    if (error || !latestSacrifice) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
      });
      return;
    }

    if (latestSacrifice.empty_share === 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bu kurbanlıkta boş hisse kalmamış.",
      });
      return;
    }

    setTempSelectedSacrifice(latestSacrifice);
    setIsDialogOpen(true);
  };

  const handleShareCountSelect = async (shareCount: number) => {
    if (!tempSelectedSacrifice) return;

    const { data: latestSacrifice, error } = await supabase
      .from("sacrifice_animals")
      .select("*")
      .eq("sacrifice_id", tempSelectedSacrifice.sacrifice_id)
      .single();

    if (error || !latestSacrifice) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
      });
      return;
    }

    if (latestSacrifice.empty_share < shareCount) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Seçtiğiniz sayıda boş hisse kalmamış.",
      });
      return;
    }

    // Decrease empty_share in the database
    const { error: updateError } = await supabase
      .from("sacrifice_animals")
      .update({ empty_share: latestSacrifice.empty_share - shareCount })
      .eq("sacrifice_id", latestSacrifice.sacrifice_id);

    if (updateError) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hisse seçimi yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
      });
      return;
    }

    setSelectedSacrifice(latestSacrifice);
    setFormData(Array(shareCount).fill({
      name: "",
      phone: "",
      delivery_type: "kesimhane",
      delivery_location: "",
    }));
    setActiveTab("tab-2");
    setIsDialogOpen(false);
    setLastInteractionTime(Date.now());
  };

  const handleApprove = async () => {
    if (!selectedSacrifice || !formData) return;

    // Validate form data and collect validation errors
    let hasErrors = false;
    const validationErrors = formData.map((data: any) => {
      const errors: { [key: string]: string } = {};
      
      if (!data.name) {
        errors.name = "Ad soyad zorunludur";
        hasErrors = true;
      }
      if (!data.phone) {
        errors.phone = "Telefon numarası zorunludur";
        hasErrors = true;
      }
      if (!data.delivery_type) {
        errors.delivery_type = "Teslimat tercihi zorunludur";
        hasErrors = true;
      }
      if (data.delivery_type === "toplu-teslim-noktasi" && !data.delivery_location) {
        errors.delivery_location = "Teslimat noktası seçiniz";
        hasErrors = true;
      }
      
      return errors;
    });

    if (hasErrors) {
      setFormErrors(validationErrors);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
      });
      return;
    }

    // Format phone numbers
    const formattedData = formData.map((data: any) => {
      let phone = data.phone;
      // Remove any non-digit characters
      phone = phone.replace(/\D/g, "");
      // Remove leading 0 if exists
      if (phone.startsWith("0")) {
        phone = phone.substring(1);
      }
      // Add +90 prefix if not exists
      if (!phone.startsWith("90")) {
        phone = "90" + phone;
      }
      // Add + at the beginning
      phone = "+" + phone;

      return {
        ...data,
        phone,
      };
    });

    // Insert shareholders
    const { error } = await supabase
      .from("shareholders")
      .insert(formattedData.map((data: any) => ({
        shareholder_name: data.name,
        phone_number: data.phone,
        sacrifice_id: selectedSacrifice.sacrifice_id,
        share_price: selectedSacrifice.share_price,
        delivery_type: data.delivery_type,
        delivery_location: data.delivery_type === "kesimhane" ? "kesimhane" : data.delivery_location,
        delivery_fee: data.delivery_type === "toplu-teslim-noktasi" ? 500 : 0,
        total_amount: selectedSacrifice.share_price + (data.delivery_type === "toplu-teslim-noktasi" ? 500 : 0),
        paid_amount: 0,
        remaining_payment: selectedSacrifice.share_price + (data.delivery_type === "toplu-teslim-noktasi" ? 500 : 0),
        sacrifice_consent: false
      })));

    if (error) {
      console.error("Error inserting shareholders:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hissedar bilgileri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
      });
      return;
    }

    // Redirect to share inquiry page
    router.push("/hissesorgula");
  };

  return (
    <div className="container flex flex-col space-y-12" onClick={handleInteraction} onKeyDown={handleInteraction}>
      <div className="font-heading font-bold text-4xl text-center">
        Hisse Al
        {activeTab === "tab-2" && (
          <div className="text-lg font-normal text-muted-foreground mt-2">
            Kalan Süre: {timeLeft} saniye
          </div>
        )}
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mx-auto w-full">
        <TabsList className="h-auto bg-red rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="tab-1"
            className="relative text-lg font-heading font-semibold rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            Hisse Seçim
          </TabsTrigger>
          <TabsTrigger
            value="tab-2"
            className="relative text-lg font-heading font-semibold rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            disabled={!selectedSacrifice}
          >
            Hisse Onay
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">
          <DataTable 
            data={data} 
            columns={columns} 
            onSacrificeSelect={handleSacrificeSelect}
          />
        </TabsContent>
        <TabsContent value="tab-2">
          <Checkout 
            sacrifice={selectedSacrifice} 
            formData={formData} 
            setFormData={setFormData}
            onApprove={handleApprove}
          />
        </TabsContent>
      </Tabs>
      {tempSelectedSacrifice && (
        <ShareSelectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          sacrifice={tempSelectedSacrifice}
          onSelect={handleShareCountSelect}
        />
      )}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogTitle>Uyarı</AlertDialogTitle>
          <AlertDialogDescription>
            {timeLeft} saniye içerisinde işlem yapmazsanız hisse seçim sayfasına yönlendirileceksiniz.
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Page;

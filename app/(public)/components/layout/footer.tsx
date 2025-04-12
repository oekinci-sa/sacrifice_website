"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import websiteLogoWhite from "@/public/website-logo-white.svg";
import { supabase } from "@/utils/supabaseClient";

import { mediaLinks } from "../../constants";
import CustomLink from "@/components/common/custom-link";
import { useHisseStore } from "@/stores/useHisseStore";
import { useSacrifices } from "@/hooks/useSacrifices";

interface MediaLink {
  href: string;
  iconName: string;
}

const Footer = () => {
  // Get sacrifice data from Zustand store
  const { sacrifices } = useHisseStore();
  
  // Force real-time connections to be active by using the hook directly
  // The returned data isn't used directly, but ensures the subscription is active
  const { data: realtimeData, isLoading } = useSacrifices();
  
  // Calculate total empty shares from the store data
  const totalEmptyShares = useMemo(() => {
    // Use either store data or the real-time data from React Query, whichever has more items
    const dataToUse = realtimeData && realtimeData.length > sacrifices.length ? realtimeData : sacrifices;
    
    if (dataToUse.length === 0) {
      return 0; // No data yet
    }
    
    console.log(`🔢 Calculating total empty shares from ${dataToUse.length} sacrifices`);
    const total = dataToUse.reduce(
      (sum, item) => sum + (item.empty_share || 0),
      0
    );
    console.log(`🔢 Total empty shares: ${total}`);
    return total;
  }, [sacrifices, realtimeData]);
  
  // We still need a fallback for the initial load
  const [fallbackEmptyShares, setFallbackEmptyShares] = useState<number | null>(null);

  // Fetch total empty shares directly only once on initial load as a fallback
  useEffect(() => {
    // Only fetch directly if we don't have data from other sources
    if ((sacrifices.length === 0 && !realtimeData) && fallbackEmptyShares === null) {
      console.log('🔍 Fetching fallback empty shares data directly...');
      const fetchTotalEmptyShares = async () => {
        try {
          const { data, error } = await supabase
            .from("sacrifice_animals")
            .select("empty_share");

          if (error) {
            console.error("Error fetching empty shares:", error);
            return;
          }

          if (data) {
            const total = data.reduce(
              (sum, item) => sum + (item.empty_share || 0),
              0
            );
            console.log(`🔍 Fallback empty shares: ${total}`);
            setFallbackEmptyShares(total);
          }
        } catch (error) {
          console.error("Error in fetchTotalEmptyShares:", error);
        }
      };
      
      fetchTotalEmptyShares();
    }
  }, [sacrifices.length, realtimeData, fallbackEmptyShares]);

  // Determine which value to display, prioritizing real-time data
  const displayEmptyShares = totalEmptyShares > 0 
    ? totalEmptyShares 
    : (fallbackEmptyShares ?? 0);

  // Add a direct subscription for footer-specific updates
  useEffect(() => {
    console.log('🔌 Setting up footer-specific Supabase subscription...');
    const channel = supabase
      .channel("footer-empty-shares-subscription")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sacrifice_animals",
        },
        (payload) => {
          console.log("📢 Footer received change event:", payload);
          // We don't need to do anything here, the store will be updated via useSacrifices
        }
      )
      .subscribe((status) => {
        console.log("🔌 Footer subscription status:", status);
      });

    // Cleanup subscription
    return () => {
      console.log('🔌 Cleaning up footer-specific subscription');
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="pt-12 pb-6 mt-20 bg-sac-section-background">
      <div className="container flex flex-col md:flex-row justify-between text-white mb-8 space-y-12 md:space-y-0">
        {/* Left Side */}
        <div className="flex flex-col space-y-8">
          <CustomLink href="/">
            <Image
              src={websiteLogoWhite}
              width={200}
              alt="Website Logo"
              className="w-[180px] md:w-[200px]"
            />
          </CustomLink>

          <div className="text-sm text-white/75">
            <p>
              İnsan ve Medeniyet Hareketi Ankara&apos;nın
              <br className="hidden md:block" /> 
               katkılarıyla düzenlenmektedir.
            </p>
          </div>

          {/* Social Media */}
          <div className="flex gap-6">
            {mediaLinks.map((item: MediaLink) => (
              <div
                key={item.href}
                className="flex items-center justify-center text rounded text-white/50 bg-sac-black hover:bg-sac-black-hover transition duration-300"
              >
                <CustomLink
                  className="text-white/75"
                  href={item.href}
                  target="_blank"
                >
                  <i className={item.iconName}></i>
                </CustomLink>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-24">
          {/* Hızlı Linkler */}
          <div>
            <p className="font-heading text-lg md:text-xl font-semibold mb-4">
              Hızlı Linkler
            </p>
            <div className="grid grid-cols-2 gap-4 md:flex md:gap-8 font-normal text-white/75 text-sm md:text-base">
              <div className="flex flex-col gap-3">
                <CustomLink href="/">Anasayfa</CustomLink>
                <CustomLink href="/hakkimizda">Hakkımızda</CustomLink>
                <CustomLink href="/yazilar">Yazılar</CustomLink>
              </div>

              <div className="flex flex-col gap-3 relative">
                <div className="flex items-center flex-wrap">
                  <CustomLink href="/hisseal">
                    Hisse Al{" "}
                    <span className="bg-sac-red ml-2 text-white text-xs sm:text-xs px-2 py-1 rounded-[2px] whitespace-nowrap">
                      Son {displayEmptyShares} Hisse
                    </span>
                  </CustomLink>
                </div>
                <CustomLink href="/hissesorgula">Hisse Sorgula</CustomLink>
                <CustomLink href="/iletisim">İletişim</CustomLink>
              </div>
            </div>
          </div>

          {/* İletişim */}
          <div className="mt-8 md:mt-0">
            <p className="font-heading text-lg md:text-xl font-semibold mb-4">İletişim</p>
            <div className="flex flex-col gap-3 text-white/75 text-sm md:text-base">
              {/* Location */}
              <div className="flex gap-3">
                <i className="bi bi-geo-alt text-sac-primary"></i>
                <p className="font-normal">
                  Hacı Bayram, Ulus, Adliye Sk. No:1 &nbsp;
                  <br className="hidden md:block" />
                   Altındağ/Ankara (09.00 - 18.00)
                </p>
              </div>
              {/* Phone */}
              <div className="flex gap-3">
                <i className="bi bi-telephone text-sac-primary"></i>
                <p className="font-normal">
                  0312 312 44 64 <span className="text-sac-primary">/</span>{" "}
                  0552 652 90 00
                </p>
              </div>
              {/* Mail */}
              <div className="flex gap-3">
                <i className="bi bi-envelope text-sac-primary"></i>
                <p className="font-normal">
                  imhankara@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="container border border-white/10 border-1 mb-6" />
      <p className="container text-xs md:text-sm text-white/75 text-center md:text-left">
        Tüm hakları saklıdır. © 2025 İnsan ve Medeniyet Hareketi Ankara
      </p>
    </div>
  );
};

export default Footer;

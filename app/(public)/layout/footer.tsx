"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import websiteLogoWhite from "@/public/website-logo-white.svg";
import { supabase } from "@/utils/supabaseClient";

import { mediaLinks } from "../../(public)/constants";
import CustomLink from "@/components/common/custom-link";

interface SacrificeAnimal {
  empty_share: number;
}

interface MediaLink {
  href: string;
  iconName: string;
}

const Footer = () => {
  const [totalEmptyShares, setTotalEmptyShares] = useState<number>(0);

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
        setTotalEmptyShares(total);
      }
    } catch (error) {
      console.error("Error in fetchTotalEmptyShares:", error);
    }
  };

  useEffect(() => {
    // İlk yüklemede verileri al
    fetchTotalEmptyShares();

    // Real-time subscription
    const channel = supabase
      .channel("sacrifice_animals_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sacrifice_animals",
        },
        (payload) => {
          console.log("Change received!", payload);
          fetchTotalEmptyShares();
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="mt-20 pt-12 pb-6 bg-sac-section-background">
      <div className="container flex justify-between text-white mb-8">
        {/* Left Side */}
        <div className="flex flex-col space-y-8">
          <CustomLink href="/">
            <Image
              src={websiteLogoWhite}
              width={200}
              alt="Website Logo"
            ></Image>
          </CustomLink>

          <div className="text-sm text-white/75">
            <p>
              İnsan ve Medeniyet Hareketi Ankara&apos;nın
              <br />
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
        <div className="flex gap-24">
          {/* Hızlı Linkler */}
          <div>
            <p className="font-heading text-xl font-semibold mb-4">
              Hızlı Linkler
            </p>
            <div className="font-normal text-white/75 flex gap-8">
              <div className="flex flex-col gap-3">
                <CustomLink href="/">Anasayfa</CustomLink>
                <CustomLink href="/hakkimizda">Hakkımızda</CustomLink>
                <CustomLink href="/yazilar">Yazılar</CustomLink>
              </div>

              <div className="flex flex-col gap-3 relative">
                <div className="flex items-center">
                  <CustomLink href="/hisseal">
                    Hisse Al{" "}
                    <span className="bg-destructive ml-2 text-white text-[12px] px-2 py-1 rounded-[2px]">
                      Son {totalEmptyShares} Hisse
                    </span>
                  </CustomLink>
                </div>
                <CustomLink href="/hissesorgula">Hisse Sorgula</CustomLink>
                <CustomLink href="/iletisim">İletişim</CustomLink>
              </div>
            </div>
          </div>

          {/* İletişim */}
          <div>
            <p className="font-heading text-xl font-semibold mb-4">İletişim</p>
            <div className="flex flex-col gap-3 text-white/75">
              {/* Location */}
              <div className="flex gap-3">
                <i className="bi bi-geo-alt text-sac-primary"></i>
                <p className="font-normal">
                  Hacı Bayram, Ulus, Adliye Sk. No:1
                  <br />
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
                  Hacı Bayram, Ulus, Adliye Sk. No:1
                  <br />
                  Altındağ/Ankara (09.00 - 18.00)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="container border border-white/10 border-1 mb-6" />
      <p className="container text-sm text-white/75">
        Tüm hakları saklıdır. © 2025 İnsan ve Medeniyet Hareketi Ankara
      </p>
    </div>
  );
};

export default Footer;

"use client";

import websiteLogoWhite from "@/public/website-logo-white.svg";
import Image from "next/image";

import CustomLink from "@/components/common/custom-link";
import EmptySharesBadge from "@/components/common/empty-shares-badge";
import { mediaLinks } from "../../constants";

interface MediaLink {
  href: string;
  iconName: string;
}

const Footer = () => {
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
            <p className="text-lg md:text-xl font-semibold mb-4">
              Hızlı Linkler
            </p>
            <div className="grid grid-cols-2 gap-4 md:flex md:gap-8 font-normal text-white/75 text-sm md:text-base">
              <div className="flex flex-col gap-3">
                <CustomLink href="/">Anasayfa</CustomLink>
                <CustomLink href="/hakkimizda">Hakkımızda</CustomLink>
                <CustomLink href="/iletisim">İletişim</CustomLink>
              </div>

              <div className="flex flex-col gap-3 relative">
                <div className="flex items-center flex-wrap">
                  <CustomLink href="/hisseal">
                    Hisse Al{" "}
                    <EmptySharesBadge />
                  </CustomLink>
                </div>
                <CustomLink href="/hissesorgula">Hisse Sorgula</CustomLink>
              </div>
            </div>
          </div>

          {/* İletişim */}
          <div className="mt-8 md:mt-0">
            <p className="text-lg md:text-xl font-semibold mb-4">
              İletişim
            </p>
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
                <p className="font-normal">imhankara@gmail.com</p>
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

"use client";

import { useTenantBranding } from "@/hooks/useTenantBranding";
import Image from "next/image";

import EmptySharesBadge from "@/components/common/empty-shares-badge";
import CustomLink from "@/components/custom-data-components/custom-link";
import { mediaLinks } from "../../../app/(public)/constants";

const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000001";

interface MediaLink {
  href: string;
  iconName: string;
}

const Footer = () => {
  const branding = useTenantBranding();
  const isTest = branding.tenant_id === TEST_TENANT_ID;
  const isElya = branding.logo_slug === "elya-hayvancilik";
  const logoSizeClass = isElya ? "w-[112px] md:w-[125px]" : "w-[225px] md:w-[250px]";

  return (
    <div className="pt-12 pb-6 mt-20 bg-sac-section-background">
      {/* Main content */}
      <div className="mx-auto w-full max-w-7xl px-4 md:pl-6 md:pr-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start text-white mb-8 space-y-12 md:space-y-0 gap-12">
          {/* Sol grup: Logo + Sosyal medya */}
          <div className="flex flex-col space-y-8 shrink-0 md:items-start">
            <CustomLink href="/">
              {isTest ? (
                <span className="font-sans font-bold text-xl md:text-2xl text-white">
                  KURBAN SİTESİ
                </span>
              ) : (
                <Image
                  src={`/logos/${branding.logo_slug}/${branding.logo_slug}-white.svg`}
                  alt="Website Logo"
                  className={logoSizeClass}
                  width={250}
                  height={60}
                />
              )}
            </CustomLink>

            {/* Social Media */}
            <div className="flex gap-6">
              {mediaLinks.map((item: MediaLink) => (
                <div
                  key={item.href}
                  className="flex items-center justify-center rounded text-white/50 bg-sac-black hover:bg-sac-black-hover transition duration-300"
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

          {/* Sağ grup: Hızlı Linkler + İletişim - yukarı yaslı, kendi içlerinde sola yaslı */}
          <div className="flex flex-col md:flex-row md:gap-12 lg:gap-16 shrink-0 md:items-start">
            {/* Hızlı Linkler */}
            <div className="text-left">
              <p className="md:text-xl font-semibold mb-4">Hızlı Linkler</p>

              <div className="grid grid-cols-2 gap-4 font-normal text-white/75">
                <div className="flex flex-col gap-3 items-start">
                  <CustomLink href="/">Anasayfa</CustomLink>
                  <CustomLink href="/hakkimizda">Hakkımızda</CustomLink>
                  <CustomLink href="/iletisim">İletişim</CustomLink>
                </div>
                <div className="flex flex-col gap-3 items-start">
                  <div className="flex items-center flex-wrap">
                    <CustomLink href="/hisseal">
                      Hisse Al <EmptySharesBadge size="md" />
                    </CustomLink>
                  </div>
                  <CustomLink href="/hissesorgula">Hisse Sorgula</CustomLink>
                </div>
              </div>
            </div>

            {/* İletişim */}
            <div className="mt-8 md:mt-0 text-left">
              <p className="md:text-xl font-semibold mb-4">İletişim</p>

              <div className="flex flex-col gap-3 text-white/75 text-sm md:text-base items-start">
                <div className="flex gap-3 max-w-[28rem]">
                  <i className="bi bi-geo-alt text-primary shrink-0"></i>
                  <p className="font-normal leading-relaxed">
                    {branding.contact_address}
                  </p>
                </div>

                <div className="flex gap-3">
                  <i className="bi bi-telephone text-primary shrink-0"></i>
                  <p className="font-normal">{branding.contact_phone}</p>
                </div>

                <div className="flex gap-3">
                  <i className="bi bi-envelope text-primary shrink-0"></i>
                  <p className="font-normal">{branding.contact_email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="container border border-white/10 border-1 mb-6" />

      <p className="container text-xs md:text-sm text-white/75 text-center md:text-left">
        Tüm hakları saklıdır.
        {/* Don't remove the below */}
        {/* © 2025 İnsan ve Medeniyet Hareketi Ankara */}
      </p>
    </div>
  );
};

export default Footer;
"use client";

import { useTenantBranding } from "@/hooks/useTenantBranding";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000001";

interface LogoProps {
  className?: string;
}

function Logo({ className }: LogoProps) {
  const { tenant_id, logo_slug } = useTenantBranding();
  const isTest = tenant_id === TEST_TENANT_ID;
  const isElya = logo_slug === "elya-hayvancilik";
  const sizeClass = isElya ? "w-[112px] md:w-[125px]" : className;

  if (isTest) {
    return (
      <div className={cn(sizeClass ?? className)}>
        <Link href="/" className="block">
          <span className="font-sans font-bold text-xl md:text-2xl text-foreground">
            KURBAN SİTESİ
          </span>
        </Link>
      </div>
    );
  }

  const logoSrc = `/logos/${logo_slug}/${logo_slug}.svg`;
  return (
    <div className={cn(sizeClass)}>
      <Link href="/" className="block">
        <Image
          src={logoSrc}
          alt="Logo"
          width={300}
          height={80}
          className="w-full h-auto"
        />
      </Link>
    </div>
  );
}

export default Logo;
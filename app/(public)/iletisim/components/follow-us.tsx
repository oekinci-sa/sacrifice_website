"use client";

import Link from "next/link";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { cn } from "@/lib/utils";

const FollowUs = () => {
  const branding = useTenantBranding();
  const links = branding.contact_social_links;

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-4 lg:gap-8">
      <p className="font-bold text-lg lg:text-xl whitespace-nowrap">Bizi takip edin!</p>
      <div className="flex flex-wrap gap-3 lg:gap-6">
        {links.map((item) => (
          <div
            key={item.href}
            className={cn(
              "bg-muted hover:bg-muted/80 transition-colors duration-200 flex items-center justify-center rounded-full w-8 h-8 lg:w-10 lg:h-10",
              item.color ?? "text-muted-foreground"
            )}
          >
            <Link href={item.href} target="_blank" rel="noopener noreferrer">
              <i className={`text-base lg:text-lg ${item.icon_name}`}></i>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowUs;

"use client";

import Link from "next/link";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { resolveContactSocialLinkColor } from "@/lib/contact-social-links";
import { cn } from "@/lib/utils";

const FollowUs = () => {
  const branding = useTenantBranding();
  const links = branding.contact_social_links;

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-4 lg:gap-8">
      <p className="font-bold text-lg lg:text-xl whitespace-nowrap">Bizi takip edin!</p>
      <div className="flex flex-wrap gap-3 lg:gap-6">
        {links.map((item) => {
          const color = resolveContactSocialLinkColor(item);
          return (
            <div
              key={item.href}
              className="bg-muted hover:bg-muted/80 transition-colors duration-200 flex items-center justify-center rounded-full w-8 h-8 lg:w-10 lg:h-10"
            >
              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center leading-none"
              >
                <i
                  className={cn("text-base lg:text-lg leading-none", item.icon_name)}
                  style={{ color }}
                />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FollowUs;

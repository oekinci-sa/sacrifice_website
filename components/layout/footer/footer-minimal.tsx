"use client";

import CustomLink from "@/components/custom-data-components/custom-link";
import { useTenantBranding } from "@/hooks/useTenantBranding";

const Footer = () => {
  const branding = useTenantBranding();
  const socialLinks = branding.contact_social_links;

  return (
    <div className="container flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 py-6 md:py-12">
      <p className="text-sm md:text-base text-black/75 text-center md:text-left">
        Tüm hakları saklıdır.
      </p>

      {socialLinks.length > 0 ? (
        <div className="flex gap-6 flex-wrap justify-center">
          {socialLinks.map((item) => (
            <div
              key={item.href}
              className="flex items-center justify-center rounded-full transition-colors duration-200"
            >
              <CustomLink
                className="text-black/75"
                href={item.href}
                target="_blank"
              >
                <i className={item.icon_name}></i>
              </CustomLink>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Footer;

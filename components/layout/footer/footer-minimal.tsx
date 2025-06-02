"use client";

import CustomLink from "@/components/custom-data-components/custom-link";
import { mediaLinks } from "../../../app/(public)/constants";

interface MediaLink {
  href: string;
  iconName: string;
}

const Footer = () => {
  return (
    <div className="container flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 py-6 md:py-12">
      <p className="text-sm md:text-base text-black/75 text-center md:text-left">
        Tüm hakları saklıdır. © 2025 Ankara Kurban
      </p>

      {/* Social Media */}
      <div className="flex gap-6">
        {mediaLinks.map((item: MediaLink) => (
          <div
            key={item.href}
            className="flex items-center justify-center rounded-full transition-colors duration-200 flex items-center justify-center"
          >
            <CustomLink
              className="text-black/75"
              href={item.href}
              target="_blank"
            >
              <i className={item.iconName}></i>
            </CustomLink>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Footer;

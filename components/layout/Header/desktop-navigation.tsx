"use client";

import React from 'react'
import CustomLink from '@/components/common/custom-link';
import { usePathname, useRouter } from 'next/navigation';
import { scrollToElement } from '@/utils/scrollToElement';
// import { ChevronDown } from 'lucide-react';
  
const DesktopNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleScrollClick = async (elementId: string) => {
    if (pathname !== '/') {
      await router.push('/');
      // Sayfanın yüklenmesi için kısa bir bekleme
      setTimeout(() => scrollToElement(elementId), 100);
    } else {
      scrollToElement(elementId);
    }
  };

  return (
    <nav className="flex gap-10 items-center justify-between">
      <CustomLink href="/">
        Anasayfa
      </CustomLink>
      <CustomLink 
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleScrollClick('prices');
        }}
      >
        Hisse Bedelleri
      </CustomLink>
      <CustomLink 
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleScrollClick('process');
        }}
      >
        Süreç
      </CustomLink>
      <CustomLink 
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleScrollClick('faq');
        }}
      >
        S.S.S
      </CustomLink>
      <CustomLink href="/hakkimizda">
        Hakkımızda
      </CustomLink>
      <CustomLink href="/hisseal">
        Hisse Al
      </CustomLink>
      <CustomLink href="/hissesorgula">
        Hisse Sorgula
      </CustomLink>
      <CustomLink href="/yazilar">
        Yazılar
      </CustomLink>
      <CustomLink href="/iletisim">
        İletişim
      </CustomLink>
    </nav>
  );
}

export default DesktopNavigation
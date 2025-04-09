"use client";

import React from 'react'
import CustomLink from '@/components/common/custom-link';
  
const DesktopNavigation = () => {

  return (
    <nav className="flex gap-10 items-center justify-between">
      <CustomLink href="/">
        Anasayfa
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
      <CustomLink href="/iletisim">
        İletişim
      </CustomLink>
    </nav>
  );
}

export default DesktopNavigation
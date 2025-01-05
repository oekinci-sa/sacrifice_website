import React from 'react'
import CustomLink from '@/components/common/custom-link';
// import { ChevronDown } from 'lucide-react';
  
const Navigation = () => {
  return (
    <nav className="flex gap-8 items-center justify-between">
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
        <CustomLink href="/yazilar">
          Yazılar
        </CustomLink>
        <CustomLink href="/iletisim">
          İletişim
        </CustomLink>
    </nav>
  );
}

export default Navigation
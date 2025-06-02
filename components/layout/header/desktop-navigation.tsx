"use client";

import EmptySharesBadge from '@/components/common/empty-shares-badge';
import CustomLink from '@/components/custom-data-components/custom-link';

const DesktopNavigation = () => {

  return (
    <nav className="flex gap-10 items-center justify-between">
      <CustomLink href="/">
        Anasayfa
      </CustomLink>
      <CustomLink href="/hakkimizda">
        Hakkımızda
      </CustomLink>
      <CustomLink href="/hisseal" className="flex items-center">
        Hisse Al
        <EmptySharesBadge size="sm" />
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
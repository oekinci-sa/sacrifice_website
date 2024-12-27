import React from 'react'
import Link from "next/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@radix-ui/react-navigation-menu';
import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

const Navigation = () => {
  return (
    <div className="flex gap-8">
      <NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
            <Link href="/docs" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Documentation
            </NavigationMenuLink>
          </Link>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
  
      <Link href="/">Anasayfa</Link>
      <Link href="/hakkimizda">Hakkımızda</Link>
      <Link href="/hisseal">Hisse İşlemleri</Link>
      <Link href="/sss">S.S.S</Link>
    </div>
  );
}

export default Navigation
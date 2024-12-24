import React from 'react'
import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";

import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

const Navigation = () => {
  return (
    <div>
      <NavigationMenu>
        <NavigationMenuList className='flex space-x-4'>
          <NavigationMenuItem>
            <Link href="/">Anasayfa</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/hakkimizda">Hakkımızda</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/">Hisse İşlemleri</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Hisse İşlemleri</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink>Link</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/">S.S.S</Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

export default Navigation
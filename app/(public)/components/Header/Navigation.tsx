import React from 'react'
import Link from "next/link";
import { navigationItems } from '@/constants/';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
  
import { MoonIcon, SunIcon } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const Navigation = () => {
  return (
    <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
      <nav className="flex flex-1 items-center justify-between">
        <div className="flex gap-6">
          <Link href="/" className="font-medium hover:text-primary">
            <Button variant='ghost'>Anasayfa</Button>
          </Link>
          <Link href="/hakkimizda" className="font-medium hover:text-primary">
            <Button variant='ghost'>Hakkımızda</Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex space-x-4 font-medium hover:text-primary whitespace-nowrap">
              <p>Hisse İşlemleri</p>
              <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Hisse Al</DropdownMenuItem>
              <DropdownMenuItem>Hisse Sorgula</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/yazilar" className="font-medium hover:text-primary">
            <Button variant='ghost'>Yazılar</Button>
          </Link>
          <Link href="/iletisim" className="font-medium hover:text-primary">
            <Button variant='ghost'>İletişim</Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default Navigation
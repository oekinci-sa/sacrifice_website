import React from 'react'
import Image from "next/image";
import websiteLogo from "@/public/website-logo.svg";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn(className)}>
      <Link href="/">
        <Image src={websiteLogo} alt="Logo"/>
      </Link>
    </div>
  );
}

export default Logo
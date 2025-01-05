import React from 'react'
import Image from "next/image";
import websiteLogo from "@/public/website-logo.svg";
import websiteLogoWhite from "@/public/website-logo-white.svg";
import Link from 'next/link';

const Logo = () => {
  return (
    <div>
      <Link href="/">
        <Image className="dark:hidden" src={websiteLogo} alt="Logo" width={200} />
        <Image className="hidden dark:block" src={websiteLogoWhite} alt="Logo" width={200} />
      </Link>
    </div>
  );
}

export default Logo
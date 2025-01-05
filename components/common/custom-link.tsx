"use client"

import Link from "next/link";
import { ReactNode } from "react";

interface CustomLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

const CustomLink = ({ href, children, className = "", ...props }: CustomLinkProps) => {

  return (
    <Link
      className={`font-medium text-navlinkColor hover:text-primary ${className}`} href={href}
      {...props}>
        {children}
    </Link>
  );
};

export default CustomLink;

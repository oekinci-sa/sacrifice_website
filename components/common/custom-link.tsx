"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface CustomLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
}

const CustomLink = ({
  href,
  children,
  className = "",
  target = "",
  ...props
}: CustomLinkProps) => {
  return (
    <Link
      className={`font-medium hover:text-sac-primary transition-all duration-300 ${className}`}
      href={href}
      target={target}
      {...props}
    >
      {children}
    </Link>
  );
};

export default CustomLink;

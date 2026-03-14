import { cn } from '@/lib/utils';
import websiteLogo from "@/public/logos/ankara-kurban/ankara-kurban.svg";
import Image from "next/image";
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn(className)}>
      <Link href="/">
        <Image src={websiteLogo} alt="Logo" />
      </Link>
    </div>
  );
}

export default Logo
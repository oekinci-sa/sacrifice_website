import { ModeToggle } from "@/components/layout/public/Header/mode-toggle";
import Logo from "@/components/layout/public/Header/logo";
import Navigation from "@/components/layout/public/Header/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Header = () => {
  return (
    <header className="container flex items-center justify-between my-8">
      <Logo></Logo>
      <Navigation></Navigation>
      <div className="flex justify-end gap-4">
        {/* <i className="bi bi-brightness-high"></i> */}
        <ModeToggle></ModeToggle>
        <Button>
          <Link href="/hisseal">Hemen al</Link>
        </Button>
      </div>
    </header>
  );
};

export default Header;

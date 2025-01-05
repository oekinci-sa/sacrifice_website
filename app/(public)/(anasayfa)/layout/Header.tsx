import { ModeToggle } from "@/components/layout/public/Header/ModeToggle";
import Logo from "../../../../components/layout/public/Header/Logo";
import Navigation from "../../../../components/layout/public/Header/Navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Header = () => {
  return (
    <header className="container my-12 flex items-center justify-between">
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

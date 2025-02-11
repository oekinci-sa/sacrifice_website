import Logo from "@/components/layout/Header/logo";
import Navigation from "@/components/layout/Header/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Header = () => {
  return (
    <header className="container flex items-center justify-between mt-8">
      <Logo></Logo>
      <Navigation></Navigation>
      <div className="flex justify-end gap-4">
        {/* <i className="bi bi-brightness-high"></i> */}
        <Button className="bg-sac-primary text-white hover:bg-sac-primary/90 text-md">
          <Link href="/hisseal">Hemen al</Link>
        </Button>
      </div>
    </header>
  );
};

export default Header;

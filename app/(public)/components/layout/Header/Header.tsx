import React from "react";

import Navigation from "./Navigation";
import Logo from "@/app/(public)/components/layout/Header/Logo";
import RightPart from "./RightPart";

const Header = () => {
  return (
    <div className="flex justify-between items-center">
      <Logo></Logo>
      <Navigation></Navigation>
      <RightPart></RightPart>
    </div>
  );
};

export default Header;

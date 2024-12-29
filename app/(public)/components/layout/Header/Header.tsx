import React from "react";

import Navigation from "./Navigation";
import RightPart from "./Rightpart";
import Logo from "@/app/(public)/components/layout/Header/Logo";

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

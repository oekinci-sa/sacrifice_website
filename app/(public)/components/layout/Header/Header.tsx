import React from "react";

import Navigation from "./navigation";
import RightPart from "./rightpart";
import Logo from "./Logo";

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

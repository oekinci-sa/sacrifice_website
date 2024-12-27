import React from 'react'

import Logo from './Logo';
import Navigation from './Navigation';
import RightPart from './RightPart';


const Header = () => {
  return (
    <div className="flex justify-between items-center">
      <Logo></Logo>
      <Navigation></Navigation>
      <RightPart></RightPart>
    </div>
  );
}

export default Header



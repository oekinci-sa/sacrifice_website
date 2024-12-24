import React from 'react'

import Logo from './Logo';
import Navigation from './Navigation';
import LeftPart from './LeftPart';


const Header = () => {
  return (
    <div className="flex justify-between items-center m-8">
      <Logo></Logo>
      <Navigation></Navigation>
      <LeftPart></LeftPart>
    </div>
  );
}

export default Header



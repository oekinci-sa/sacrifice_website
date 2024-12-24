import React from 'react'
import Image from "next/image";
import websiteLogo from "/public/website-logo.svg";

const Logo = () => {
  return (
    <div>
      <Image src={websiteLogo} alt="Logo" width={200}/>
    </div>
  );
}

export default Logo
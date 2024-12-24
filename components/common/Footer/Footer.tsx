import Link from 'next/link';
import React from 'react'
import LeftPart from '../Footer/LeftPart';
import RightPart from "../Footer/RightPart";
// import websiteLogoWhite from "/public/website-logo-white.svg";
// import { mediaLinks } from "/constants/";

const Footer = () => {
  return (
    <div className="flex justify-between bg-black pt-12 pb-6">
      <LeftPart></LeftPart>
      <RightPart></RightPart>
    </div>
  );
}

export default Footer
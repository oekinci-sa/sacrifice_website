import Image from 'next/image'
import React from 'react'
import websiteLogoWhite from '/public/website-logo-white.svg'
import Link from 'next/link';
import { mediaLinks } from "/constants";


const LeftPart = () => {
  return (
    <div className="flex flex-col space-y-3">
      <Link href="/">
        <Image src={websiteLogoWhite} width={250} alt=""></Image>
      </Link>
      <div className="text-sm text-white/50">
        <p>
          İnsan ve Medeniyet Hareketi Ankara&apos;nın
          <br />
          katkılarıyla düzenlenmektedir.
        </p>
      </div>

      {/* Social Media */}
      <ul className="flex gap-3">
        {mediaLinks.map((item) => (
          <li
            key={item.href}
            className="flex items-center justify-center text rounded text-white/50 bg-sac-black hover:bg-sac-black-hover transition duration-300 w-8 h-8"
          >
            <a href={item.href} target="_blank">
              <i className={item.iconName}></i>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LeftPart
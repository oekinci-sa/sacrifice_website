import React from 'react'

import { features } from "@/constants";
import Image from 'next/image';

const Features = () => {
  return (
    <div>
      {/* Features */}
      <div className="container flex flex-wrap justify-between">
        {features.map((item) => (
          <div key={item.src} className="flex flex-col w-80">
            <Image
              src={`/icons/landing_page/${item.src}`}
              alt="Example SVG"
              width={24}
              height={24} // Genişlik ve yükseklik değerlerini ayarlayın
              className='min-h-16'
            />
            <div className="flex flex-col justify-between">
              <p className="font-heading text-xl font-bold">{item.header}</p>
              <p className="text-navlinkColor">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Features
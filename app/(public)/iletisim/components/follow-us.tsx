import React from "react";
import { mediaLinks } from "../../(anasayfa)/constants";
import Link from "next/link";

const FollowUs = () => {
  return (
    <div className="flex items-center gap-4 lg:gap-8">
      <p className="font-bold text-lg lg:text-xl whitespace-nowrap">Bizi takip edin!</p>
      <div className="flex flex-wrap gap-3 lg:gap-6">
        {mediaLinks.map((item) => (
          <div
            key={item.href}
            className={`bg-[#f8f8f8] hover:bg-[#dce0e5] transition-colors duration-200 flex items-center justify-center rounded-full w-8 h-8 lg:w-10 lg:h-10 ${item.color}`}
          >
            <Link href={item.href} target="_blank">
              <i className={`text-base lg:text-lg ${item.iconName}`}></i>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowUs;

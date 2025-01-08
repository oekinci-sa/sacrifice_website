import React from "react";
import { mediaLinks } from "../../(anasayfa)/constants";
import Link from "next/link";

const FollowUs = () => {
  return (
    <div className="flex space-x-8 items-center">
      <p className="font-bold text-2xl">Bizi takip edin!</p>
      <div className="flex gap-6">
        {mediaLinks.map((item) => (
          <div
            key={item.href}
            className={`bg-[#f8f8f8] flex items-center justify-center rounded-full w-10 h-10 ${item.color}`}
          >
            <Link href={item.href} target="_blank">
              <i className={`text-lg ${item.iconName}`}></i>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowUs;

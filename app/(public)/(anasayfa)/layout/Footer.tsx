import Image from "next/image";
import websiteLogoWhite from "@/public/website-logo-white.svg";


import { mediaLinks } from "../../constants";
import CustomLink from "@/components/common/custom-link";

const Footer = () => {
  return (
    <div className="bg-buttonBlack mt-20 pt-12 pb-6">
      <div className="container flex justify-between text-white mb-8">
        {/* Left Side */}
        <div className="flex flex-col space-y-8">
          <CustomLink href="/">
            <Image
              src={websiteLogoWhite}
              width={200}
              alt="Website Logo"
            ></Image>
          </CustomLink>

          <div className="text-sm text-white/90">
            <p>
              İnsan ve Medeniyet Hareketi Ankara'nın
              <br />
              katkılarıyla düzenlenmektedir.
            </p>
          </div>

          {/* Social Media */}
          <ul className="flex gap-6">
            {mediaLinks.map((item) => (
              <li
                key={item.href}
                className="flex items-center justify-center text rounded text-white/50 bg-sac-black hover:bg-sac-black-hover transition duration-300"
              >
                <CustomLink
                  className="text-white/90"
                  href={item.href}
                  target="_blank"
                >
                  <i className={item.iconName}></i>
                </CustomLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side */}
        <div className="flex gap-24">
          {/* Hızlı Linkler */}
          <div>
            <p className="font-heading text-xl font-semibold mb-4">
              Hızlı Linkler
            </p>
            <div className="font-normal text-white flex gap-8">
              <div className="flex flex-col gap-3">
                <CustomLink href="/">Anasayfa</CustomLink>
                <CustomLink href="/hakkimizda">Hakkımızda</CustomLink>
                <CustomLink href="/yazilar">Yazılar</CustomLink>
              </div>

              <div className="flex flex-col gap-3 relative">
                <div className="flex items-center">
                  <CustomLink href="/hisseal">
                    Hisse Al{" "}
                    <span className="ml-2 bg-myRed text-white text-[12px] px-2 py-1 rounded-[2px]">
                      Son 30 Hisse
                    </span>
                  </CustomLink>
                </div>
                <CustomLink href="/hissesorgula">Hisse Sorgula</CustomLink>
                <CustomLink href="/iletisim">İletişim</CustomLink>
              </div>
            </div>
          </div>

          {/* İletişim */}
          <div>
            <p className="font-heading text-xl font-semibold mb-4">İletişim</p>
            <div className="flex flex-col gap-3 text-white/50">
              {/* Location */}
              <div className="flex gap-3">
                <i className="bi bi-geo-alt text-primary"></i>
                <p className="font-normal">
                  Hacı Bayram, Ulus, Adliye Sk. No:1
                  <br />
                  Altındağ/Ankara (09.00 - 18.00)
                </p>
              </div>
              {/* Phone */}
              <div className="flex gap-3">
                <i className="bi bi-telephone text-primary"></i>
                <p className="font-normal">0312 312 44 64 / 0552 652 90 00</p>
              </div>
              {/* Mail */}
              <div className="flex gap-3">
                <i className="bi bi-envelope text-primary"></i>
                <p className="font-normal">
                  Hacı Bayram, Ulus, Adliye Sk. No:1
                  <br />
                  Altındağ/Ankara (09.00 - 18.00)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="container border border-white/5 border-1 mb-6" />
      <p className="container text-sm text-white/60">
        Tüm hakları saklıdır. © 2025 İnsan ve Medeniyet Hareketi Ankara
      </p>
    </div>
  );
};

export default Footer;

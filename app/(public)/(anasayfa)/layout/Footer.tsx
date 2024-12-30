import Link from "next/link";
import Image from "next/image";
import websiteLogoWhite from "@/public/website-logo-white.svg";


import { mediaLinks } from "@/constants";

const Footer = () => {
  return (
    <div className="bg-sac-black pt-12 pb-6">
      <div className="container flex justify-between text-white mb-8">
        {/* Left Side */}
        <div className="flex flex-col space-y-6">
          <Link href="/">
            <Image src={websiteLogoWhite} width={200} alt="Website Logo"></Image>
          </Link>
          <div className="text-sm text-white/50">
            <p>
              İnsan ve Medeniyet Hareketi Ankara'nın
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
                <Link href={item.href} target="_blank">
                  <i className={item.iconName}></i>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side */}
        <div className="flex gap-24">
          {/* Hızlı Linkler */}
          <div>
            <p className="font-header text-xl font-semibold mb-4">
              Hızlı Linkler
            </p>
            <div className="font-normal text-white/50 flex gap-8">
              <div className="flex flex-col gap-3">
                <Link
                  className="hover:text-sac-primary transition duration-300"
                  href="/hakkimizda"
                >
                  Hakkımızda
                </Link>
                <Link
                  className="hover:text-sac-primary transition duration-300"
                  href="/galeri"
                >
                  Galeri
                </Link>
                <Link
                  className="hover:text-sac-primary transition duration-300"
                  href="/surec"
                >
                  Süreç
                </Link>
                {/* <Link
                  className="hover:text-sac-primary transition duration-300"
                  href="/yazilar"
                >
                  Yazılar
                </Link> */}
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  className="hover:text-sac-primary transition duration-300"
                  href="/hisseal"
                >
                  Hisse Al
                </Link>
                <Link
                  className="hover:text-sac-primary transition duration-300"
                  href="/hissesorgula"
                >
                  Hisse Sorgula
                </Link>
                <Link
                  className="hover:text-sac-primary transition duration-300"
                  href="/sss"
                >
                  Sıkça Sorulan Sorular
                </Link>
              </div>
            </div>
          </div>

          {/* İletişim */}
          <div>
            <p className="font-header text-xl font-semibold mb-4">İletişim</p>
            <div className="flex flex-col gap-3 text-white/50">
              {/* Location */}
              <div className="flex gap-3">
                <i className="bi bi-geo-alt text-sac-primary"></i>
                <p className="font-normal">
                  Hacı Bayram, Ulus, Adliye Sk. No:1
                  <br />
                  Altındağ/Ankara (09.00 - 18.00)
                </p>
              </div>
              {/* Phone */}
              <div className="flex gap-3">
                <i className="bi bi-telephone text-sac-primary"></i>
                <p className="font-normal">0312 312 44 64 / 0552 652 90 00</p>
              </div>
              {/* Mail */}
              <div className="flex gap-3">
                <i className="bi bi-envelope text-sac-primary"></i>
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
        Tüm hakları saklıdır. © 2024 İnsan ve Medeniyet Hareketi Ankara
      </p>
    </div>
  );
};

export default Footer;

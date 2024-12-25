import Link from 'next/link';
import React from 'react'
import LeftPart from '../Footer/LeftPart';
import RightPart from "../Footer/RightPart";
// import websiteLogoWhite from "/public/website-logo-white.svg";
// import { mediaLinks } from "/constants/";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo ve Sosyal Medya */}
        <div>
          <h2 className="text-xl font-bold mb-2">ANKARA KURBAN</h2>
          <p className="text-gray-400 mb-4">
            İnsan ve Medeniyet Hareketi Ankara'nın katkılarıyla
            düzenlenmektedir.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="bi bi-facebook"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="bi bi-twitter"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="bi bi-instagram"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="bi bi-youtube"></i>
            </a>
          </div>
        </div>

        {/* Hızlı Linkler */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Hızlı Linkler</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Hakkımızda
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Galeri
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Süreç
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Yazılar
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-white flex items-center"
              >
                Hisse Al
                <span className="bg-red-500 text-white text-xs font-bold ml-2 px-2 py-1 rounded">
                  Son 30 Hisse
                </span>
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Hisse Sorgula
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white">
                Sıkça Sorulan Sorular
              </a>
            </li>
          </ul>
        </div>

        {/* İletişim */}
        <div>
          <h3 className="text-lg font-semibold mb-4">İletişim</h3>
          <ul className="space-y-2">
            <li className="text-gray-400 flex items-center">
              <i className="bi bi-geo-alt text-green-500 mr-2"></i>
              Hacı Bayram, Ulus, Adliye Sk. No:1 Altındağ/Ankara (09.00 - 18.00)
            </li>
            <li className="text-gray-400 flex items-center">
              <i className="bi bi-telephone text-green-500 mr-2"></i>
              0312 312 44 64 / 0552 652 90 00
            </li>
            <li className="text-gray-400 flex items-center">
              <i className="bi bi-envelope text-green-500 mr-2"></i>
              imhankara06@hotmail.com
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8 text-center text-gray-500 text-sm">
        Tüm hakları saklıdır. © 2024 İnsan ve Medeniyet Hareketi Ankara
      </div>
    </footer>
  );
}

export default Footer
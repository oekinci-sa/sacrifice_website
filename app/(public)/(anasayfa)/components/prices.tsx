import Image from "next/image";
import Link from "next/link";
import React from "react";

const Prices = () => {
  return (
    <div className="container flex space-x-16">
      {/* Sol kısım */}
      <div className="flex items-start space-x-4">
        <div className="relative w-80 h-96 bg-gray-200">
          <Image
            src="https://picsum.photos/320/480"
            alt="Placeholder"
            width={320}
            height={480}
            priority={true} // İlk yüklemede optimize edilmesi için
            className="rounded-md"
          />
          <Image
            src="/icons/birds.svg"
            alt="Placeholder"
            width={96}
            height={96}
            priority={true} // İlk yüklemede optimize edilmesi için
            className="absolute right-12 top-[465px]"
          />
        </div>

        <div className="flex flex-col items-center space-y-4">
          {/* İkili */}
          <div className="flex justify-between w-full">
            {/* 7 Yıl+ */}
            <div className="flex flex-col items-center justify-center space-y-2 bg-black text-white rounded-md p-2 w-36 h-36">
              <p className="font-heading text-4xl font-bold">
                7 Yıl<span className="text-sac-primary">+</span>
              </p>
              <p className="text-xl">Tecrübe</p>
            </div>
            {/* 1000+ */}
            <div className="flex flex-col items-center justify-center space-y-2 bg-sac-primary text-white rounded-md p-2 w-36 h-36">
              <p className="font-heading text-4xl font-bold">
                1000<span>+</span>
              </p>
              <p className="text-xl">Kurban</p>
            </div>
          </div>
          <Image
            src="https://picsum.photos/320/480"
            alt="Placeholder"
            width={320}
            height={480}
            priority={true} // İlk yüklemede optimize edilmesi için
            className="rounded-md"
          />
        </div>
      </div>

      {/* Sağ kısım */}
      <div className="flex flex-col justify-between">
        <p className="font-heading text-6xl font-bold">
          Bu seneki <br /> hisse bedellerimiz
        </p>

        {/* Alt bilgi */}

        <div className="flex flex-col space-y-4">
          <p>
            * Kilogram bilgileri <b>±3 kg</b> arasında değişiklik
            gösterebilmektedir.
          </p>
          <div className="flex space-x-4">
            <Image
              src="/icons/location.svg"
              alt="Example SVG"
              width={24}
              height={24} // Genişlik ve yükseklik değerlerini ayarlayın
            />
            <p>
              Kurban kesim yerimiz, Kahramankazan’a bağlı Ciğir köyündedir.
              <br />
              <Link
                href="#"
                className="text-sac-primary hover:underline hover:text-primary-dark"
              >
                Konum için tıklayınız.
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prices;

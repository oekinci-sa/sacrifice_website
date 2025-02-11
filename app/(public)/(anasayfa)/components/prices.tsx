import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const Prices = () => {
  const router = useRouter();
  const priceItems = Array.from({ length: 9 }, (_, i) => ({
    kg: 26 + (i * 4),
    price: 30000 + (i * 6000)
  }));

  return (
    <div className="container flex space-x-16">
      {/* Sol kısım */}
      <div className="flex items-start space-x-4">
        <div className="relative w-80 h-96">
          <Image
            src="/images/left-image.jpg"
            alt="Left Side Image"
            fill
            priority
            className="object-cover rounded-md"
          />
          <Image
            src="/icons/birds.svg"
            alt="Birds Icon"
            width={96}
            height={96}
            priority
            className="absolute right-12 top-[350px]"
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
          <div className="relative w-80 h-96">
            <Image
              src="/images/right-image.jpg"
              alt="Right Side Image"
              fill
              priority
              className="object-cover rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Sağ kısım */}
      <div className="flex flex-col justify-between">
        <div className="space-y-8">
          <p className="font-heading text-6xl font-bold">
            Bu seneki <br /> hisse bedellerimiz
          </p>

          <div className="grid grid-cols-3 gap-4">
            {priceItems.map((item, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center justify-center bg-white rounded-lg p-4 hover:scale-105 transition-all duration-300 cursor-pointer" 
                onClick={() => router.push('/hisseal')}
              >
                <div className="flex items-center justify-center bg-black text-white text-md font-medium px-2 py-1 rounded-md">
                  {item.kg} KG
                </div>
                <div className="text-lg font-semibold bg-sac-primary text-white px-2 py-1 rounded-md">
                  {item.price.toLocaleString('tr-TR')} TL
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alt bilgi */}
        <div className="flex flex-col space-y-4 mt-8">
          <p>
            * Kilogram bilgileri <b>±3 kg</b> arasında değişiklik
            gösterebilmektedir.
          </p>
          <div className="flex space-x-4">
            <Image
              src="/icons/location.svg"
              alt="Location Icon"
              width={24}
              height={24}
            />
            <p>
              Kurban kesim yerimiz, Kahramankazan'a bağlı Ciğir köyündedir.
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

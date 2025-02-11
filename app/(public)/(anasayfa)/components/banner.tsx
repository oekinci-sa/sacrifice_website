import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import Image from "next/image";

const Banner = () => {
  return (
    <>
    {/* Ayah */}
      <div className="container flex flex-col space-y-4 text-2xl text-center">
        <p className="font-medium">
          Şüphesiz kurbanlarınızın,{" "}
          <span className="text-sac-primary font-semibold">
            ne etleri ne de kanları
          </span>{" "}
          Allah&apos;a ulaşır.
          <br />
          Fakat O&apos;na sizin{" "}
          <span className="text-sac-primary font-semibold">
            takvanız{" "}
          </span>
          ulaşır.
        </p>
        <p className="font-normal text-xl">
          Hac Suresi, 37. Ayeti Kerime
        </p>
      </div>

      <div className="container font-heading flex items-center justify-between gap-4 mb-32">
        {/* Left */}
        <div className="flex flex-col gap-8 font-heading basis-3/5">
          {/* Ana başlık */}
          <div>
            <p className="text-6xl font-heading font-bold mb-2">
              Kurban ibadetini
            </p>
            <p className="text-6xl font-heading font-bold text-sac-primary">
              birlikte gerçekleştirelim.
            </p>
          </div>

          {/* Açıklama */}
          <p className="text-2xl text-black/70 font-normal tracking-wide leading-relaxed">
            Yılları aşkın tecrübemizle binlerce hissedarı <br />
            bu sene de bir araya getiriyoruz.
          </p>

          {/* Buttons */}
          <div className="flex space-x-4 items-center mb-4">
            <Button size="xl" className="">
              <Link href="/hisseal">
                Hisse Al
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="border-[1.5px] border-black hover:bg-black hover:text-white transition-all duration-300">
              <Link href="/hissesorgula">Hisse Sorgula</Link>
            </Button>
          </div>

        </div>

        {/* Right */}
        <div className="w-1/3 relative aspect-square">
          <Image
            src="/images/main-image.jpg"
            alt="Main Page Image"
            fill
            priority
            className="object-cover rounded-lg"
          />
          <div className="absolute -left-16 -top-8 z-10">
            <Image
              src="/icons/three-lines.svg"
              alt="Decorative Lines"
              width={120}
              height={120}
              className="opacity-80"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Banner;

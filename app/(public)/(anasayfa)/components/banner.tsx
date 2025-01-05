import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react'

const Banner = () => {
  return (
    <div className="container font-heading flex items-center justify-between space-x-24 mb-32">
      {/* Left */}
      <div className="flex flex-col gap-8 font-heading basis-3/5">
        {/* Ana başlık */}
        <div>
          <p className="text-6xl font-heading font-bold mb-2">
            Kurban ibadetini
          </p>
          <p className="text-6xl font-heading font-bold text-primary">
            birlikte gerçekleştirelim.
          </p>
        </div>

        {/* Açıklama */}
        <p className="text-navlinkColor text-2xl tracking-tight leading-relaxed">
          Yılları aşkın tecrübemizle binlerce hissedarı <br />
          bu sene de bir araya getiriyoruz.
        </p>

        {/* Buttons */}
        <div className="flex space-x-4 items-center mb-4">
          <Button size="lg">
            <Link href="/hisseal">
              Hisse Al <i className="bi bi-arrow-right py-auto ml-2"></i>
            </Link>
          </Button>
          <Button variant="dark" size="lg">
            <Link href="/hissesorgula">Hisse Sorgula</Link>
          </Button>
        </div>
      </div>

      {/* Right */}
      {/* <img className="w-4/12" src={Cow1} /> */}
    </div>
  );
}

export default Banner
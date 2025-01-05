import Link from 'next/link';
import React from 'react'

const Banner = () => {
  return (
    <div className="container flex items-center justify-between space-x-24 mb-32">
      {/* Left */}
      <div className="flex flex-col gap-8 font-header basis-3/5">
        {/* Ana başlık */}
        <div>
          <p className="text-6xl font-header font-bold mb-2">
            Kurban ibadetini
          </p>
          <p className="text-6xl font-header font-bold text-sac-primary">
            birlikte gerçekleştirelim.
          </p>
        </div>

        {/* Açıklama */}
        <p className="text-sac-gray text-2xl tracking-tight leading-relaxed">
          Yılları aşkın tecrübemizle binlerce hissedarı <br />
          bu sene de bir araya getiriyoruz.
        </p>

        {/* Buttons */}
        <div className="flex space-x-4 items-center mb-4">
          <Link href="/hisseal">
            <button className="large">
              Hisse Al <i className="bi bi-arrow-right py-auto"></i>
            </button>
          </Link>

          <Link href="/hissesorgula">
            <button className="large white">Hisse Sorgula</button>
          </Link>
        </div>


      </div>

      {/* Right */}
      {/* <img className="w-4/12" src={Cow1} /> */}
    </div>
  );
}

export default Banner
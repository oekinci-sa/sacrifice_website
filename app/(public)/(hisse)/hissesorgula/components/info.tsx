import React from 'react'
import Image from "next/image";


const Info = () => {
  return (
    <div className="grid grid-cols-2 mb-4">
      <div>
        <p className="font-heading text-2xl font-bold text-secondary mb-2">
          Hissedar Bilgileri
        </p>
        <div className="flex gap-8">
          <div className="flex flex-col gap-3 font-bold text-xl min-w-36">
            <p>Ad Soyad</p>
            <p>Cep Telefonu</p>
            <p>Hisse Teslim Yeri</p>
          </div>
          <div className="flex flex-col gap-3 font-medium text-xl min-w-36">
            <p>Ahmet Yılmaz</p>
            <p>0555 555 55 55</p>
            <p>Yenimahalle - Pazar Yeri</p>
          </div>
        </div>
      </div>
      <div>
        <p className="font-heading text-2xl font-bold text-secondary mb-2">
          Kurbanlık Bilgileri
        </p>
        <div className="flex gap-8">
          <div className="flex flex-col gap-3 font-bold text-xl min-w-36">
            <p>Kurban No</p>
            <p>Hisse Bedeli</p>
            <p>Kesim Tarihi</p>
            <p>Hisse Alım Tarihi</p>
          </div>
          <div className="flex flex-col gap-3 font-medium text-xl min-w-36">
            <p>3</p>
            <p>40.000</p>
            <p>07.15</p>
            <p>05.04.2025</p>
          </div>
        </div>
      </div>
      <div>
        <p className="font-heading text-2xl font-bold text-secondary mb-2">
          Ödeme Bilgileri
        </p>
        <div className="flex gap-8">
          <div className="flex flex-col gap-3 font-bold text-xl min-w-36">
            <p>Kapora</p>
            <p>Kalan Ücret</p>
          </div>
          <div className="flex flex-col gap-3 font-medium text-xl min-w-36">
            <p>2000</p>
            <p>38000</p>
          </div>
          <div className="flex flex-col gap-3 font-medium text-xl min-w-36">
            <div className="flex gap-4">
              <Image
                src={`/icons/done.svg`}
                alt="Example SVG"
                width={20}
                height={20} // Genişlik ve yükseklik değerlerini ayarlayın
              />
              <p>Ödeme Yapıldı.</p>
            </div>
            <div className="flex gap-4">
              <Image
                src={`/icons/wait.svg`}
                alt="Example SVG"
                width={20}
                height={20} // Genişlik ve yükseklik değerlerini ayarlayın
              />
              <p>Kalan ödeme bekleniyor.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Info
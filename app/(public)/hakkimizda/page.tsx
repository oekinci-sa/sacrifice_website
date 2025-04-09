'use client';

import React from 'react';

import { MoveRight, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import AnimatedCounter from './components/AnimatedCounter';
import PhotoGallery from './components/PhotoGallery';

const AboutPage = () => {
  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Hakkımızda</h1>

        <div className="mb-12">
          <p className="text-lg mb-6">
            2019 yılından bu yana, kurban organizasyonumuz ile binlerce
            hissedarımıza güvenilir ve şeffaf bir hizmet sunmaktayız. Amacımız,
            kurban ibadetinin İslami usullere uygun şekilde gerçekleştirilmesini
            sağlamak ve bu süreçte hissedarlarımıza en iyi deneyimi yaşatmaktır.
          </p>
          <div className="bg-gray-300 w-full h-64 mb-6"></div>
          <p className="text-lg mb-6">
            Organizasyonumuz, alanında uzman kasaplar ve veterinerler eşliğinde,
            modern kesimhane ortamında gerçekleştirilmektedir. Kurbanlıklarımız,
            dini vecibelere uygunluk açısından titizlikle seçilmekte ve sağlık
            kontrolleri düzenli olarak yapılmaktadır.
          </p>
        </div>

        <AnimatedCounter />

        <div className="mb-12">
          <p className="text-lg mb-6">
            Her yıl büyüyen ailemizle birlikte, kurban organizasyonumuzu daha da
            geliştiriyor ve hizmet kalitemizi artırıyoruz. Hissedarlarımızın
            güveni ve memnuniyeti, bizim için en büyük motivasyon kaynağıdır.
          </p>
        </div>

        <PhotoGallery />
      </div>

      <div className="w-full py-20 lg:py-40 bg-muted mt-12">
        <div className="container mx-auto">
          <div className="flex flex-col text-center py-14 gap-4 items-center">
            <div>
              <Badge>Get started</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
                Try our platform today!
              </h3>
              <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl">
                Managing a small business today is already tough. Avoid further
                complications by ditching outdated, tedious trade methods. Our
                goal is to streamline SMB trade, making it easier and faster
                than ever.
              </p>
            </div>
            <div className="flex flex-row gap-4">
              <Button className="gap-4" variant="outline">
                Jump on a call <PhoneCall className="w-4 h-4" />
              </Button>
              <Button className="gap-4">
                Sign up here <MoveRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 
import React from 'react'

import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Ayah from './Ayah';

const Banner = () => {
  return (
    <>
      <div className="relative h-screen">
        <div className="w-full">
          <div className="container mx-auto">
            <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
              <div className="flex gap-4 flex-col">
                <h1 className="text-5xl font-heading md:text-6xl max-w-4xl text-center font-extrabold">
                  Kurban ibadetini bu sene de{" "}
                  <span>birlikte gerçekleştirelim!</span>
                </h1>
                <Ayah></Ayah>
              </div>
              <div className="flex flex-row gap-3">
                <Link href="/hisseal">
                  <Button size="lg" className="gap-4" variant="outline">
                    Hisse Al <PhoneCall className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/hissesorgula">
                  <Button size="lg" className="gap-4">
                    Hisse Sorgula <MoveRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dark */}
      {/* <div className="relative h-screen hidden dark:block">
        <div className="absolute inset-0">
          <div className="relative h-full w-full bg-slate-950 [&>div]:absolute [&>div]:inset-0 [&>div]:bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e3e,transparent)]">
            <div></div>
          </div>
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
          <div className="max-w-3xl text-center">
            <h1 className="mb-8 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-white">
              Your Next Great
              <span className="text-sky-400">Project</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-300">
              Build modern and beautiful websites with this collection of
              stunning background patterns. Perfect for landing pages, apps, and
              dashboards.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="rounded-lg px-6 py-3 font-medium bg-sky-400 text-slate-900 hover:bg-sky-300">
                Get Started
              </button>
              <button className="rounded-lg border px-6 py-3 font-medium border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div> */}
    </>
  );
}

export default Banner
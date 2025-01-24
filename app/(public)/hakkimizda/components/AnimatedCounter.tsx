'use client';

import React, { useEffect, useRef } from 'react';

interface CounterProps {
  end: number;
  label: string;
}

const Counter = ({ end, label }: CounterProps) => {
  const countRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current && countRef.current) {
            hasAnimated.current = true;
            animateCounter(countRef.current, end);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [end]);

  const animateCounter = (element: HTMLElement, target: number) => {
    const increment = Math.ceil(target / 100);
    let count = 0;

    const timer = setInterval(() => {
      count += increment;
      element.innerText = count.toString();

      if (count >= target) {
        element.innerText = target.toString();
        clearInterval(timer);
      }
    }, 20);
  };

  return (
    <div className="text-center">
      <div className="text-5xl font-extrabold mb-2">
        <span ref={countRef} className="inline-block">0</span>+
      </div>
      <p className="text-lg font-medium text-gray-800">{label}</p>
    </div>
  );
};

const AnimatedCounter = () => {
  return (
    <div className="mb-12 bg-gray-100 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Counter end={5} label="Yıl Tecrübe" />
          <Counter end={600} label="Kurbanlık" />
          <Counter end={5000} label="Hissedar" />
        </div>
      </div>
    </div>
  );
};

export default AnimatedCounter; 
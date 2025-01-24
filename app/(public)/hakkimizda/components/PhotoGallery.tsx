'use client';

import React, { useState, useEffect } from 'react';

const PhotoGallery = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 10; // Total number of slides

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Auto-slide every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Generate array of 10 rectangles
  const rectangles = Array.from({ length: 10 }, (_, index) => index + 1);

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Geçmiş Seneler</h2>
        <div className="flex gap-3">
          <button
            onClick={prevSlide}
            className="flex items-center justify-center w-10 h-10 rounded-full"
            aria-label="Previous slide"
          >
            <i className="bi bi-arrow-left-circle-fill text-2xl"></i>
          </button>
          <button
            onClick={nextSlide}
            className="flex items-center justify-center w-10 h-10 rounded-full"
            aria-label="Next slide"
          >
            <i className="bi bi-arrow-right-circle-fill text-2xl"></i>
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex gap-4 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
          >
            {/* Numbered rectangles */}
            {rectangles.map((number) => (
              <div key={number} className="w-[30%] flex-none first:ml-0 ml-4">
                <div className="bg-gray-300 h-64 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-600">
                    {number}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoGallery; 
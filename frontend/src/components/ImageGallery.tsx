'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Shade } from '@/types/product';

interface ImageGalleryProps {
  images: string[];
  selectedShade?: Shade | null;
}

export default function ImageGallery({ images, selectedShade }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use shade-specific image if available, otherwise use default images
  const displayImages = selectedShade?.image
    ? [selectedShade.image, ...images]
    : images;

  const currentImage = displayImages[currentIndex] || displayImages[0];

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  if (!currentImage) {
    return (
      <div className="aspect-square bg-surface-muted rounded-lg flex items-center justify-center">
        <span className="text-text-subtle">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
        <Image
          src={currentImage}
          alt={`Producto imagen ${currentIndex + 1} de ${displayImages.length}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
          className="object-cover"
          priority
        />

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 touch-target bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 touch-target bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {displayImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0
                ${index === currentIndex ? 'border-primary' : 'border-transparent hover:border-gray-300'}
              `}
              aria-label={`Ver imagen ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
            >
              <Image
                src={img}
                alt={`Miniatura ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

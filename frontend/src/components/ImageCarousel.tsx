import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { Button } from '../ui/button';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  contain?: boolean;
  isCompatibilityMode?: boolean;
}

export function ImageCarousel({ images, alt, className = '', contain = false, isCompatibilityMode = false }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fitClass = contain ? 'object-contain' : 'object-cover';

  if (images.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 ${className}`}>
        No image
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <ImageWithFallback
          src={images[0]}
          alt={alt}
          className={`w-full h-full ${fitClass} ${isCompatibilityMode ? '' : 'transition-opacity duration-300'}`}
        />
      </div>
    );
  }

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={`relative w-full h-full group ${className}`}>
      <ImageWithFallback
        src={images[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1} of ${images.length}`}
        className={`w-full h-full ${fitClass} ${isCompatibilityMode ? '' : 'transition-opacity duration-300'}`}
      />
      
      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        className={`absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/70 hover:bg-slate-900/90 text-slate-100 transition-opacity ${isCompatibilityMode ? 'opacity-100 w-12 h-12' : 'opacity-0 group-hover:opacity-100'}`}
        aria-label="Previous image"
      >
        <ChevronLeft className={`${isCompatibilityMode ? 'w-8 h-8' : 'w-5 h-5'}`} />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className={`absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/70 hover:bg-slate-900/90 text-slate-100 transition-opacity ${isCompatibilityMode ? 'opacity-100 w-12 h-12' : 'opacity-0 group-hover:opacity-100'}`}
        aria-label="Next image"
      >
        <ChevronRight className={`${isCompatibilityMode ? 'w-8 h-8' : 'w-5 h-5'}`} />
      </Button>

      {/* Dots Indicator */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex ${isCompatibilityMode ? 'gap-2' : 'gap-1.5'}`}>
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
            className={`transition-all ${
              index === currentIndex
                ? 'bg-slate-100'
                : 'bg-slate-500 hover:bg-slate-400'
            } ${isCompatibilityMode ? 'h-1.5 w-6 rounded-full' : 'h-1.5 w-1.5 rounded-full'}`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className={`absolute top-2 right-2 bg-slate-900/70 text-slate-100 rounded ${isCompatibilityMode ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-1'}`}>
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}


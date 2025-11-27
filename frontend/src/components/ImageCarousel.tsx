import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Button } from '../ui/button';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageCarousel({ images, alt, className = '' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

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
          className="w-full h-full object-cover"
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
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      
      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900/70 text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900/70 text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Next image"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-6 bg-slate-100'
                : 'w-2 bg-slate-500 hover:bg-slate-400'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-2 right-2 bg-slate-900/70 text-slate-100 text-xs px-2 py-1 rounded">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}


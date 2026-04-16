import { memo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGridProps {
  images: string[];
  onRemove: (index: number) => void;
  /** Height class for images - defaults to h-24 */
  imageHeight?: string;
  /** Number of columns on mobile */
  mobileColumns?: 2 | 3;
}

/**
 * Single optimized image with lazy loading and fade-in
 */
const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  onClick,
}: {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Skip IO for base64 images (already in memory)
    if (src.startsWith("data:")) {
      setIsInView(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [src]);

  const handleLoad = useCallback(() => {
    const img = imgRef.current;
    if (img && "decode" in img) {
      img.decode().then(() => setIsLoaded(true)).catch(() => setIsLoaded(true));
    } else {
      setIsLoaded(true);
    }
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <div className={cn("absolute inset-0 bg-muted animate-pulse", className)} />
      )}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        data-src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onClick={onClick}
        className={cn(
          className,
          "transition-opacity duration-300",
          !isLoaded && "opacity-0",
          isLoaded && "opacity-100"
        )}
      />
    </div>
  );
});

/**
 * Lightbox overlay — shows one image at full/natural size with prev/next navigation
 */
const Lightbox = memo(function Lightbox({
  images,
  index,
  onClose,
  onNav,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onNav: (next: number) => void;
}) {
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNav(index - 1);
      if (e.key === "ArrowRight" && hasNext) onNav(index + 1);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, onNav, index, hasPrev, hasNext]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-sm bg-background/80 border border-primary/30 text-foreground hover:text-primary hover:border-primary transition-colors"
        aria-label="Close preview"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNav(index - 1); }}
          className="absolute left-4 p-2 rounded-sm bg-background/80 border border-primary/30 text-foreground hover:text-primary hover:border-primary transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[index]}
        alt={`Preview ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-sm border border-primary/20 shadow-2xl shadow-primary/10"
        style={{ imageRendering: "auto" }}
      />

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNav(index + 1); }}
          className="absolute right-4 p-2 rounded-sm bg-background/80 border border-primary/30 text-foreground hover:text-primary hover:border-primary transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono text-muted-foreground bg-background/70 px-3 py-1 rounded-sm border border-primary/20">
          {index + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body
  );
});

/**
 * Shared ImageGrid component for displaying attached images with remove functionality.
 * Uses lazy loading and intersection observer for optimal Core Web Vitals.
 * Clicking a thumbnail opens a full-size lightbox preview.
 */
export const ImageGrid = memo(function ImageGrid({
  images,
  onRemove,
  imageHeight = "h-24",
  mobileColumns = 2,
}: ImageGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className={cn(
        "grid gap-2",
        mobileColumns === 2 ? "grid-cols-2" : "grid-cols-3",
        "md:grid-cols-3"
      )}>
        {images.map((img, index) => (
          <div key={index} className="relative group">
            <LazyImage
              src={img}
              alt={`Attached ${index + 1}`}
              className={cn(
                "w-full object-cover rounded-sm border border-border cursor-pointer hover:border-primary/50 transition-colors",
                imageHeight,
              )}
              onClick={() => setLightboxIndex(index)}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Remove image ${index + 1}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </>
  );
});

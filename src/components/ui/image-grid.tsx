import { memo, useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGridProps {
  images: string[];
  onRemove: (index: number) => void;
  /** Height class for images - defaults to h-24 */
  imageHeight?: string;
  /** Whether clicking opens image in new tab */
  clickToOpen?: boolean;
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
 * Shared ImageGrid component for displaying attached images with remove functionality.
 * Uses lazy loading and intersection observer for optimal Core Web Vitals.
 */
export const ImageGrid = memo(function ImageGrid({
  images,
  onRemove,
  imageHeight = "h-24",
  clickToOpen = false,
  mobileColumns = 2,
}: ImageGridProps) {
  if (images.length === 0) return null;

  return (
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
              "w-full object-cover rounded-sm border border-border",
              imageHeight,
              clickToOpen && "cursor-pointer hover:border-primary/50"
            )}
            onClick={clickToOpen ? () => window.open(img, "_blank") : undefined}
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
  );
});

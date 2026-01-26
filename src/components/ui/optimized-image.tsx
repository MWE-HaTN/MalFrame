import { memo, useState, useRef, useEffect, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> {
  /** Blur placeholder while loading */
  showBlurPlaceholder?: boolean;
  /** Fade in animation duration in ms */
  fadeInDuration?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection observer */
  threshold?: number;
}

/**
 * Optimized image component with:
 * - Native lazy loading
 * - Intersection Observer for above-the-fold detection
 * - Smooth fade-in animation
 * - Optional blur placeholder
 * - Decode async for non-blocking rendering
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  showBlurPlaceholder = true,
  fadeInDuration = 300,
  rootMargin = "50px",
  threshold = 0.1,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Use Intersection Observer for more precise lazy loading
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Check if IntersectionObserver is available
    if (!("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const handleLoad = () => {
    // Use decode() for non-blocking rendering when available
    if (imgRef.current && "decode" in imgRef.current) {
      imgRef.current
        .decode()
        .then(() => setIsLoaded(true))
        .catch(() => setIsLoaded(true)); // Fallback if decode fails
    } else {
      setIsLoaded(true);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder */}
      {showBlurPlaceholder && !isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        data-src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity",
          !isLoaded && "opacity-0",
          isLoaded && "opacity-100"
        )}
        style={{
          ...style,
          transitionDuration: `${fadeInDuration}ms`,
        }}
        {...props}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs">
          Failed to load
        </div>
      )}
    </div>
  );
});

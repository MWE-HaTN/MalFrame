import { cn } from "@/lib/utils";
import { ShimmerBar } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

interface SectionSkeletonProps {
  variant?: "default" | "form" | "table" | "list";
  rows?: number;
  className?: string;
}

export function SectionSkeleton({
  variant = "default",
  rows = 3,
  className
}: SectionSkeletonProps) {
  const { t } = useLanguage();
  if (variant === "form") {
    return (
      <div className={cn("space-y-4", className)} role="status" aria-busy="true" aria-label={t("aria.loadingContent")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: rows * 2 }).map((_, i) => (
            <div 
              key={i} 
              className="space-y-2"
            >
              <ShimmerBar className="h-4 w-20" style={{ animationDelay: `${i * 100}ms` }} />
              <ShimmerBar className="h-9 w-full" style={{ animationDelay: `${i * 100 + 50}ms` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-2", className)} role="status" aria-busy="true" aria-label={t("aria.loadingContent")}>
        <div className="flex gap-4 pb-2 border-b border-border/30">
          <ShimmerBar className="h-4 w-1/4" />
          <ShimmerBar className="h-4 w-1/4" style={{ animationDelay: "100ms" }} />
          <ShimmerBar className="h-4 w-1/4" style={{ animationDelay: "200ms" }} />
          <ShimmerBar className="h-4 w-1/4" style={{ animationDelay: "300ms" }} />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div 
            key={i} 
            className="flex gap-4 py-2"
          >
            <ShimmerBar className="h-5 w-1/4" style={{ animationDelay: `${i * 150}ms` }} />
            <ShimmerBar className="h-5 w-1/4" style={{ animationDelay: `${i * 150 + 50}ms` }} />
            <ShimmerBar className="h-5 w-1/4" style={{ animationDelay: `${i * 150 + 100}ms` }} />
            <ShimmerBar className="h-5 w-1/4" style={{ animationDelay: `${i * 150 + 150}ms` }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-3", className)} role="status" aria-busy="true" aria-label={t("aria.loadingContent")}>
        {Array.from({ length: rows }).map((_, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 p-3 rounded-md border border-border/30"
          >
            <ShimmerBar className="h-5 w-5 rounded" style={{ animationDelay: `${i * 150}ms` }} />
            <div className="flex-1 space-y-2">
              <ShimmerBar className="h-4 w-3/4" style={{ animationDelay: `${i * 150 + 50}ms` }} />
              <ShimmerBar className="h-3 w-1/2" style={{ animationDelay: `${i * 150 + 100}ms` }} />
            </div>
            <ShimmerBar className="h-4 w-4" style={{ animationDelay: `${i * 150 + 150}ms` }} />
          </div>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("space-y-3", className)} role="status" aria-busy="true" aria-label={t("aria.loadingContent")}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="space-y-2"
        >
          <ShimmerBar className="h-4 w-full" style={{ animationDelay: `${i * 150}ms` }} />
          <ShimmerBar className="h-4 w-5/6" style={{ animationDelay: `${i * 150 + 75}ms` }} />
        </div>
      ))}
    </div>
  );
}

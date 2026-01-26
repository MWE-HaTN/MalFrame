import { cn } from "@/lib/utils";
import React from "react";

// ============================================
// Base Skeleton Component
// ============================================

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md skeleton-shimmer", className)} {...props} />;
}

// ============================================
// ShimmerBar Component (reusable shimmer effect)
// ============================================

interface ShimmerBarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function ShimmerBar({ className, style, ...props }: ShimmerBarProps) {
  return <div className={cn("rounded skeleton-shimmer", className)} style={style} {...props} />;
}

// ============================================
// SubSectionSkeleton - For list/form loading states
// ============================================

interface SubSectionSkeletonProps {
  rows?: number;
  variant?: "default" | "entries" | "list";
}

function SubSectionSkeleton({ rows = 2, variant = "entries" }: SubSectionSkeletonProps) {
  if (variant === "list") {
    return (
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <ShimmerBar className="h-4 w-4 rounded" style={{ animationDelay: `${i * 150}ms` }} />
            <ShimmerBar className="h-4 flex-1" style={{ animationDelay: `${i * 150 + 75}ms` }} />
          </div>
        ))}
      </div>
    );
  }

  // Default "entries" variant - form-like skeleton
  return (
    <div className="space-y-3 pt-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 rounded-sm border border-border/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <ShimmerBar className="h-3 w-16" style={{ animationDelay: `${i * 200}ms` }} />
              <ShimmerBar className="h-9 w-full" style={{ animationDelay: `${i * 200 + 50}ms` }} />
            </div>
            <div className="space-y-1.5">
              <ShimmerBar className="h-3 w-20" style={{ animationDelay: `${i * 200 + 100}ms` }} />
              <ShimmerBar className="h-9 w-full" style={{ animationDelay: `${i * 200 + 150}ms` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// AnimatedCollapse - Smooth expand/collapse with optional skeleton
// ============================================

interface AnimatedCollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  showSkeleton?: boolean;
  skeletonRows?: number;
  skeletonVariant?: "default" | "entries" | "list";
}

function AnimatedCollapse({ 
  isOpen, 
  children, 
  className,
  showSkeleton = false,
  skeletonRows = 2,
  skeletonVariant = "entries"
}: AnimatedCollapseProps) {
  return (
    <div className={cn(
      "grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
    )}>
      <div className="overflow-hidden">
        <div className={cn(
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
          className
        )}>
          {showSkeleton ? (
            <SubSectionSkeleton rows={skeletonRows} variant={skeletonVariant} />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  ShimmerBar, 
  AnimatedCollapse,
  type ShimmerBarProps,
  type AnimatedCollapseProps
};

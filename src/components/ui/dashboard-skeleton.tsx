import { cn } from "@/lib/utils";
import { ShimmerBar } from "@/components/ui/skeleton";

interface DashboardSkeletonProps {
  className?: string;
}

// Header skeleton with logo and nav
function HeaderSkeleton() {
  return (
    <div className="h-14 border-b border-border/30 bg-card/50 backdrop-blur-sm px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ShimmerBar className="w-8 h-8 rounded-md" />
        <ShimmerBar className="w-32 h-4" />
      </div>
      <div className="flex items-center gap-4">
        <ShimmerBar className="w-16 h-4" />
        <ShimmerBar className="w-16 h-4" />
        <ShimmerBar className="w-16 h-4" />
        <ShimmerBar className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}

// Section card skeleton
function SectionSkeleton({ title = true, rows = 3 }: { title?: boolean; rows?: number }) {
  return (
    <div className="border border-border/30 rounded-lg bg-card/30 p-4 space-y-4">
      {title && (
        <div className="flex items-center gap-2 pb-2 border-b border-border/20">
          <ShimmerBar className="w-5 h-5 rounded" />
          <ShimmerBar className="w-40 h-5" />
          <div className="flex-1" />
          <ShimmerBar className="w-6 h-6 rounded" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <ShimmerBar className="w-20 h-3" />
              <ShimmerBar className="w-full h-9" />
            </div>
            <div className="space-y-2">
              <ShimmerBar className="w-24 h-3" />
              <ShimmerBar className="w-full h-9" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Table skeleton
function TableSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-border/30 rounded-lg bg-card/30 p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border/20">
        <ShimmerBar className="w-5 h-5 rounded" />
        <ShimmerBar className="w-32 h-5" />
      </div>
      {/* Table header */}
      <div className="flex gap-4 pb-2 border-b border-border/20">
        {Array.from({ length: cols }).map((_, i) => (
          <ShimmerBar key={i} className="flex-1 h-4" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <ShimmerBar key={colIdx} className="flex-1 h-5" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Action bar skeleton
function ActionBarSkeleton() {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <ShimmerBar className="w-6 h-6 rounded" />
        <ShimmerBar className="w-48 h-7" />
      </div>
      <div className="flex items-center gap-2">
        <ShimmerBar className="w-24 h-9 rounded-md" />
        <ShimmerBar className="w-24 h-9 rounded-md" />
        <ShimmerBar className="w-32 h-9 rounded-md" />
      </div>
    </div>
  );
}

// Dropzone skeleton
function DropzoneSkeleton() {
  return (
    <div className="border-2 border-dashed border-border/40 rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-card/20">
      <ShimmerBar className="w-12 h-12 rounded-lg" />
      <ShimmerBar className="w-48 h-4" />
      <ShimmerBar className="w-32 h-3" />
    </div>
  );
}

// Main dashboard skeleton
export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("min-h-screen bg-background cyber-grid flex flex-col", className)}>
      <HeaderSkeleton />
      
      <main className="container max-w-7xl mx-auto py-6 space-y-4 flex-1 px-4">
        {/* Page title & actions */}
        <ActionBarSkeleton />
        
        {/* Dropzone */}
        <DropzoneSkeleton />
        
        {/* Main sections */}
        <div className="space-y-4">
          <SectionSkeleton title rows={3} />
          <SectionSkeleton title rows={2} />
          <TableSkeleton rows={3} cols={4} />
          <SectionSkeleton title rows={2} />
        </div>
      </main>
    </div>
  );
}

// Compact loading for route transitions (faster feel)
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background cyber-grid">
      <HeaderSkeleton />
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <ActionBarSkeleton />
        <div className="mt-6 space-y-4">
          <SectionSkeleton title rows={2} />
          <SectionSkeleton title rows={2} />
        </div>
      </div>
    </div>
  );
}



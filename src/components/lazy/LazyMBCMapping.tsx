import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load MBCMapping component - reduces initial bundle by ~40KB
const MBCMappingComponent = lazy(() => 
  import("@/components/MBCMapping").then(m => ({ default: m.MBCMapping }))
);

// Re-export props type from the lazy component
type MBCMappingProps = ComponentProps<typeof MBCMappingComponent>;

export const LazyMBCMapping = memo(function LazyMBCMapping(props: MBCMappingProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="table" rows={5} />}>
      <MBCMappingComponent {...props} />
    </Suspense>
  );
});

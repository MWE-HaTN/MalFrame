import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load MitreAttackMapping component - reduces initial bundle by ~50KB
const MitreAttackMappingComponent = lazy(() => 
  import("@/components/MitreAttackMapping").then(m => ({ default: m.MitreAttackMapping }))
);

// Re-export props type from the lazy component
type MitreAttackMappingProps = ComponentProps<typeof MitreAttackMappingComponent>;

export const LazyMitreAttackMapping = memo(function LazyMitreAttackMapping(props: MitreAttackMappingProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="table" rows={5} />}>
      <MitreAttackMappingComponent {...props} />
    </Suspense>
  );
});

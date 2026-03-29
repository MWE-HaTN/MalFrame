import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load RuntimeBehavior component - reduces initial bundle by ~30KB
const RuntimeBehaviorComponent = lazy(() => 
  import("@/features/mre/components/runtime-behavior/RuntimeBehavior").then(m => ({ default: m.RuntimeBehavior }))
);

// Re-export props type from the lazy component
type RuntimeBehaviorProps = ComponentProps<typeof RuntimeBehaviorComponent>;

export const LazyRuntimeBehavior = memo(function LazyRuntimeBehavior(props: RuntimeBehaviorProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="form" rows={6} />}>
      <RuntimeBehaviorComponent {...props} />
    </Suspense>
  );
});

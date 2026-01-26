import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load UnpackingLayers - includes AlertDialog (~15KB)
const UnpackingLayersComponent = lazy(() => 
  import("@/components/UnpackingLayers").then(m => ({ default: m.UnpackingLayers }))
);

type UnpackingLayersProps = ComponentProps<typeof UnpackingLayersComponent>;

export const LazyUnpackingLayers = memo(function LazyUnpackingLayers(props: UnpackingLayersProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="form" rows={2} />}>
      <UnpackingLayersComponent {...props} />
    </Suspense>
  );
});

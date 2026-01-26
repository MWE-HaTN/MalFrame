import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load EvidenceArtifacts - includes dropdown menu components (~20KB)
const EvidenceArtifactsComponent = lazy(() => 
  import("@/components/EvidenceArtifacts").then(m => ({ default: m.EvidenceArtifacts }))
);

type EvidenceArtifactsProps = ComponentProps<typeof EvidenceArtifactsComponent>;

export const LazyEvidenceArtifacts = memo(function LazyEvidenceArtifacts(props: EvidenceArtifactsProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="table" rows={3} />}>
      <EvidenceArtifactsComponent {...props} />
    </Suspense>
  );
});

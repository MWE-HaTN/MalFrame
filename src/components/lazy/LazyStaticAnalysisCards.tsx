import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load StaticAnalysisCards - includes FileInfoField (~8KB)
const StaticAnalysisCardsComponent = lazy(() => 
  import("@/components/StaticAnalysisCards").then(m => ({ default: m.StaticAnalysisCards }))
);

type StaticAnalysisCardsProps = ComponentProps<typeof StaticAnalysisCardsComponent>;

export const LazyStaticAnalysisCards = memo(function LazyStaticAnalysisCards(props: StaticAnalysisCardsProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="form" rows={6} />}>
      <StaticAnalysisCardsComponent {...props} />
    </Suspense>
  );
});

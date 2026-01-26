import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load CodeAnalysisGroups component - reduces initial bundle by ~40KB
const CodeAnalysisGroupsComponent = lazy(() => 
  import("@/components/CodeAnalysisGroups").then(m => ({ default: m.CodeAnalysisGroups }))
);

// Re-export props type from the lazy component
type CodeAnalysisGroupsProps = ComponentProps<typeof CodeAnalysisGroupsComponent>;

export const LazyCodeAnalysisGroups = memo(function LazyCodeAnalysisGroups(props: CodeAnalysisGroupsProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="form" rows={8} />}>
      <CodeAnalysisGroupsComponent {...props} />
    </Suspense>
  );
});

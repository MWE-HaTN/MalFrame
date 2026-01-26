import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load PESectionEntry - includes AlertDialog (~12KB)
const PESectionEntryComponent = lazy(() => 
  import("@/components/PESectionEntry").then(m => ({ default: m.PESectionEntry }))
);

type PESectionEntryProps = ComponentProps<typeof PESectionEntryComponent>;

export const LazyPESectionEntry = memo(function LazyPESectionEntry(props: PESectionEntryProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="table" rows={2} />}>
      <PESectionEntryComponent {...props} />
    </Suspense>
  );
});

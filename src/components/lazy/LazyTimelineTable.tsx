import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load TimelineTable - includes @tanstack/react-virtual (~15KB)
const TimelineTableComponent = lazy(() => 
  import("@/components/TimelineTable").then(m => ({ default: m.TimelineTable }))
);

type TimelineTableProps = ComponentProps<typeof TimelineTableComponent>;

export const LazyTimelineTable = memo(function LazyTimelineTable(props: TimelineTableProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="table" rows={3} />}>
      <TimelineTableComponent {...props} />
    </Suspense>
  );
});

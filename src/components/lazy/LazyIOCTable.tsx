import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load IOCTable - includes @tanstack/react-virtual (~15KB)
const IOCTableComponent = lazy(() => 
  import("@/features/mia/components/IOCTable").then(m => ({ default: m.IOCTable }))
);

type IOCTableProps = ComponentProps<typeof IOCTableComponent>;

export const LazyIOCTable = memo(function LazyIOCTable(props: IOCTableProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="table" rows={3} />}>
      <IOCTableComponent {...props} />
    </Suspense>
  );
});

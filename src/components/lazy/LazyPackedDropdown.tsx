import { lazy, Suspense, memo, ComponentProps } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load PackedDropdown - includes Select, UnpackingLayers (~18KB)
const PackedDropdownComponent = lazy(() => 
  import("@/features/mre/components/PackedDropdown").then(m => ({ default: m.PackedDropdown }))
);

type PackedDropdownProps = ComponentProps<typeof PackedDropdownComponent>;

const DropdownSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export const LazyPackedDropdown = memo(function LazyPackedDropdown(props: PackedDropdownProps) {
  return (
    <Suspense fallback={<DropdownSkeleton />}>
      <PackedDropdownComponent {...props} />
    </Suspense>
  );
});

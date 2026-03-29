import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load SecurityPosture - includes Select, Tooltip (~15KB)
const SecurityPostureComponent = lazy(() => 
  import("@/features/mre/components/SecurityPosture").then(m => ({ default: m.SecurityPosture }))
);

type SecurityPostureProps = ComponentProps<typeof SecurityPostureComponent>;

export const LazySecurityPosture = memo(function LazySecurityPosture(props: SecurityPostureProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="form" rows={2} />}>
      <SecurityPostureComponent {...props} />
    </Suspense>
  );
});

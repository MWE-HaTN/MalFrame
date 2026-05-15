import { lazy, Suspense } from "react";
import type { GraphData } from "@/lib/graphBuilders";

const GraphView = lazy(() =>
  import("@/components/GraphView").then((m) => ({
    default: m.GraphView,
  }))
);

interface LazyGraphViewProps {
  data: GraphData;
  className?: string;
}

export function LazyGraphView(props: LazyGraphViewProps) {
  return (
    <Suspense
      fallback={
        <div className="h-[400px] border border-border rounded-md flex items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading graph...
          </div>
        </div>
      }
    >
      <GraphView {...props} />
    </Suspense>
  );
}

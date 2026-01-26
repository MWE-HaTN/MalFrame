import { lazy, Suspense, memo, ComponentProps } from "react";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

// Lazy load NotesLog - includes ImageGrid and complex form handling
const NotesLogComponent = lazy(() => 
  import("@/components/NotesLog").then(m => ({ default: m.NotesLog }))
);

type NotesLogProps = ComponentProps<typeof NotesLogComponent>;

export const LazyNotesLog = memo(function LazyNotesLog(props: NotesLogProps) {
  return (
    <Suspense fallback={<SectionSkeleton variant="form" rows={3} />}>
      <NotesLogComponent {...props} />
    </Suspense>
  );
});

import { lazy, Suspense, memo, ComponentProps } from "react";

// Lazy load ExportConfirmDialog - includes Dialog, Checkbox (~15KB)
const ExportConfirmDialogComponent = lazy(() => 
  import("@/components/ExportConfirmDialog").then(m => ({ default: m.ExportConfirmDialog }))
);

type ExportConfirmDialogProps = ComponentProps<typeof ExportConfirmDialogComponent>;

export const LazyExportConfirmDialog = memo(function LazyExportConfirmDialog(props: ExportConfirmDialogProps) {
  // Don't render suspense fallback for dialogs - they're not visible when closed
  if (!props.open) return null;
  
  return (
    <Suspense fallback={null}>
      <ExportConfirmDialogComponent {...props} />
    </Suspense>
  );
});

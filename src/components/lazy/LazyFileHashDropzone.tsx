import { lazy, Suspense, memo, ComponentProps } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load FileHashDropzone - includes Progress component (~10KB)
const FileHashDropzoneComponent = lazy(() => 
  import("@/components/FileHashDropzone").then(m => ({ default: m.FileHashDropzone }))
);

type FileHashDropzoneProps = ComponentProps<typeof FileHashDropzoneComponent>;

const DropzoneSkeleton = () => (
  <div className="dropzone flex flex-col items-center gap-3">
    <Skeleton className="w-14 h-14 rounded-full" />
    <div className="text-center space-y-2">
      <Skeleton className="h-4 w-48 mx-auto" />
      <Skeleton className="h-3 w-32 mx-auto" />
    </div>
  </div>
);

export const LazyFileHashDropzone = memo(function LazyFileHashDropzone(props: FileHashDropzoneProps) {
  return (
    <Suspense fallback={<DropzoneSkeleton />}>
      <FileHashDropzoneComponent {...props} />
    </Suspense>
  );
});

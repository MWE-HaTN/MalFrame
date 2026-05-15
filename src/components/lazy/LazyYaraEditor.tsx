import { lazy, Suspense } from "react";

const YaraEditor = lazy(() =>
  import("@/features/mre/components/YaraEditor").then((m) => ({
    default: m.YaraEditor,
  }))
);

interface LazyYaraEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function LazyYaraEditor(props: LazyYaraEditorProps) {
  return (
    <Suspense
      fallback={
        <div className="border border-border rounded-md p-4 min-h-[200px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading editor...
          </div>
        </div>
      }
    >
      <YaraEditor {...props} />
    </Suspense>
  );
}

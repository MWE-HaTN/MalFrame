import { ReactNode, useRef, useEffect, useState } from "react";
import { Download, Upload, ChevronDown, File, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClearDataDialog } from "@/components/ClearDataDialog";

export interface ExportOption {
  type: "json" | "pdf" | "word";
  label: string;
  onClick: () => void;
}

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onImport: () => void;
  onClear: () => void;
  exportOptions: ExportOption[];
  importLabel?: string;
  exportLabel?: string;
}

export function DashboardHeader({
  title,
  subtitle,
  onImport,
  onClear,
  exportOptions,
  importLabel = "Import JSON",
  exportLabel = "Export Data",
}: DashboardHeaderProps) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: ExportOption["type"]) => {
    switch (type) {
      case "json":
        return <File className="w-4 h-4 text-muted-foreground" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-destructive" />;
      case "word":
        return <FileText className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="text-left">
        <h1 className="text-2xl font-bold text-primary text-glow font-terminal tracking-wider flex items-center gap-2">
          <span className="text-accent">※</span> {title}
        </h1>
        <p className="text-sm text-muted-foreground font-mono">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {/* Import Button */}
        <button
          onClick={onImport}
          className="flex items-center gap-2 px-4 py-2 rounded-sm font-terminal text-sm uppercase tracking-wide bg-accent text-accent-foreground hover:brightness-110 transition-all"
        >
          <Upload className="w-4 h-4" />
          {importLabel}
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-sm font-terminal text-sm uppercase tracking-wide bg-success text-success-foreground hover:brightness-110 transition-all"
          >
            <Download className="w-4 h-4" />
            {exportLabel}
            <ChevronDown className={cn("w-4 h-4 transition-transform", exportMenuOpen && "rotate-180")} />
          </button>

          {exportMenuOpen && (
            <div className="absolute right-0 z-[100] mt-1 w-44 bg-background border border-border rounded-sm shadow-lg shadow-black/50 animate-fade-in">
              {exportOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => {
                    option.onClick();
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-mono hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  {getIcon(option.type)}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Data Button */}
        <ClearDataDialog onConfirm={onClear} />
      </div>
    </div>
  );
}

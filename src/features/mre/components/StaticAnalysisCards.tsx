import { memo } from "react";
import { FileInfoField } from "./FileInfoField";
import { FileText, Cpu } from "lucide-react";

interface StaticAnalysisData {
  sha256: string;
  impHash: string;
  fileType: string;
  fileSize: string;
  compileTime: string;
  fileEntropy: string;
  entryPoint: string;
  imageBase: string;
  architecture: string;
  numberOfSections: string;
  characteristics: string;
  subsystem: string;
}

interface StaticAnalysisCardsProps {
  data: StaticAnalysisData;
  onChange: (patch: Partial<StaticAnalysisData>) => void;
}

export const StaticAnalysisCards = memo(function StaticAnalysisCards({
  data,
  onChange,
}: StaticAnalysisCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
      {/* BASIC FILE INFO */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Basic File Info
          </span>
        </div>
        <div className="border border-border rounded-md bg-card/30 p-4">
          <FileInfoField
            label="SHA256"
            value={data.sha256}
            onChange={(v) => onChange({ sha256: v })}
            placeholder="64 character hash..."
          />
          <FileInfoField
            label="ImpHash"
            value={data.impHash}
            onChange={(v) => onChange({ impHash: v })}
            placeholder="Import hash..."
          />
          <FileInfoField
            label="File Type"
            value={data.fileType}
            onChange={(v) => onChange({ fileType: v })}
            placeholder="Windows EXE"
          />
          <FileInfoField
            label="File Size"
            value={data.fileSize}
            onChange={(v) => onChange({ fileSize: v })}
            placeholder="370 KB"
          />
          <FileInfoField
            label="Compile Time"
            value={data.compileTime}
            onChange={(v) => onChange({ compileTime: v })}
            placeholder="2023-01-15 14:30:00 UTC"
          />
          <FileInfoField
            label="Overall Entropy"
            value={data.fileEntropy}
            onChange={(v) => onChange({ fileEntropy: v })}
            placeholder="7.2"
          />
        </div>
      </div>

      {/* PORTABLE EXECUTABLE INFO */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Portable Executable Info
          </span>
        </div>
        <div className="border border-border rounded-md bg-card/30 p-4">
          <FileInfoField
            label="Entry Point"
            value={data.entryPoint}
            onChange={(v) => onChange({ entryPoint: v })}
            placeholder="0x000270c"
          />
          <FileInfoField
            label="Image Base"
            value={data.imageBase}
            onChange={(v) => onChange({ imageBase: v })}
            placeholder="0x0040000"
          />
          <FileInfoField
            label="Architecture"
            value={data.architecture}
            onChange={(v) => onChange({ architecture: v })}
            placeholder="32-bit / 64-bit"
          />
          <FileInfoField
            label="Num of Sections"
            value={data.numberOfSections}
            onChange={(v) => onChange({ numberOfSections: v })}
            placeholder="5"
          />
          <FileInfoField
            label="Characteristics"
            value={data.characteristics}
            onChange={(v) => onChange({ characteristics: v })}
            placeholder="EXECUTABLE_IMAGE, LARGE_ADDRESS_AWARE"
          />
          <FileInfoField
            label="Subsystem"
            value={data.subsystem}
            onChange={(v) => onChange({ subsystem: v })}
            placeholder="GUI"
          />
        </div>
      </div>
    </div>
  );
});

import { memo } from "react";
import { Cpu } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { LazyNotesLog } from "@/components/lazy";
import { useLanguage } from "@/contexts/LanguageContext";
import type { StaticAnalysisData } from "@/types/mia";

interface StaticAnalysisSectionProps {
  data: StaticAnalysisData;
  onChange: (data: StaticAnalysisData) => void;
  forceCloseCounter: number;
}

export const StaticAnalysisSection = memo(function StaticAnalysisSection({
  data,
  onChange,
  forceCloseCounter,
}: StaticAnalysisSectionProps) {
  const { t } = useLanguage();

  return (
    <CollapsibleSection
      title={t("mia.staticAnalysis")}
      icon={<Cpu className="w-4 h-4" />}
      storageKey="dfir-static-analysis"
      forceClose={forceCloseCounter}
      lazy
      skeletonVariant="form"
      skeletonRows={4}
    >
      {/* Row 1: PE Sections / Entropy - Multi-entry grid (max 4 per row) */}
      <div className="space-y-2 mb-4">
        <label className="label-cyber block">{t("mia.peSections")}</label>
        <LazyNotesLog
          entries={data.peSectionsEntropyLog || []}
          onEntriesChange={(entries) =>
            onChange({ ...data, peSectionsEntropyLog: entries })
          }
          placeholder={t("mia.placeholder.peSections")}
          maxEntriesPerRow={4}
          allowImages={false}
        />
      </div>

      {/* Row 2: Interesting Strings | Imports/Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <FormField
          label={t("mia.strings")}
          type="textarea"
          rows={3}
          value={data.strings}
          onChange={(v) => onChange({ ...data, strings: v })}
          placeholder={t("mia.placeholder.strings")}
        />
        <FormField
          label={t("mia.imports")}
          type="textarea"
          rows={3}
          value={data.importsExports}
          onChange={(v) => onChange({ ...data, importsExports: v })}
          placeholder={t("mia.placeholder.imports")}
        />
      </div>

      {/* Row 3: Embedded URLs | Suspicious Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          label={t("mia.embeddedUrls")}
          type="textarea"
          rows={3}
          value={data.embeddedUrls}
          onChange={(v) => onChange({ ...data, embeddedUrls: v })}
          placeholder={t("mia.placeholder.embeddedUrls")}
        />
        <FormField
          label={t("mia.metadata")}
          type="textarea"
          rows={3}
          value={data.suspiciousMetadata}
          onChange={(v) => onChange({ ...data, suspiciousMetadata: v })}
          placeholder={t("mia.placeholder.metadata")}
        />
      </div>
    </CollapsibleSection>
  );
});

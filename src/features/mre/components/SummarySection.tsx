/**
 * Summary Section component for MRE Dashboard
 */

import { memo } from "react";
import { FileText } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useLanguage } from "@/hooks/useLanguage";
import type { SummaryData } from "@/features/mre/types";

interface SummarySectionProps {
  data: SummaryData;
  onChange: (data: SummaryData) => void;
  forceCloseCounter: number;
}

export const SummarySection = memo(function SummarySection({
  data,
  onChange,
  forceCloseCounter,
}: SummarySectionProps) {
  const { t } = useLanguage();

  const updateField = <K extends keyof SummaryData>(
    field: K,
    value: SummaryData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <CollapsibleSection
      title={t("mre.summary")}
      icon={<FileText className="w-4 h-4" />}
      storageKey="re-summary"
      forceClose={forceCloseCounter}
      lazy
      skeletonVariant="form"
      skeletonRows={4}
      hint={t("hint.mre.summary")}
    >
      <div className="space-y-4">
        <FormField
          label={t("mre.malwareFamily")}
          value={data?.malwareFamily || ""}
          onChange={(v) => updateField("malwareFamily", v)}
        />
        <FormField
          label={t("mre.keyFunctionality")}
          type="textarea"
          rows={2}
          value={data?.keyFunctionality || ""}
          onChange={(v) => updateField("keyFunctionality", v)}
        />
        <FormField
          label={t("mre.purpose")}
          type="textarea"
          rows={2}
          value={data?.purpose || ""}
          onChange={(v) => updateField("purpose", v)}
        />
        <FormField
          label={t("mre.persistence")}
          type="textarea"
          rows={2}
          value={data?.persistence || ""}
          onChange={(v) => updateField("persistence", v)}
        />
        <FormField
          label={t("mre.environmentImpact")}
          type="textarea"
          rows={2}
          value={data?.environmentImpact || ""}
          onChange={(v) => updateField("environmentImpact", v)}
        />
        <FormField
          label={t("mre.rootCause")}
          type="textarea"
          rows={2}
          value={data?.rootCause || ""}
          onChange={(v) => updateField("rootCause", v)}
        />
        <FormField
          label={t("mre.attribution")}
          type="textarea"
          rows={2}
          value={data?.attribution || ""}
          onChange={(v) => updateField("attribution", v)}
        />
        <FormField
          label={t("mre.note")}
          type="textarea"
          rows={3}
          value={data?.note || ""}
          onChange={(v) => updateField("note", v)}
        />
      </div>
    </CollapsibleSection>
  );
});


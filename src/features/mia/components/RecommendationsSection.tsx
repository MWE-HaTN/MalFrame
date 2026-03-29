/**
 * Recommendations Section component for MIA Dashboard
 */

import { memo } from "react";
import { Shield } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useLanguage } from "@/hooks/useLanguage";
import type { RecommendationsData } from "@/features/mia/types";

interface RecommendationsSectionProps {
  data: RecommendationsData;
  onChange: (data: RecommendationsData) => void;
  forceCloseCounter: number;
}

export const RecommendationsSection = memo(function RecommendationsSection({
  data,
  onChange,
  forceCloseCounter,
}: RecommendationsSectionProps) {
  const { t } = useLanguage();

  const updateField = <K extends keyof RecommendationsData>(
    field: K,
    value: RecommendationsData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <CollapsibleSection
      title={t("mia.recommendations")}
      icon={<Shield className="w-4 h-4" />}
      storageKey="dfir-recommendations"
      forceClose={forceCloseCounter}
      hint={t("hint.mia.recommendations")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          label={t("mia.shortTerm")}
          type="textarea"
          rows={6}
          value={data.shortTerm}
          onChange={(v) => updateField("shortTerm", v)}
          placeholder={t("mia.placeholder.shortTerm")}
        />
        <FormField
          label={t("mia.longTerm")}
          type="textarea"
          rows={6}
          value={data.longTerm}
          onChange={(v) => updateField("longTerm", v)}
          placeholder={t("mia.placeholder.longTerm")}
        />
      </div>
    </CollapsibleSection>
  );
});


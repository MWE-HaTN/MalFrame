/**
 * Impact Assessment Section component for MIA Dashboard
 */

import { memo } from "react";
import { TriangleAlert } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PortalDropdown } from "@/components/ui/portal-dropdown";
import { useLanguage } from "@/hooks/useLanguage";
import type { ImpactData } from "@/features/mia/types";

interface ImpactSectionProps {
  data: ImpactData;
  onChange: (data: ImpactData) => void;
  forceCloseCounter: number;
}

export const ImpactSection = memo(function ImpactSection({
  data,
  onChange,
  forceCloseCounter,
}: ImpactSectionProps) {
  const { t } = useLanguage();

  const updateField = <K extends keyof ImpactData>(
    field: K,
    value: ImpactData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <CollapsibleSection
      title={t("mia.impact")}
      icon={<TriangleAlert className="w-4 h-4" />}
      storageKey="dfir-impact"
      forceClose={forceCloseCounter}
      lazy
      skeletonVariant="form"
      skeletonRows={3}
      hint={t("hint.mia.impact")}
    >
      <div className="space-y-4">
        {/* Row 1: Scope of Infection | User Accounts Affected */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            label={t("mia.scope")}
            type="textarea"
            rows={2}
            value={data.scopeOfInfection}
            onChange={(v) => updateField("scopeOfInfection", v)}
            placeholder={t("mia.placeholder.scope")}
          />
          <FormField
            label={t("mia.accounts")}
            type="textarea"
            rows={2}
            value={data.userAccountsAffected}
            onChange={(v) => updateField("userAccountsAffected", v)}
            placeholder={t("mia.placeholder.accounts")}
          />
        </div>
        
        {/* Row 2: Data Accessed / Stolen - Full Width */}
        <FormField
          label={t("mia.dataStolen")}
          type="textarea"
          rows={3}
          value={data.dataAccessedStolen}
          onChange={(v) => updateField("dataAccessedStolen", v)}
          placeholder={t("mia.placeholder.dataStolen")}
        />
        
        {/* Row 3: Persistence Likelihood | Risk Rating */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PortalDropdown
            label={t("mia.persistence")}
            value={data.persistenceLikelihood}
            onChange={(v) => updateField("persistenceLikelihood", v)}
            options={[
              { value: "", label: t("common.select") },
              { value: "none", label: t("mia.persist.none") },
              { value: "low", label: t("mia.persist.low") },
              { value: "medium", label: t("mia.persist.medium") },
              { value: "high", label: t("mia.persist.high") },
              { value: "critical", label: t("mia.persist.critical") },
            ]}
          />
          <PortalDropdown
            label={t("mia.riskRating")}
            value={data.riskRating}
            onChange={(v) => updateField("riskRating", v)}
            options={[
              { value: "", label: t("common.select") },
              { value: "informational", label: t("mia.risk.info") },
              { value: "low", label: t("mia.risk.low") },
              { value: "medium", label: t("mia.risk.medium") },
              { value: "high", label: t("mia.risk.high") },
              { value: "critical", label: t("mia.risk.critical") },
            ]}
          />
        </div>
      </div>
    </CollapsibleSection>
  );
});


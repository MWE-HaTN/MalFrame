/**
 * Background Section component for MIA Dashboard
 */

import { memo } from "react";
import { User } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PortalDropdown } from "@/components/ui/portal-dropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import type { BackgroundData } from "@/types/mia";

interface BackgroundSectionProps {
  data: BackgroundData;
  onChange: (data: BackgroundData) => void;
  forceCloseCounter: number;
}

export const BackgroundSection = memo(function BackgroundSection({
  data,
  onChange,
  forceCloseCounter,
}: BackgroundSectionProps) {
  const { t } = useLanguage();

  const updateField = <K extends keyof BackgroundData>(
    field: K,
    value: BackgroundData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <CollapsibleSection
      title={t("mia.background")}
      icon={<User className="w-4 h-4" />}
      defaultOpen={true}
      storageKey="dfir-background"
      forceClose={forceCloseCounter}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField
          label={t("mia.caseId")}
          value={data.caseId}
          onChange={(v) => updateField("caseId", v)}
          placeholder={t("mia.placeholder.caseId")}
        />
        <FormField
          label={t("mia.analyst")}
          value={data.analyst}
          onChange={(v) => updateField("analyst", v)}
          placeholder={t("mia.placeholder.analyst")}
        />
        <FormField
          label={t("mia.date")}
          type="date"
          value={data.date}
          onChange={(v) => updateField("date", v)}
        />
        <FormField
          label={t("mia.workstation")}
          value={data.workstation}
          onChange={(v) => updateField("workstation", v)}
          placeholder={t("mia.placeholder.workstation")}
        />
        <FormField
          label={t("mia.alertSource")}
          value={data.source}
          onChange={(v) => updateField("source", v)}
          placeholder={t("mia.placeholder.alertSource")}
        />
        <PortalDropdown
          label={t("mia.infectionVector")}
          value={data.infectionVector}
          onChange={(v) => updateField("infectionVector", v)}
          options={[
            { value: "", label: t("common.select") },
            { value: "email", label: t("mia.vector.email") },
            { value: "web", label: t("mia.vector.web") },
            { value: "usb", label: t("mia.vector.usb") },
            { value: "exploit", label: t("mia.vector.exploit") },
            { value: "supply_chain", label: t("mia.vector.supplyChain") },
            { value: "insider", label: t("mia.vector.insider") },
            { value: "unknown", label: t("mia.vector.unknown") },
          ]}
        />
      </div>
    </CollapsibleSection>
  );
});

/**
 * Background Section component for MRE Dashboard
 */

import { memo } from "react";
import { User } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PortalDropdown } from "@/components/ui/portal-dropdown";
import { useLanguage } from "@/hooks/useLanguage";
import type { BackgroundData } from "@/features/mre/types";
import type { DropdownOption } from "@/components/ui/portal-dropdown";

const getNotificationVectorOptions = (t: (key: string) => string): DropdownOption[] => [
  { value: "", label: t("common.select") },
  { value: "av_alert", label: t("mre.vector.avAlert") },
  { value: "edr_detection", label: t("mre.vector.edrDetection") },
  { value: "threat_intel", label: t("mre.vector.threatIntel") },
  { value: "incident_response", label: t("mre.vector.incidentResponse") },
  { value: "customer_submission", label: t("mre.vector.customerSubmission") },
  { value: "other", label: t("mre.vector.other") },
];

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
      title={t("mre.background")}
      icon={<User className="w-4 h-4" />}
      defaultOpen={true}
      storageKey="re-background"
      forceClose={forceCloseCounter}
      hint={t("hint.mre.background")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField
          label={t("mre.analyst")}
          value={data.analyst}
          onChange={(v) => updateField("analyst", v)}
          placeholder={t("mre.placeholder.analyst")}
        />
        <FormField
          label={t("mre.date")}
          type="date"
          value={data.date}
          onChange={(v) => updateField("date", v)}
        />
        <FormField
          label={t("mre.workstation")}
          value={data.workstation}
          onChange={(v) => updateField("workstation", v)}
          placeholder={t("mre.placeholder.workstation")}
        />
        <FormField
          label={t("mre.fileName") + " *"}
          value={data.fileName}
          onChange={(v) => updateField("fileName", v)}
          placeholder={t("mre.placeholder.fileName")}
        />
        <FormField
          label={t("mre.fileLocation")}
          value={data.fileLocation}
          onChange={(v) => updateField("fileLocation", v)}
          placeholder={t("mre.placeholder.fileLocation")}
        />
        <FormField
          label={t("mre.os")}
          value={data.os}
          onChange={(v) => updateField("os", v)}
          placeholder={t("mre.placeholder.os")}
        />
      </div>

      {/* File Timestamps - 3 separate fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <FormField
          label={t("mre.timestampCreated")}
          value={data.fileTimestampCreated}
          onChange={(v) => updateField("fileTimestampCreated", v)}
          placeholder={t("mre.placeholder.timestamp")}
        />
        <FormField
          label={t("mre.timestampModified")}
          value={data.fileTimestampModified}
          onChange={(v) => updateField("fileTimestampModified", v)}
          placeholder={t("mre.placeholder.timestamp")}
        />
        <FormField
          label={t("mre.timestampAccessed")}
          value={data.fileTimestampAccessed}
          onChange={(v) => updateField("fileTimestampAccessed", v)}
          placeholder={t("mre.placeholder.timestamp")}
        />
      </div>

      {/* Notification Vector Dropdown */}
      <div className="mt-4">
        <PortalDropdown
          label={t("mre.notificationVector")}
          value={data.notificationVector}
          onChange={(v) => updateField("notificationVector", v)}
          options={getNotificationVectorOptions(t)}
        />
      </div>
    </CollapsibleSection>
  );
});


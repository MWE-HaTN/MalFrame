/**
 * Sample Information Section component for MIA Dashboard
 */

import { memo } from "react";
import { Hash } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PortalDropdown } from "@/components/ui/portal-dropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SampleInfoData } from "@/types/mia";

interface SampleInfoSectionProps {
  data: SampleInfoData;
  onChange: (data: SampleInfoData) => void;
  forceCloseCounter: number;
}

export const SampleInfoSection = memo(function SampleInfoSection({
  data,
  onChange,
  forceCloseCounter,
}: SampleInfoSectionProps) {
  const { t } = useLanguage();

  const updateField = <K extends keyof SampleInfoData>(
    field: K,
    value: SampleInfoData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <CollapsibleSection
      title={t("mia.sampleInfo")}
      icon={<Hash className="w-4 h-4" />}
      defaultOpen={true}
      storageKey="dfir-sample-info"
      forceClose={forceCloseCounter}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={t("mia.fileName")}
          value={data.fileName}
          onChange={(v) => updateField("fileName", v)}
          placeholder={t("mia.placeholder.fileName")}
        />
        <FormField
          label={t("mia.filePath")}
          value={data.filePath}
          onChange={(v) => updateField("filePath", v)}
          placeholder={t("mia.placeholder.filePath")}
        />
        <FormField
          label={t("mia.fileSize")}
          value={data.fileSize}
          onChange={(v) => updateField("fileSize", v)}
          placeholder={t("mia.placeholder.fileSize")}
        />
        <PortalDropdown
          label={t("mia.fileType")}
          value={data.fileType}
          onChange={(v) => updateField("fileType", v)}
          options={[
            { value: "", label: t("common.select") },
            { value: "pe32", label: t("mia.fileType.pe32") },
            { value: "pe64", label: t("mia.fileType.pe64") },
            { value: "dll", label: t("mia.fileType.dll") },
            { value: "script", label: t("mia.fileType.script") },
            { value: "office", label: t("mia.fileType.office") },
            { value: "pdf", label: t("mia.fileType.pdf") },
            { value: "archive", label: t("mia.fileType.archive") },
            { value: "other", label: t("mia.fileType.other") },
          ]}
        />
        <FormField
          label={t("mia.sha256")}
          value={data.sha256}
          onChange={(v) => updateField("sha256", v)}
          placeholder={t("mia.placeholder.sha256")}
          mono
        />
        <PortalDropdown
          label={t("mia.signature")}
          value={data.signature}
          onChange={(v) => updateField("signature", v)}
          options={[
            { value: "", label: t("common.select") },
            { value: "unsigned", label: t("mia.sig.unsigned") },
            { value: "valid", label: t("mia.sig.valid") },
            { value: "invalid", label: t("mia.sig.invalid") },
            { value: "expired", label: t("mia.sig.expired") },
            { value: "self_signed", label: t("mia.sig.selfSigned") },
          ]}
        />
        <FormField
          label={t("mia.compileTime")}
          value={data.compileTime}
          onChange={(v) => updateField("compileTime", v)}
          placeholder={t("mia.placeholder.compileTime")}
        />
        <FormField
          label={t("mia.avDetection")}
          value={data.avDetection}
          onChange={(v) => updateField("avDetection", v)}
          placeholder={t("mia.placeholder.avDetection")}
        />
      </div>
    </CollapsibleSection>
  );
});

import { memo } from "react";
import { Network } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useLanguage } from "@/contexts/LanguageContext";
import type { BehaviorAnalysisData } from "@/types/mia";

interface BehaviorAnalysisSectionProps {
  data: BehaviorAnalysisData;
  onChange: (data: BehaviorAnalysisData) => void;
  forceCloseCounter: number;
}

export const BehaviorAnalysisSection = memo(function BehaviorAnalysisSection({
  data,
  onChange,
  forceCloseCounter,
}: BehaviorAnalysisSectionProps) {
  const { t } = useLanguage();

  return (
    <CollapsibleSection
      title={t("mia.behaviorAnalysis")}
      icon={<Network className="w-4 h-4" />}
      storageKey="dfir-behavior-analysis"
      forceClose={forceCloseCounter}
      lazy
      skeletonVariant="form"
      skeletonRows={4}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Process Tree */}
        <FormField
          label={t("mia.processTree")}
          type="textarea"
          rows={4}
          value={data.processTree}
          onChange={(v) => onChange({ ...data, processTree: v })}
          placeholder={t("mia.placeholder.processTree")}
          allowImages
          images={data.processTreeImages || []}
          onImagesChange={(imgs) =>
            onChange({ ...data, processTreeImages: imgs })
          }
        />

        {/* File System Modifications */}
        <FormField
          label={t("mia.fileSystem")}
          type="textarea"
          rows={4}
          value={data.fileSystemMods}
          onChange={(v) => onChange({ ...data, fileSystemMods: v })}
          placeholder={t("mia.placeholder.fileSystem")}
          allowImages
          images={data.fileSystemModsImages || []}
          onImagesChange={(imgs) =>
            onChange({ ...data, fileSystemModsImages: imgs })
          }
        />

        {/* Registry / Persistence */}
        <FormField
          label={t("mia.registry")}
          type="textarea"
          rows={4}
          value={data.registryPersistence}
          onChange={(v) => onChange({ ...data, registryPersistence: v })}
          placeholder={t("mia.placeholder.registry")}
          allowImages
          images={data.registryPersistenceImages || []}
          onImagesChange={(imgs) =>
            onChange({ ...data, registryPersistenceImages: imgs })
          }
        />

        {/* Network Activity */}
        <FormField
          label={t("mia.network")}
          type="textarea"
          rows={4}
          value={data.networkActivity}
          onChange={(v) => onChange({ ...data, networkActivity: v })}
          placeholder={t("mia.placeholder.network")}
          allowImages
          images={data.networkActivityImages || []}
          onImagesChange={(imgs) =>
            onChange({ ...data, networkActivityImages: imgs })
          }
        />

        {/* Memory Artifacts */}
        <FormField
          label={t("mia.memory")}
          type="textarea"
          rows={4}
          value={data.memoryArtifacts}
          onChange={(v) => onChange({ ...data, memoryArtifacts: v })}
          placeholder={t("mia.placeholder.memory")}
          allowImages
          images={data.memoryArtifactsImages || []}
          onImagesChange={(imgs) =>
            onChange({ ...data, memoryArtifactsImages: imgs })
          }
        />

        {/* System Changes */}
        <FormField
          label={t("mia.systemChanges")}
          type="textarea"
          rows={4}
          value={data.systemChanges}
          onChange={(v) => onChange({ ...data, systemChanges: v })}
          placeholder={t("mia.placeholder.systemChanges")}
          allowImages
          images={data.systemChangesImages || []}
          onImagesChange={(imgs) =>
            onChange({ ...data, systemChangesImages: imgs })
          }
        />
      </div>
    </CollapsibleSection>
  );
});

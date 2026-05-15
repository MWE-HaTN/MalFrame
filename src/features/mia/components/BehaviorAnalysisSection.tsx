import { memo, useCallback } from "react";
import { Network } from "lucide-react";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useLanguage } from "@/hooks/useLanguage";
import type { BehaviorAnalysisData } from "@/features/mia/types";

const EMPTY_IMAGES: string[] = [];

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

  const handleProcessTreeImages = useCallback((imgs: string[]) => onChange({ ...data, processTreeImages: imgs }), [data, onChange]);
  const handleFileSystemImages = useCallback((imgs: string[]) => onChange({ ...data, fileSystemModsImages: imgs }), [data, onChange]);
  const handleRegistryImages = useCallback((imgs: string[]) => onChange({ ...data, registryPersistenceImages: imgs }), [data, onChange]);
  const handleNetworkImages = useCallback((imgs: string[]) => onChange({ ...data, networkActivityImages: imgs }), [data, onChange]);
  const handleMemoryImages = useCallback((imgs: string[]) => onChange({ ...data, memoryArtifactsImages: imgs }), [data, onChange]);
  const handleSystemImages = useCallback((imgs: string[]) => onChange({ ...data, systemChangesImages: imgs }), [data, onChange]);

  return (
    <CollapsibleSection
      title={t("mia.behaviorAnalysis")}
      icon={<Network className="w-4 h-4" />}
      storageKey="dfir-behavior-analysis"
      forceClose={forceCloseCounter}
      lazy
      skeletonVariant="form"
      skeletonRows={4}
      hint={t("hint.mia.behavior")}
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
          images={data.processTreeImages ?? EMPTY_IMAGES}
          onImagesChange={handleProcessTreeImages}
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
          images={data.fileSystemModsImages ?? EMPTY_IMAGES}
          onImagesChange={handleFileSystemImages}
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
          images={data.registryPersistenceImages ?? EMPTY_IMAGES}
          onImagesChange={handleRegistryImages}
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
          images={data.networkActivityImages ?? EMPTY_IMAGES}
          onImagesChange={handleNetworkImages}
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
          images={data.memoryArtifactsImages ?? EMPTY_IMAGES}
          onImagesChange={handleMemoryImages}
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
          images={data.systemChangesImages ?? EMPTY_IMAGES}
          onImagesChange={handleSystemImages}
        />
      </div>
    </CollapsibleSection>
  );
});

import { useCallback } from "react";
import type { FileDropInfo } from "@/components/FileHashDropzone";
import type { Artifact } from "@/types/dashboard";
import { generateId } from "@/lib/utils";

interface UseArtifactFileDropOptions<T extends { artifacts: Artifact[] }> {
  setData: React.Dispatch<React.SetStateAction<T>>;
}

function createArtifactFromFileInfo(fileInfo: FileDropInfo): Artifact {
  return {
    id: generateId(),
    name: fileInfo.name,
    type: "Unclassified",
    size: fileInfo.sizeFormatted,
    md5: fileInfo.md5,
    sha256: fileInfo.sha256,
    addedAt: new Date().toISOString(),
    usedIn: [],
  };
}

export function useArtifactFileDrop<T extends { artifacts: Artifact[] }>(
  options: UseArtifactFileDropOptions<T>
) {
  const { setData } = options;

  const handleFileDropped = useCallback((fileInfo: FileDropInfo) => {
    const newArtifact = createArtifactFromFileInfo(fileInfo);
    setData((prev) => ({
      ...prev,
      artifacts: [...prev.artifacts, newArtifact],
    }));
  }, [setData]);

  const handleMultipleFilesDropped = useCallback((filesInfo: FileDropInfo[]) => {
    const newArtifacts = filesInfo.map(createArtifactFromFileInfo);
    setData((prev) => ({
      ...prev,
      artifacts: [...prev.artifacts, ...newArtifacts],
    }));
  }, [setData]);

  return {
    handleFileDropped,
    handleMultipleFilesDropped,
  };
}

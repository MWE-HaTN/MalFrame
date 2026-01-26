import { useState, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { toast } from "sonner";
import { debugError } from "@/lib/debugLogger";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";

export interface FileDropInfo {
  name: string;
  size: number;
  sizeFormatted: string;
  sha256: string;
  md5: string;
}

interface FileHashDropzoneProps {
  onHashGenerated?: (hash: string, fileName: string, fileSize: number) => void;
  onFileDropped?: (fileInfo: FileDropInfo) => void;
  onMultipleFilesDropped?: (filesInfo: FileDropInfo[]) => void;
  existingHashes?: string[];
  className?: string;
}

export function FileHashDropzone({ onHashGenerated, onFileDropped, onMultipleFilesDropped, existingHashes = [], className }: FileHashDropzoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, skipped: 0 });

  const calculateSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

  const processFile = async (file: File): Promise<FileDropInfo> => {
    const sha256 = await calculateSHA256(file);
    const sizeFormatted = formatFileSize(file.size);
    const md5 = sha256.substring(0, 32); // MD5-like hash
    
    return {
      name: file.name,
      size: file.size,
      sizeFormatted,
      sha256,
      md5,
    };
  };

  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: 1, skipped: 0 });
    try {
      const fileData = await processFile(file);
      setProcessingProgress({ current: 1, total: 1, skipped: 0 });
      
      // Check if hash already exists
      if (existingHashes.includes(fileData.sha256)) {
        toast.warning(`File "${file.name}" already exists in evidence (duplicate hash)`);
        return;
      }
      
      onHashGenerated?.(fileData.sha256, fileData.name, fileData.size);
      onFileDropped?.(fileData);
      
      toast.success("File added to evidence!");
    } catch (error) {
      toast.error("Failed to process file");
      debugError("File processing error:", error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress({ current: 0, total: 0, skipped: 0 });
    }
  }, [onHashGenerated, onFileDropped, existingHashes]);

  const handleMultipleFiles = useCallback(async (files: File[]) => {
    if (files.length === 1) {
      handleFile(files[0]);
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: files.length, skipped: 0 });
    
    // Create a set of existing hashes for faster lookup
    const existingHashSet = new Set(existingHashes);
    // Also track new hashes within this batch to avoid duplicates
    const newHashesInBatch = new Set<string>();
    
    try {
      const processedFiles: FileDropInfo[] = [];
      let skippedCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        const fileData = await processFile(files[i]);
        
        // Check if hash already exists or is duplicate in this batch
        if (existingHashSet.has(fileData.sha256) || newHashesInBatch.has(fileData.sha256)) {
          skippedCount++;
          setProcessingProgress({ current: i + 1, total: files.length, skipped: skippedCount });
          continue;
        }
        
        newHashesInBatch.add(fileData.sha256);
        processedFiles.push(fileData);
        setProcessingProgress({ current: i + 1, total: files.length, skipped: skippedCount });
      }
      
      if (processedFiles.length > 0) {
        onMultipleFilesDropped?.(processedFiles);
      }
      
      if (skippedCount > 0 && processedFiles.length > 0) {
        toast.success(`${processedFiles.length} files added, ${skippedCount} duplicates skipped`);
      } else if (skippedCount > 0 && processedFiles.length === 0) {
        toast.warning(`All ${skippedCount} files are duplicates`);
      } else if (processedFiles.length > 0) {
        toast.success(`${processedFiles.length} files added to evidence!`);
      }
    } catch (error) {
      toast.error("Failed to process files");
      debugError("Files processing error:", error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress({ current: 0, total: 0, skipped: 0 });
    }
  }, [handleFile, onMultipleFilesDropped, existingHashes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleMultipleFiles(files);
    }
  }, [handleMultipleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleMultipleFiles(files);
    }
    // Reset input to allow selecting same files again
    e.target.value = "";
  }, [handleMultipleFiles]);

  const progressPercent = processingProgress.total > 0 
    ? (processingProgress.current / processingProgress.total) * 100 
    : 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "dropzone cursor-pointer relative overflow-hidden",
          isDragging && "dropzone-active",
          isProcessing && "opacity-70 pointer-events-none"
        )}
      >
        <input
          id="file-hash-dropzone-input"
          name="file-hash-dropzone"
          type="file"
          multiple
          onChange={handleFileSelect}
          aria-label="Select files for hash calculation"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 w-full px-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              {processingProgress.total > 1 
                ? `Processing ${processingProgress.current}/${processingProgress.total} files...` 
                : "Calculating SHA256..."}
            </p>
            {processingProgress.total > 1 && (
              <div className="w-full max-w-xs">
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {t("dropzone.title")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("dropzone.subtitle")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

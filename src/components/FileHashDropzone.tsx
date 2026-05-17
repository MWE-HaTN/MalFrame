import { useState, useCallback, memo } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { toast } from "sonner";
import { debugError } from "@/lib/debugLogger";
import { useLanguage } from "@/hooks/useLanguage";
import { Progress } from "@/components/ui/progress";

// Pure JS SHA-256 fallback for non-secure contexts (e.g. accessed via IP instead of localhost)
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256PureJS(buffer: ArrayBuffer): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const bytes = new Uint8Array(buffer);
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(padded.length - 4, bitLen >>> 0, false);
  for (let offset = 0; offset < padded.length; offset += 64) {
    const W = new Uint32Array(64);
    for (let t = 0; t < 16; t++) W[t] = view.getUint32(offset + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = rightRotate(W[t - 15], 7) ^ rightRotate(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rightRotate(W[t - 2], 17) ^ rightRotate(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((n) => n.toString(16).padStart(8, "0")).join("");
}

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

export const FileHashDropzone = memo(function FileHashDropzone({ onHashGenerated, onFileDropped, onMultipleFilesDropped, existingHashes = [], className }: FileHashDropzoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, skipped: 0 });

  const calculateSHA256 = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    if (crypto?.subtle) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return sha256PureJS(buffer);
  }, []);

  const processFile = useCallback(async (file: File): Promise<FileDropInfo> => {
    const sha256 = await calculateSHA256(file);
    const sizeFormatted = formatFileSize(file.size);

    return {
      name: file.name,
      size: file.size,
      sizeFormatted,
      sha256,
      md5: "",
    };
  }, [calculateSHA256]);

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
      
      toast.success(t("dropzone.fileAdded"));
    } catch (error) {
      toast.error(t("dropzone.processFailed"));
      debugError("File processing error:", error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress({ current: 0, total: 0, skipped: 0 });
    }
  }, [processFile, onHashGenerated, onFileDropped, existingHashes, t]);

  const handleMultipleFiles = useCallback(async (files: File[]) => {
    if (files.length === 1) {
      await handleFile(files[0]);
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
      toast.error(t("error.failedToProcessFiles"));
      debugError("Files processing error:", error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress({ current: 0, total: 0, skipped: 0 });
    }
  }, [handleFile, processFile, onMultipleFilesDropped, existingHashes, t]);

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
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onChange={handleFileSelect}
          aria-label={t("aria.selectFilesForHash")}
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
});


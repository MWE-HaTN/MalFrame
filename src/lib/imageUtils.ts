import { ClipboardEvent } from "react";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { tSync, type Language } from "@/lib/translations";

function getLang(): Language {
  return (localStorage.getItem(STORAGE_KEYS.LANGUAGE) || "en") as Language;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 1920; // Max width/height in pixels
const JPEG_QUALITY = 0.85;

/**
 * Resize image if it exceeds MAX_DIMENSION, compress to JPEG if large.
 */
function processImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    // Small files — read directly
    if (file.size <= 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        resolve(typeof result === "string" ? result : "");
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
      return;
    }

    // Large files — resize and compress
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Fallback: read as-is
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          resolve(typeof result === "string" ? result : "");
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        resolve(typeof result === "string" ? result : "");
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

/**
 * Handle image paste from clipboard
 */
export function handleImagePaste(
  event: ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  currentImages: string[],
  onImagesChange: (images: string[]) => void
): boolean {
  const clipboardItems = event.clipboardData?.items;
  if (!clipboardItems) return false;

  for (let i = 0; i < clipboardItems.length; i++) {
    const item = clipboardItems[i];
    if (item.type.startsWith("image/")) {
      event.preventDefault();
      const file = item.getAsFile();
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          import("sonner").then(({ toast }) => toast.error(tSync(getLang(), "error.imageTooLarge")));
          return true;
        }
        // Snapshot current images at paste time to avoid stale closure
        const imagesSnapshot = [...currentImages];
        processImage(file).then((base64) => {
          if (base64.length > 0) {
            onImagesChange([...imagesSnapshot, base64]);
          }
        }).catch(() => {
          import("sonner").then(({ toast }) => toast.error(tSync(getLang(), "error.failedToProcessImage")));
        });
      }
      return true;
    }
  }
  return false;
}

/**
 * Handle image file selection from input
 * Uses updater function to avoid stale closure on rapid batch uploads
 */
export function handleImageFileSelect(
  event: React.ChangeEvent<HTMLInputElement>,
  currentImages: string[],
  onImagesChange: (updater: (prev: string[]) => string[]) => void
): void {
  const files = event.target.files;
  if (!files) return;

  const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (imageFiles.length === 0) return;

  const oversized = imageFiles.filter((f) => f.size > MAX_FILE_SIZE);
  if (oversized.length > 0) {
    import("sonner").then(({ toast }) => toast.error(tSync(getLang(), "error.imageTooLarge").replace("{count}", String(oversized.length))));
  }

  const validFiles = imageFiles.filter((f) => f.size <= MAX_FILE_SIZE);
  Promise.all(validFiles.map(processImage)).then((base64s) => {
    const validImages = base64s.filter((img) => img.length > 0);
    if (validImages.length > 0) {
      onImagesChange((prev) => [...prev, ...validImages]);
    }
  }).catch(() => {
    import("sonner").then(({ toast }) => toast.error(tSync(getLang(), "error.failedToProcessImages")));
  });
}

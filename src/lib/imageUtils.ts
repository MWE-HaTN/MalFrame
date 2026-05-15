import { ClipboardEvent } from "react";

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
      reader.onload = (e) => resolve(e.target?.result as string);
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
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
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
          import("sonner").then(({ toast }) => toast.error("Image too large (max 10MB)"));
          return true;
        }
        processImage(file).then((base64) => {
          onImagesChange([...currentImages, base64]);
        }).catch(() => {
          import("sonner").then(({ toast }) => toast.error("Failed to process image"));
        });
      }
      return true;
    }
  }
  return false;
}

/**
 * Handle image file selection from input
 */
export function handleImageFileSelect(
  event: React.ChangeEvent<HTMLInputElement>,
  currentImages: string[],
  onImagesChange: (images: string[]) => void
): void {
  const files = event.target.files;
  if (!files) return;

  const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (imageFiles.length === 0) return;

  const oversized = imageFiles.filter((f) => f.size > MAX_FILE_SIZE);
  if (oversized.length > 0) {
    import("sonner").then(({ toast }) => toast.error(`${oversized.length} image(s) too large (max 10MB)`));
  }

  const validFiles = imageFiles.filter((f) => f.size <= MAX_FILE_SIZE);
  Promise.all(validFiles.map(processImage)).then((base64s) => {
    onImagesChange([...currentImages, ...base64s]);
  }).catch(() => {
    import("sonner").then(({ toast }) => toast.error("Failed to process images"));
  });
}

import { ClipboardEvent } from "react";

/**
 * Handle image paste from clipboard
 * @param event - Clipboard event
 * @param currentImages - Current images array
 * @param onImagesChange - Callback to update images
 * @returns true if image was pasted, false otherwise
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
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          onImagesChange([...currentImages, base64]);
        };
        reader.readAsDataURL(file);
      }
      return true;
    }
  }
  return false;
}

/**
 * Handle image file selection from input
 * @param event - Change event from file input
 * @param currentImages - Current images array
 * @param onImagesChange - Callback to update images
 */
export function handleImageFileSelect(
  event: React.ChangeEvent<HTMLInputElement>,
  currentImages: string[],
  onImagesChange: (images: string[]) => void
): void {
  const files = event.target.files;
  if (!files) return;

  Array.from(files).forEach((file) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImagesChange([...currentImages, base64]);
      };
      reader.readAsDataURL(file);
    }
  });
}

// Image Storage Utility
// Manages images with naming convention: hash_fieldName_index

import { STORAGE_KEYS } from "@/lib/storageKeys";
import { validateImageRegistry, safeJsonParse } from "@/lib/validationSchemas";
import { debugWarn, debugError } from "@/lib/debugLogger";

interface StoredImage {
  id: string; // hash_fieldName_index
  data: string; // base64 data
  fieldName: string;
  index: number;
  hash: string;
  timestamp: number;
}

interface ImageRegistry {
  images: StoredImage[];
  lastUpdated: number;
}

// Get all stored images from localStorage with validation (internal use)
function getStoredImages(): ImageRegistry {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.IMAGES);
    if (stored) {
      const parsed = safeJsonParse<unknown>(stored);
      const validated = validateImageRegistry(parsed);
      if (validated) {
        return validated;
      }
      debugWarn("Image registry validation failed, clearing corrupted data");
      localStorage.removeItem(STORAGE_KEYS.IMAGES);
    }
  } catch (e) {
    debugError("Error reading stored images:", e);
    localStorage.removeItem(STORAGE_KEYS.IMAGES);
  }
  return { images: [], lastUpdated: Date.now() };
}

// Save images to localStorage (internal use only)
function saveImagesToStorage(images: StoredImage[]): void {
  try {
    const registry: ImageRegistry = {
      images,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(registry));
  } catch (e) {
    debugError("Error saving images:", e);
  }
}

// Clear all images for a specific hash
export function clearImagesForHash(hash: string): void {
  const registry = getStoredImages();
  const shortHash = hash.slice(0, 8) || "nohash";
  
  const remainingImages = registry.images.filter((img) => img.hash !== shortHash);
  saveImagesToStorage(remainingImages);
}

// Clear all images
export function clearAllImages(): void {
  localStorage.removeItem(STORAGE_KEYS.IMAGES);
}

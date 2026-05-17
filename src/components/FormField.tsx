import React, { useRef, useEffect, useCallback, ClipboardEvent, useId, memo } from "react";
import { cn } from "@/lib/utils";
import { handleImagePaste, handleImageFileSelect } from "@/lib/imageUtils";
import { Image } from "lucide-react";
import { ImageGrid } from "@/components/ui/image-grid";
import { DatePicker } from "@/components/ui/date-picker";
import { useLanguage } from "@/hooks/useLanguage";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "textarea" | "date" | "time";
  className?: string;
  containerClassName?: string;
  mono?: boolean;
  rows?: number;
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  allowImages?: boolean;
  id?: string;
  name?: string;
}

export const FormField = memo(function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  containerClassName,
  mono = true,
  rows = 3,
  images = [],
  onImagesChange,
  allowImages = false,
  id: externalId,
  name: externalName,
}: FormFieldProps) {
  const { t } = useLanguage();
  const generatedId = useId();
  const fieldId = externalId || `field-${generatedId}`;
  const fieldName = externalName || fieldId;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  
  // Calculate min height based on rows (approximately 24px per row + padding)
  const minHeight = rows * 24 + 16;

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = "auto";
    const newHeight = Math.max(minHeight, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.scrollTop = 0;
  }, [minHeight]);

  useEffect(() => {
    if (type === "textarea") {
      adjustHeight();
    }
  }, [value, type, adjustHeight]);

  const inputClasses = cn(
    "w-full bg-input border border-primary/50 rounded-sm px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none hover:border-primary",
    type !== "textarea" && "h-[46px]", // Match dropdown height exactly
    type === "textarea" && "py-3",
    mono && "font-mono",
    className
  );

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!allowImages || !onImagesChange) return;
    handleImagePaste(e, imagesRef.current, onImagesChange);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onImagesChange) return;
    handleImageFileSelect(e, imagesRef.current, (updater) => onImagesChange(updater(imagesRef.current)));
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    if (!onImagesChange) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className={cn("space-y-2 w-full", containerClassName)}>
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="label-cyber block">{label}</label>
        {allowImages && type === "textarea" && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
            title={t("common.addImage")}
            aria-label={t("aria.addImageAttachment")}
          >
            <Image className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      
      {type === "textarea" ? (
        <textarea
          ref={textareaRef}
          id={fieldId}
          name={fieldName}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={adjustHeight}
          onPaste={handlePaste}
          placeholder={allowImages ? `${placeholder || ""}\n(Paste images with Ctrl+V)` : placeholder}
          style={{ minHeight: `${minHeight}px` }}
          className={cn(inputClasses, "resize-none flex-1")}
        />
      ) : type === "date" ? (
        <DatePicker
          id={fieldId}
          name={fieldName}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          id={fieldId}
          name={fieldName}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}

      {/* Image preview grid */}
      {allowImages && (
        <div className="mt-2">
          <ImageGrid 
            images={images} 
            onRemove={removeImage}
            imageHeight="h-24"
          />
        </div>
      )}

      {/* Hidden file input */}
      {allowImages && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id={`${fieldId}-file`}
          name={`${fieldName}-file`}
          aria-label={t("aria.uploadImageFiles")}
        />
      )}
    </div>
  );
});

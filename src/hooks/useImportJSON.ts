import { useCallback } from "react";
import { toast } from "sonner";

type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

interface UseImportJSONOptions<T> {
  validate: (jsonString: string) => ValidationResult<T>;
  onSuccess: (data: T) => void;
  successMessage?: string;
}

export function useImportJSON<T>(options: UseImportJSONOptions<T>) {
  const { validate, onSuccess, successMessage = "Data imported successfully!" } = options;

  const importJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (changeEvent) => {
      const selectedFile = (changeEvent.target as HTMLInputElement).files?.[0];
      if (selectedFile) {
        const fileReader = new FileReader();
        fileReader.onload = (loadEvent) => {
          const fileContent = loadEvent.target?.result as string;
          const validationResult = validate(fileContent);

          if (validationResult.success === false) {
            toast.error(validationResult.error);
            return;
          }

          onSuccess(validationResult.data);
          toast.success(successMessage);
        };
        fileReader.readAsText(selectedFile);
      }
    };
    input.click();
  }, [validate, onSuccess, successMessage]);

  return { importJSON };
}

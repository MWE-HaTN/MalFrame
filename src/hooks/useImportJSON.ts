import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

interface UseImportJSONOptions<T> {
  validate: (jsonString: string) => ValidationResult<T>;
  onSuccess: (data: T) => void;
}

export function useImportJSON<T>(options: UseImportJSONOptions<T>) {
  const { validate, onSuccess } = options;
  const { t } = useLanguage();

  const validateRef = useRef(validate);
  validateRef.current = validate;
  const tRef = useRef(t);
  tRef.current = t;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const importJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (changeEvent) => {
      const selectedFile = (changeEvent.target as HTMLInputElement).files?.[0];
      if (selectedFile) {
        // Reject files larger than 50MB to prevent browser hangs
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (selectedFile.size > MAX_FILE_SIZE) {
          toast.error(tRef.current("error.fileTooLarge"));
          return;
        }

        const fileReader = new FileReader();
        fileReader.onload = (loadEvent) => {
          const fileContent = loadEvent.target?.result;
          if (typeof fileContent !== "string") {
            toast.error(tRef.current("error.failedToReadFile"));
            return;
          }
          const validationResult = validateRef.current(fileContent);

          if (validationResult.success === false) {
            toast.error(validationResult.error);
            return;
          }

          onSuccessRef.current(validationResult.data);
          toast.success(tRef.current("import.success"));
        };
        fileReader.onerror = () => {
          toast.error(tRef.current("error.failedToReadFile"));
        };
        fileReader.readAsText(selectedFile);
      }
    };
    input.click();
  }, []);

  return { importJSON };
}

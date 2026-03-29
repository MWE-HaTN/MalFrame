import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Moon, Sun, X, FileText, Check, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackTodayActivity } from "@/lib/activityUtils";

interface ExportConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportName: string;
  exportType: "pdf" | "word" | "json";
  onConfirmExport: (saveImages: boolean, clearData: boolean) => Promise<void> | void;
  hasImages?: boolean;
  imageCount?: number;
}

type DialogStep = "theme-check" | "confirm-export" | "clear-data" | "exporting";

export function ExportConfirmDialog({
  open,
  onOpenChange,
  reportName,
  exportType,
  onConfirmExport,
  hasImages = false,
  imageCount = 0,
}: ExportConfirmDialogProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [step, setStep] = useState<DialogStep>("theme-check");
  const [saveImages, setSaveImages] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isDarkMode = theme === "dark";
  const isDocumentExport = exportType === "pdf" || exportType === "word";

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setStep("theme-check");
      setSaveImages(true);
      setProgress(0);
    }
  }, [open]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleKeepAndContinue = () => {
    setStep("confirm-export");
  };

  const handleSwitchToLightMode = () => {
    setTheme("light");
    setStep("confirm-export");
  };

  const handleCancel = () => {
    setStep("theme-check");
    setSaveImages(true);
    onOpenChange(false);
  };

  const handleConfirmExport = () => {
    // Go to clear data step
    setStep("clear-data");
  };

  const handleFinalExport = async (shouldClear: boolean) => {
    setStep("exporting");
    setProgress(0);
    
    // Simulate progress while export runs
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90; // Cap at 90% until complete
        return Math.min(90, prev + Math.random() * 15);
      });
    }, 200);
    
    try {
      await onConfirmExport(saveImages, shouldClear);
      // Track activity on successful export
      trackTodayActivity();
      setProgress(100);
      // Small delay to show 100%
      await new Promise((r) => setTimeout(r, 300));
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      onOpenChange(false);
    }
  };

  const handleCancelExport = () => {
    // Don't reset step here - let handleOpenChange handle it
    onOpenChange(false);
  };

  // For JSON export or light mode, go straight to confirm (runs after reset)
  useEffect(() => {
    if (open && step === "theme-check") {
      // Small delay to ensure reset effect runs first
      const timer = setTimeout(() => {
        if (!isDocumentExport || !isDarkMode) {
          setStep("confirm-export");
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [open, step, isDocumentExport, isDarkMode]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border-primary/30 bg-background">
        {step === "theme-check" && isDarkMode && isDocumentExport && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary font-terminal">
                <Moon className="w-5 h-5" />
                {t("export.darkModeWarning")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("export.darkModeDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {/* Option 1: Keep and continue */}
              <button
                onClick={handleKeepAndContinue}
                className={cn(
                  "w-full p-4 rounded-sm border border-border text-left",
                  "hover:border-primary/50 hover:bg-primary/5 transition-all",
                  "flex items-center gap-3"
                )}
              >
                <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-terminal text-sm text-foreground">
                    {t("export.keepDarkMode")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("export.keepDarkModeDesc")}
                  </p>
                </div>
              </button>

              {/* Option 2: Switch to light mode */}
              <button
                onClick={handleSwitchToLightMode}
                className={cn(
                  "w-full p-4 rounded-sm border border-border text-left",
                  "hover:border-accent/50 hover:bg-accent/5 transition-all",
                  "flex items-center gap-3"
                )}
              >
                <div className="w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-terminal text-sm text-foreground">
                    {t("export.switchToLight")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("export.switchToLightDesc")}
                  </p>
                </div>
              </button>

              {/* Option 3: Cancel */}
              <button
                onClick={handleCancel}
                className={cn(
                  "w-full p-4 rounded-sm border border-border text-left",
                  "hover:border-destructive/50 hover:bg-destructive/5 transition-all",
                  "flex items-center gap-3"
                )}
              >
                <div className="w-10 h-10 rounded-sm bg-destructive/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-terminal text-sm text-foreground">
                    {t("export.cancelExport")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("export.cancelExportDesc")}
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "confirm-export" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary font-terminal">
                <FileText className="w-5 h-5" />
                {t("export.confirmTitle")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("export.confirmDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="p-4 rounded-sm border border-primary/30 bg-primary/5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {t("export.reportName")}
                </p>
                <p className="font-mono text-sm text-primary break-all">
                  {reportName || t("export.noFileName")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("export.format")}: <span className="text-accent uppercase">{exportType}</span>
                </p>
              </div>

              {/* Image save option */}
              {hasImages && imageCount > 0 && (
                <div className="p-4 rounded-sm border border-accent/30 bg-accent/5">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="save-images"
                      checked={saveImages}
                      onCheckedChange={(checked) => setSaveImages(checked === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor="save-images" 
                        className="text-sm font-terminal text-foreground cursor-pointer flex items-center gap-2"
                      >
                        <Image className="w-4 h-4 text-accent" />
                        {t("export.saveImages")}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("export.saveImagesDesc").replace("{count}", String(imageCount))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={handleCancelExport}
                className="flex-1 border-border hover:border-destructive hover:text-destructive"
              >
                <X className="w-4 h-4 mr-2" />
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleConfirmExport}
                className="flex-1 bg-success text-success-foreground hover:brightness-110"
              >
                <Check className="w-4 h-4 mr-2" />
                {t("export.confirmExport")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "clear-data" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary font-terminal">
                <FileText className="w-5 h-5" />
                {t("export.clearDataTitle")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("export.clearDataDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {/* Yes - Clear data */}
              <button
                onClick={() => handleFinalExport(true)}
                className={cn(
                  "w-full p-4 rounded-sm border border-border text-left",
                  "hover:border-warning/50 hover:bg-warning/5 transition-all",
                  "flex items-center gap-3"
                )}
              >
                <div className="w-10 h-10 rounded-sm bg-warning/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-terminal text-sm text-foreground">
                    {t("export.yesClearData")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("export.yesClearDataDesc")}
                  </p>
                </div>
              </button>

              {/* No - Keep data */}
              <button
                onClick={() => handleFinalExport(false)}
                className={cn(
                  "w-full p-4 rounded-sm border border-border text-left",
                  "hover:border-success/50 hover:bg-success/5 transition-all",
                  "flex items-center gap-3"
                )}
              >
                <div className="w-10 h-10 rounded-sm bg-success/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-terminal text-sm text-foreground">
                    {t("export.noKeepData")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("export.noKeepDataDesc")}
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "exporting" && (
          <div className="py-10 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-full space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-terminal text-primary">
                  {t("export.exporting")}
                </span>
                <span className="font-mono text-primary font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-4 bg-muted/50" 
                indicatorClassName="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
              />
              <div className="h-1 w-full rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/20 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {exportType === "pdf" ? t("export.generatingPDF") : t("export.generatingWord")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



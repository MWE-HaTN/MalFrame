import { memo, useCallback } from "react";
import {
  FileText, ShieldAlert, Mail, Crosshair, KeyRound, Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { getTemplatesForType, type CaseTemplate } from "@/lib/caseTemplates";

interface CaseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseType: "mia" | "mre";
  onSelect: (templateId: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  ShieldAlert,
  Mail,
  Crosshair,
  KeyRound,
  Pencil,
};

const CaseTemplateCard = memo(function CaseTemplateCard({
  template,
  onSelect,
}: {
  template: CaseTemplate;
  onSelect: (id: string) => void;
}) {
  const { t } = useLanguage();
  const Icon = ICON_MAP[template.icon] || FileText;

  const handleClick = useCallback(() => {
    onSelect(template.id);
  }, [template.id, onSelect]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex flex-col items-start gap-2 p-4 rounded-lg border border-border/50",
        "bg-card/30 hover:bg-card/60 hover:border-primary/30",
        "transition-all text-left group"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {t(template.nameKey)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t(template.descKey)}
      </p>
    </button>
  );
});

export const CaseTemplateDialog = memo(function CaseTemplateDialog({
  open,
  onOpenChange,
  caseType,
  onSelect,
}: CaseTemplateDialogProps) {
  const { t } = useLanguage();
  const templates = getTemplatesForType(caseType);

  const handleSelect = useCallback(
    (templateId: string) => {
      onSelect(templateId);
      onOpenChange(false);
    },
    [onSelect, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-terminal tracking-wider">
            {t("template.title")}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-1">
          {t("template.description")}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {templates.map((template) => (
            <CaseTemplateCard
              key={template.id}
              template={template}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
});

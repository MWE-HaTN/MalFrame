import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X, TriangleAlert } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ClearDataDialogProps {
  onConfirm: () => void;
  trigger?: React.ReactNode;
}

export function ClearDataDialog({ onConfirm, trigger }: ClearDataDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 px-4 py-2 rounded-sm font-terminal text-sm uppercase tracking-wide bg-destructive text-destructive-foreground hover:brightness-110 transition-colors">
            <X className="w-4 h-4" />
            {t("common.clear")}
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="border-destructive/50 bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive font-terminal">
            <TriangleAlert className="w-5 h-5" />
            {t("clear.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {t("clear.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-mono text-sm">
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-sm"
          >
            {t("clear.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


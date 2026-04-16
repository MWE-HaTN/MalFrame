import { useState, useCallback } from "react";
import { ChevronUp, Layers, Trash2 } from "lucide-react";
import { FormField } from "@/components/FormField";
import { cn, generateId } from "@/lib/utils";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { SubSectionHeader, useExpandedState } from "@/features/mre/components/code-analysis/shared";
import { useDragReorder } from "@/hooks/useDragReorder";
import type { UnpackLayer } from "@/types/dashboard";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { useLanguage } from "@/hooks/useLanguage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnpackingLayersProps {
  unpackLayers: UnpackLayer[];
  onUnpackLayersChange: (layers: UnpackLayer[]) => void;
  onClearPacked?: () => void;
}

const createEmptyLayer = (layerNumber: number): UnpackLayer => ({
  id: generateId(),
  layerNumber,
  packerType: "",
  oep: "",
  unpackingMethod: "",
  outputType: "",
  tools: "",
  antiAnalysis: "",
  indicators: "",
  cleanedHash: "",
});

export function UnpackingLayers({
  unpackLayers,
  onUnpackLayersChange,
  onClearPacked,
}: UnpackingLayersProps) {
  const { t } = useLanguage();
  const { isExpanded, toggle, expand } = useExpandedState(STORAGE_KEYS.UNPACKING_STAGES);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [showLastLayerDialog, setShowLastLayerDialog] = useState(false);

  const reorderLayers = (fromIndex: number, toIndex: number) => {
    const reorderedLayers = [...unpackLayers];
    const [movedLayer] = reorderedLayers.splice(fromIndex, 1);
    reorderedLayers.splice(toIndex, 0, movedLayer);
    const renumberedLayers = reorderedLayers.map((layer, index) => ({ ...layer, layerNumber: index + 1 }));
    onUnpackLayersChange(renumberedLayers);
  };

  const { getDragProps } = useDragReorder(reorderLayers);

  const addLayer = useCallback(() => {
    const newLayerNumber = unpackLayers.length + 1;
    const newLayer = createEmptyLayer(newLayerNumber);
    onUnpackLayersChange([...unpackLayers, newLayer]);
    setExpandedLayers((prev) => new Set([...prev, newLayer.id]));
    expand();
  }, [unpackLayers, onUnpackLayersChange, expand]);

  const removeLayer = useCallback((layerId: string) => {
    if (unpackLayers.length === 1) {
      setShowLastLayerDialog(true);
      return;
    }
    const remainingLayers = unpackLayers
      .filter((layer) => layer.id !== layerId)
      .map((layer, index) => ({ ...layer, layerNumber: index + 1 }));
    onUnpackLayersChange(remainingLayers);
  }, [unpackLayers, onUnpackLayersChange]);

  const handleConfirmRemoveLastLayer = useCallback(() => {
    onUnpackLayersChange([]);
    onClearPacked?.();
    setShowLastLayerDialog(false);
  }, [onUnpackLayersChange, onClearPacked]);

  const updateLayer = useCallback((layerId: string, field: keyof UnpackLayer, value: string | number) => {
    onUnpackLayersChange(
      unpackLayers.map((layer) => (layer.id === layerId ? { ...layer, [field]: value } : layer))
    );
  }, [unpackLayers, onUnpackLayersChange]);

  const toggleLayerExpand = useCallback((layerId: string) => {
    setExpandedLayers((previousExpanded) => {
      const nextExpanded = new Set(previousExpanded);
      if (nextExpanded.has(layerId)) nextExpanded.delete(layerId);
      else nextExpanded.add(layerId);
      return nextExpanded;
    });
  }, []);

  return (
    <div className="space-y-2">
      <AlertDialog open={showLastLayerDialog} onOpenChange={setShowLastLayerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("code.unpacking.removeLastTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("code.unpacking.removeLastDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemoveLastLayer}>
              {t("common.confirm") || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SubSectionHeader
        title={t("code.unpacking")}
        icon={<Layers className="w-4 h-4" />}
        isExpanded={isExpanded}
        onToggle={toggle}
        count={unpackLayers.length}
        onAdd={addLayer}
      />

      <AnimatedCollapse isOpen={isExpanded} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm">
        {unpackLayers.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("code.unpacking.noStages")}</p>
        ) : (
          <div className="space-y-4">
            {unpackLayers.map((layer, index) => {
              const isLayerExpanded = expandedLayers.has(layer.id);
              const dragProps = getDragProps(index);
              
              return (
                <div
                  key={layer.id}
                  draggable={true}
                  onDragStart={() => dragProps.onDragStart(index)}
                  onDragOver={(e) => { e.preventDefault(); dragProps.onDragOver(index); }}
                  onDragEnd={dragProps.onDragEnd}
                  className={cn(
                    "bg-background/50 border border-border/50 rounded-sm overflow-hidden",
                    "transition-all duration-300 ease-standard",
                    "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
                    "hover:-translate-y-0.5 hover:scale-[1.01]",
                    "cursor-grab active:cursor-grabbing",
                    dragProps.isDragging && "opacity-50 scale-95 border-dashed",
                    dragProps.isDragOver && "border-primary border-2 bg-primary/10"
                  )}
                >
                  {/* Layer Header */}
                  <div 
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => toggleLayerExpand(layer.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-primary font-mono uppercase tracking-wider">
                        {t("code.unpacking.stage")} {layer.layerNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        className="p-1.5 rounded-sm text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title={t("code.unpacking.removeLayer")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronUp className={cn(
                        "w-4 h-4 text-primary transition-transform duration-200",
                        !isLayerExpanded && "rotate-180"
                      )} />
                    </div>
                  </div>

                  {/* Layer Content */}
                  {isLayerExpanded && (
                    <div className="p-4 animate-fade-in">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <FormField
                          label={t("code.unpacking.packerType")}
                          value={layer.packerType}
                          onChange={(v) => updateLayer(layer.id, "packerType", v)}
                          placeholder={t("code.unpacking.packerTypePlaceholder")}
                        />
                        <FormField
                          label={t("code.unpacking.oep")}
                          value={layer.oep}
                          onChange={(v) => updateLayer(layer.id, "oep", v)}
                          placeholder={t("code.unpacking.oepPlaceholder")}
                          mono
                        />
                        <FormField
                          label={t("code.unpacking.method")}
                          value={layer.unpackingMethod}
                          onChange={(v) => updateLayer(layer.id, "unpackingMethod", v)}
                          placeholder={t("code.unpacking.methodPlaceholder")}
                        />
                        <FormField
                          label={t("code.unpacking.outputType")}
                          value={layer.outputType}
                          onChange={(v) => updateLayer(layer.id, "outputType", v)}
                          placeholder={t("code.unpacking.outputTypePlaceholder")}
                        />
                        <FormField
                          label={t("code.unpacking.tools")}
                          value={layer.tools}
                          onChange={(v) => updateLayer(layer.id, "tools", v)}
                          placeholder={t("code.unpacking.toolsPlaceholder")}
                        />
                        <FormField
                          label={t("code.unpacking.antiAnalysis")}
                          value={layer.antiAnalysis}
                          onChange={(v) => updateLayer(layer.id, "antiAnalysis", v)}
                          placeholder={t("code.unpacking.antiAnalysisPlaceholder")}
                        />
                        <FormField
                          label={t("code.unpacking.indicators")}
                          value={layer.indicators}
                          onChange={(v) => updateLayer(layer.id, "indicators", v)}
                          placeholder={t("code.unpacking.indicatorsPlaceholder")}
                        />
                        <FormField
                          label={t("code.unpacking.cleanedHash")}
                          value={layer.cleanedHash}
                          onChange={(v) => updateLayer(layer.id, "cleanedHash", v)}
                          placeholder={t("code.unpacking.cleanedHashPlaceholder")}
                          mono
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AnimatedCollapse>
    </div>
  );
}

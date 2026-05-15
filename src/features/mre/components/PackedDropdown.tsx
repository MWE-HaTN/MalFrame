import { memo } from "react";
import { Package } from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import { PortalDropdown, DropdownOption } from "@/components/ui/portal-dropdown";
import type { UnpackLayer } from "@/types/dashboard";

interface PackedDropdownProps {
  isPacked: string;
  onPackedChange: (value: string) => void;
  unpackLayers: UnpackLayer[];
  onUnpackLayersChange: (layers: UnpackLayer[]) => void;
}

const packedOptions: DropdownOption[] = [
  { value: "", label: "Select...", icon: <Package className="w-4 h-4 text-muted-foreground" /> },
  { value: "yes", label: "Yes", icon: <Package className="w-4 h-4 text-warning" /> },
  { value: "no", label: "No", icon: <Package className="w-4 h-4 text-success" /> },
  { value: "unknown", label: "Unknown", icon: <Package className="w-4 h-4 text-muted-foreground" /> },
];

export const PackedDropdown = memo(function PackedDropdown({
  isPacked,
  onPackedChange,
  unpackLayers,
  onUnpackLayersChange,
}: PackedDropdownProps) {
  const handleChange = (value: string) => {
    onPackedChange(value);
    // Auto-add first layer when selecting "Yes" and no layers exist
    if (value === "yes" && unpackLayers.length === 0) {
      const newLayer: UnpackLayer = {
        id: generateId("layer"),
        layerNumber: 1,
        packerType: "",
        oep: "",
        unpackingMethod: "",
        outputType: "",
        tools: "",
        antiAnalysis: "",
        indicators: "",
        cleanedHash: "",
      };
      onUnpackLayersChange([newLayer]);
    }
  };

  const selectedOption = packedOptions.find((o) => o.value === isPacked);

  return (
    <PortalDropdown
      value={isPacked}
      onChange={handleChange}
      options={packedOptions}
      label={
        <>
          <Package className="w-3.5 h-3.5 text-primary" />
          PACKED?
        </>
      }
      renderTrigger={({ isOpen }) => (
        <div
          className={cn(
            "w-full flex items-center justify-between",
            "bg-input border border-primary/50 rounded-sm px-4 py-3",
            "text-sm font-mono transition-all duration-200",
            "hover:border-primary hover:bg-primary/5",
            isOpen && "border-primary ring-1 ring-primary/30 bg-primary/5"
          )}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span
              className={cn(
                "font-mono",
                isPacked === "yes"
                  ? "text-warning"
                  : isPacked === "no"
                    ? "text-success"
                    : isPacked
                      ? "text-foreground"
                      : "text-muted-foreground"
              )}
            >
              {selectedOption?.label || "Select..."}
            </span>
            {isPacked === "yes" && unpackLayers.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-warning/20 text-warning text-xs rounded-sm font-mono">
                {unpackLayers.length} {unpackLayers.length === 1 ? "layer" : "layers"}
              </span>
            )}
          </div>
          <svg
            className={cn(
              "w-4 h-4 text-primary transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      )}
      renderOption={(option, isSelected) => (
        <div
          className={cn(
            "w-full px-4 py-2.5 text-left text-sm font-mono transition-colors",
            "flex items-center gap-2",
            "hover:bg-primary/10 hover:text-primary",
            isSelected ? "bg-primary/20 text-primary" : "text-foreground"
          )}
        >
          {option.icon}
          {option.label}
        </div>
      )}
    />
  );
});

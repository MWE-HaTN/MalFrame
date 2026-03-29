import { memo } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalDropdown, DropdownOption } from "@/components/ui/portal-dropdown";

interface PackerSuspectedDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const packerOptions: DropdownOption[] = [
  { value: "", label: "Select..." },
  { value: "upx", label: "UPX" },
  { value: "aspack", label: "ASPack" },
  { value: "themida", label: "Themida / WinLicense" },
  { value: "pecompact", label: "PECompact" },
  { value: "vmprotect", label: "VMProtect" },
  { value: "obfuscators_dotnet", label: "Obfuscators (.NET: ConfuserEx / Eazfuscator)" },
  { value: "custom_loader", label: "Custom Loader / Custom Stub" },
];

export const PackerSuspectedDropdown = memo(function PackerSuspectedDropdown({ value, onChange }: PackerSuspectedDropdownProps) {
  return (
    <PortalDropdown
      value={value}
      onChange={onChange}
      options={packerOptions}
      maxHeight={256}
      label={
        <>
          <Package className="w-3.5 h-3.5 text-primary" />
          PACKER SUSPECTED
        </>
      }
      renderTrigger={({ selectedLabel, isOpen }) => (
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
            <span className={cn("font-mono", value ? "text-foreground" : "text-muted-foreground")}>
              {selectedLabel}
            </span>
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
          <Package
            className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")}
          />
          {option.label}
        </div>
      )}
    />
  );
});

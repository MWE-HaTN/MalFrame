import { memo, useMemo, useCallback } from "react";
import { Shield, Check, X, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Tooltip descriptions for each DLL mitigation
const MITIGATION_TOOLTIPS: Record<string, { title: string; lines: string[] }> = {
  ASLR: {
    title: "Address Space Layout Randomization.",
    lines: [
      "Enables randomization of image base at load time.",
      "Often disabled in custom loaders or legacy packers.",
    ],
  },
  DEP: {
    title: "Data Execution Prevention (NX compatibility).",
    lines: [
      "Prevents execution of data-only memory regions.",
      "Disabled binaries may rely on shellcode-style execution.",
    ],
  },
  CFG: {
    title: "Control Flow Guard.",
    lines: [
      "Enforces indirect call targets at runtime.",
      "Rarely enabled in custom malware; common in modern toolchains.",
    ],
  },
  HighEntropyVA: {
    title: "High Entropy Virtual Addressing (x64 only).",
    lines: [
      "Expands ASLR entropy on 64-bit systems.",
      "Typically enabled in modern 64-bit binaries.",
    ],
  },
  NoSEH: {
    title: "Disables Structured Exception Handling.",
    lines: [
      "Malware often relies on SEH for control flow or anti-analysis.",
      "Presence of SEH may indicate intentional use.",
    ],
  },
  ForceIntegrity: {
    title: "Requires signature validation before loading.",
    lines: [
      "Common in system or security-sensitive components.",
      "Rarely used in custom malware.",
    ],
  },
};

// Standard PE mitigations with architecture applicability
const DLL_MITIGATIONS = [
  { key: "ASLR", label: "ASLR", appliesTo: "all" },
  { key: "DEP", label: "DEP (NX)", appliesTo: "all" },
  { key: "CFG", label: "CFG", appliesTo: "64bit" }, // Control Flow Guard typically 64-bit
  { key: "HighEntropyVA", label: "High Entropy VA", appliesTo: "64bit" },
  { key: "NoSEH", label: "No SEH", appliesTo: "32bit" }, // SEH is 32-bit specific
  { key: "ForceIntegrity", label: "Force Integrity", appliesTo: "all" },
];

// Signature status options for dropdown
const SIGNATURE_OPTIONS = [
  { value: "signed_valid", label: "Signed (Valid)" },
  { value: "unsigned", label: "Unsigned" },
  { value: "unknown", label: "Unknown" },
  { value: "not_applicable", label: "Not Applicable" },
];

type MitigationState = "enabled" | "disabled" | "na";

interface SecurityPostureProps {
  signatureStatus: string;
  dllMitigations: string[];
  architecture?: "32bit" | "64bit" | "unknown";
  onSignatureChange?: (value: string) => void;
  onMitigationsChange?: (mitigations: string[]) => void;
}

// Signature dropdown selector
const SignatureDropdown = memo(function SignatureDropdown({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange?: (value: string) => void;
}) {
  const currentOption = SIGNATURE_OPTIONS.find(signatureOption => signatureOption.value === value) || SIGNATURE_OPTIONS[2]; // default to "unknown"
  
  return (
    <Select value={value || "unknown"} onValueChange={onChange}>
      <SelectTrigger className="w-48 h-9 font-mono text-sm bg-muted/50 border-border">
        <SelectValue placeholder="Select status">{currentOption.label}</SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {SIGNATURE_OPTIONS.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="font-mono text-sm"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

// Tri-state mitigation indicator - clickable to toggle
const MitigationIndicator = memo(function MitigationIndicator({ 
  label, 
  mitigationKey,
  state,
  onClick,
  disabled = false,
}: { 
  label: string;
  mitigationKey?: string;
  state: MitigationState;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const stateConfig = {
    enabled: {
      icon: Check,
      containerClass: "bg-muted/40 text-foreground border-border",
      indicatorClass: "bg-foreground/80 border-foreground/80",
      iconClass: "text-background",
      stateLabel: "Enabled",
    },
    disabled: {
      icon: X,
      containerClass: "bg-muted/20 text-muted-foreground border-border/50",
      indicatorClass: "bg-transparent border-muted-foreground/40",
      iconClass: "text-muted-foreground/60",
      stateLabel: "Disabled",
    },
    na: {
      icon: Minus,
      containerClass: "bg-muted/10 text-muted-foreground/50 border-border/30 cursor-not-allowed",
      indicatorClass: "bg-transparent border-muted-foreground/20",
      iconClass: "text-muted-foreground/40",
      stateLabel: "N/A",
    },
  };

  const config = stateConfig[state];
  const Icon = config.icon;
  const isClickable = state !== "na" && onClick && !disabled;
  const tooltip = mitigationKey ? MITIGATION_TOOLTIPS[mitigationKey] : null;

  const buttonContent = (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={state === "na" || disabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm font-mono transition-colors ${config.containerClass} ${isClickable ? "hover:bg-muted/60 cursor-pointer" : ""}`}
    >
      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${config.indicatorClass}`}>
        <Icon className={`w-3 h-3 ${config.iconClass}`} />
      </div>
      <span>{label}</span>
      {state === "na" && (
        <span className="text-[10px] text-muted-foreground/50 uppercase ml-1">(N/A)</span>
      )}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{tooltip.title}</p>
            {tooltip.lines.map((tooltipLine, lineIndex) => (
              <p key={lineIndex} className="text-muted-foreground text-xs">{tooltipLine}</p>
            ))}
            <p className="text-xs text-muted-foreground/70 italic pt-1">
              Status: {config.stateLabel}{isClickable ? " (click to toggle)" : ""}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
});

// Posture summary - neutral RE language
const PostureSummary = memo(function PostureSummary({ 
  enabledCount, 
  totalApplicable 
}: { 
  enabledCount: number; 
  totalApplicable: number;
}) {
  const ratio = totalApplicable > 0 ? enabledCount / totalApplicable : 0;
  
  let summary: string;
  if (ratio >= 0.8) {
    summary = "High Hardening";
  } else if (ratio >= 0.4) {
    summary = "Standard Hardening";
  } else {
    summary = "Low Hardening";
  }

  return (
    <div className="flex items-center gap-3 pt-2 border-t border-border/50">
      <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
        PE Hardening Posture
      </span>
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono rounded bg-muted/50 text-foreground border border-border">
        {summary}
      </span>
      <span className="text-xs text-muted-foreground font-mono">
        ({enabledCount}/{totalApplicable} applicable mitigations enabled)
      </span>
    </div>
  );
});

export const SecurityPosture = memo(function SecurityPosture({
  signatureStatus,
  dllMitigations,
  architecture = "unknown",
  onSignatureChange,
  onMitigationsChange,
}: SecurityPostureProps) {
  // Normalize mitigations for comparison
  const normalizedSelected = useMemo(() => 
    dllMitigations.map(mitigation => mitigation.toLowerCase()), 
    [dllMitigations]
  );
  
  // Determine mitigation state (enabled/disabled/na)
  const getMitigationState = useCallback((mitigation: typeof DLL_MITIGATIONS[0]): MitigationState => {
    // Check if mitigation is applicable to current architecture
    if (architecture !== "unknown") {
      if (mitigation.appliesTo === "32bit" && architecture === "64bit") return "na";
      if (mitigation.appliesTo === "64bit" && architecture === "32bit") return "na";
    }

    // Check if enabled
    const isEnabled = normalizedSelected.some(selectedMitigation =>
      selectedMitigation === mitigation.label.toLowerCase() ||
      selectedMitigation.includes(mitigation.key.toLowerCase()) ||
      selectedMitigation.includes(mitigation.label.toLowerCase().split(" ")[0])
    );

    return isEnabled ? "enabled" : "disabled";
  }, [architecture, normalizedSelected]);

  // Get custom mitigations (ones not in the standard list)
  const customMitigations = useMemo(() => 
    dllMitigations.filter(userMitigation => 
      !DLL_MITIGATIONS.some(standardMitigation => 
        standardMitigation.label.toLowerCase() === userMitigation.toLowerCase() ||
        userMitigation.toLowerCase().includes(standardMitigation.key.toLowerCase())
      )
    ),
    [dllMitigations]
  );

  // Calculate posture summary
  const { enabledCount, totalApplicable } = useMemo(() => {
    let enabled = 0;
    let applicable = 0;
    
    DLL_MITIGATIONS.forEach(mitigationDef => {
      const state = getMitigationState(mitigationDef);
      if (state !== "na") {
        applicable++;
        if (state === "enabled") enabled++;
      }
    });
    
    // Custom mitigations are always enabled and applicable
    enabled += customMitigations.length;
    applicable += customMitigations.length;
    
    return { enabledCount: enabled, totalApplicable: applicable };
  }, [getMitigationState, customMitigations]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
          Security Posture
        </span>
      </div>
      <div className="border border-border rounded-md bg-card/30 p-4 space-y-4">
        {/* Row 1: Digital Signature + DLL Mitigations - Horizontal layout */}
        <div className="flex flex-wrap items-start gap-12">
          {/* Digital Signature - Dropdown */}
          <div className="space-y-2 shrink-0">
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Digital Signature
            </span>
            <SignatureDropdown value={signatureStatus} onChange={onSignatureChange} />
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block w-px bg-border/60 self-stretch min-h-[3rem]" />

          {/* DLL Mitigations - Tri-state, inline */}
          <div className="space-y-2 flex-1 min-w-0">
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              DLL Characteristics / Mitigations
            </span>
            <TooltipProvider delayDuration={200}>
              <div className="flex flex-wrap gap-2">
                {DLL_MITIGATIONS.map((mitigation) => {
                  const state = getMitigationState(mitigation);
                  const handleToggle = () => {
                    if (!onMitigationsChange || state === "na") return;
                    
                    const isCurrentlyEnabled = state === "enabled";
                    if (isCurrentlyEnabled) {
                      // Remove from list
                      onMitigationsChange(dllMitigations.filter(existingMitigation => 
                        existingMitigation.toLowerCase() !== mitigation.label.toLowerCase() &&
                        !existingMitigation.toLowerCase().includes(mitigation.key.toLowerCase())
                      ));
                    } else {
                      // Add to list
                      onMitigationsChange([...dllMitigations, mitigation.label]);
                    }
                  };
                  
                  return (
                    <MitigationIndicator
                      key={mitigation.key}
                      label={mitigation.label}
                      mitigationKey={mitigation.key}
                      state={state}
                      onClick={handleToggle}
                      disabled={!onMitigationsChange}
                    />
                  );
                })}
                {/* Custom mitigations are always enabled */}
                {customMitigations.map((mitigation) => (
                  <MitigationIndicator
                    key={mitigation}
                    label={mitigation}
                    state="enabled"
                    onClick={() => {
                      if (!onMitigationsChange) return;
                      onMitigationsChange(dllMitigations.filter(m => m !== mitigation));
                    }}
                    disabled={!onMitigationsChange}
                  />
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>

        {/* Posture Summary */}
        <PostureSummary 
          enabledCount={enabledCount} 
          totalApplicable={totalApplicable} 
        />
      </div>
    </div>
  );
});

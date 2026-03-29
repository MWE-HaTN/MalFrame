/**
 * OSINT Lookup Section component for MRE Dashboard
 */

import { memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface OSINTLookupData {
  virusTotal: string;
  malwareBazaar: string;
  anyRun: string;
  tiNotes: string;
}

interface OSINTLookupSectionProps {
  data: OSINTLookupData;
  onChange: (data: Partial<OSINTLookupData>) => void;
}

export const OSINTLookupSection = memo(function OSINTLookupSection({
  data,
  onChange,
}: OSINTLookupSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      {/* Left: VirusTotal + MalwareBazaar */}
      <div>
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3">
          {t("mre.osintLookup")}
        </div>
        <div className="border border-border rounded-sm p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider w-40 shrink-0">
                {t("mre.virusTotal")}
              </span>
              <input
                type="text"
                value={data.virusTotal}
                onChange={(e) => onChange({ virusTotal: e.target.value })}
                placeholder={t("mre.placeholder.virusTotal")}
                className="flex-1 bg-transparent border-none px-0 py-1 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider w-40 shrink-0">
                {t("mre.malwareBazaar")}
              </span>
              <input
                type="text"
                value={data.malwareBazaar}
                onChange={(e) => onChange({ malwareBazaar: e.target.value })}
                placeholder={t("mre.placeholder.malwareBazaar")}
                className="flex-1 bg-transparent border-none px-0 py-1 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right: Any.Run + TI Notes */}
      <div>
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3 invisible">
          {t("mre.osintLookup")}
        </div>
        <div className="border border-border rounded-sm p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider w-40 shrink-0">
                {t("mre.anyRun")}
              </span>
              <input
                type="text"
                value={data.anyRun}
                onChange={(e) => onChange({ anyRun: e.target.value })}
                placeholder={t("mre.placeholder.anyRun")}
                className="flex-1 bg-transparent border-none px-0 py-1 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider w-40 shrink-0">
                {t("mre.tiNotes")}
              </span>
              <input
                type="text"
                value={data.tiNotes}
                onChange={(e) => onChange({ tiNotes: e.target.value })}
                placeholder={t("mre.placeholder.tiNotes")}
                className="flex-1 bg-transparent border-none px-0 py-1 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});


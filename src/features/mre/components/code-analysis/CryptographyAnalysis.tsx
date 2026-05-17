import { useMemo, memo } from "react";
import { Lock } from "lucide-react";
import { PortalDropdown, DropdownOption } from "@/components/ui/portal-dropdown";
import { EntryCard, FieldLabel, AutoTextarea, AccessibleField } from "@/features/mre/components/runtime-behavior/ui-components";
import { inputStyles } from "@/features/mre/components/runtime-behavior/styles";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { SubSectionHeader, useExpandedState, useListManager } from "./shared";
import { useDragReorder } from "@/hooks/useDragReorder";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { useLanguage } from "@/hooks/useLanguage";
import {
  CryptoEntry,
  CRYPTO_ALGORITHMS,
  createEmptyCryptoEntry
} from "./types";

interface CryptographyAnalysisProps {
  entries: CryptoEntry[];
  onChange: (entries: CryptoEntry[]) => void;
}

export const CryptographyAnalysis = memo(function CryptographyAnalysis({ entries, onChange }: CryptographyAnalysisProps) {
  const { t } = useLanguage();
  const { isExpanded, toggle, expand } = useExpandedState(STORAGE_KEYS.CODE_ANALYSIS_CRYPTO);

  const crypto = useListManager<CryptoEntry>(
    entries,
    onChange,
    { createEmpty: createEmptyCryptoEntry, onExpand: expand }
  );

  const { getDragProps } = useDragReorder(crypto.reorder);

  const algorithmOptions: DropdownOption[] = useMemo(() => 
    CRYPTO_ALGORITHMS.map(algorithm => ({ value: algorithm, label: algorithm })), 
  []);

  return (
    <div className="space-y-2">
      <SubSectionHeader
        title={t("codeAnalysis.crypto.title")}
        icon={<Lock className="w-4 h-4" />}
        isExpanded={isExpanded}
        onToggle={toggle}
        count={crypto.count}
        onAdd={crypto.add}
      />
      <AnimatedCollapse isOpen={isExpanded} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {crypto.isEmpty ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.crypto.noCrypto")}</p>
        ) : (
          crypto.items.map((cryptoEntry, entryIndex) => (
            <EntryCard
              key={cryptoEntry.id}
              onDelete={() => crypto.remove(cryptoEntry.id)}
              canDelete={!crypto.isEmpty}
              {...getDragProps(entryIndex)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel>{t("codeAnalysis.crypto.algorithms")}</FieldLabel>
                  <PortalDropdown
                    value={cryptoEntry.algorithm}
                    onChange={(newValue) => crypto.update(cryptoEntry.id, { algorithm: newValue })}
                    options={algorithmOptions}
                    placeholder={t("codeAnalysis.crypto.selectAlgorithm")}
                  />
                </div>
                <AccessibleField label={t("codeAnalysis.crypto.keyIv")}>
                  {(fieldId) => (
                    <input
                      id={fieldId}
                      name={fieldId}
                      type="text"
                      value={cryptoEntry.keyIv}
                      onChange={(changeEvent) => crypto.update(cryptoEntry.id, { keyIv: changeEvent.target.value })}
                      placeholder={t("codeAnalysis.crypto.keyIvPlaceholder")}
                      className={inputStyles}
                    />
                  )}
                </AccessibleField>
              </div>
              <AutoTextarea
                label={t("codeAnalysis.crypto.keyDerivation")}
                value={cryptoEntry.keyDerivation}
                onChange={(changeEvent) => crypto.update(cryptoEntry.id, { keyDerivation: changeEvent.target.value })}
                placeholder={t("codeAnalysis.crypto.keyDerivationPlaceholder")}
                allowImages
                images={cryptoEntry.images || []}
                onImagesChange={(newImages) => crypto.update(cryptoEntry.id, { images: newImages })}
              />
              <AccessibleField label={t("codeAnalysis.crypto.cryptoApis")}>
                {(fieldId) => (
                  <input
                    id={fieldId}
                    name={fieldId}
                    type="text"
                    value={cryptoEntry.cryptoApis}
                    onChange={(changeEvent) => crypto.update(cryptoEntry.id, { cryptoApis: changeEvent.target.value })}
                    placeholder={t("codeAnalysis.crypto.cryptoApisPlaceholder")}
                    className={inputStyles}
                  />
                )}
              </AccessibleField>
              <AccessibleField label={t("codeAnalysis.crypto.protectedData")}>
                {(fieldId) => (
                  <input
                    id={fieldId}
                    name={fieldId}
                    type="text"
                    value={cryptoEntry.protectedData}
                    onChange={(changeEvent) => crypto.update(cryptoEntry.id, { protectedData: changeEvent.target.value })}
                    placeholder={t("codeAnalysis.crypto.protectedDataPlaceholder")}
                    className={inputStyles}
                  />
                )}
              </AccessibleField>
              <AutoTextarea
                label={t("codeAnalysis.crypto.hypothesis")}
                value={cryptoEntry.analystHypothesis || ""}
                onChange={(changeEvent) => crypto.update(cryptoEntry.id, { analystHypothesis: changeEvent.target.value })}
                placeholder={t("codeAnalysis.crypto.hypothesisPlaceholder")}
              />
            </EntryCard>
          ))
        )}
      </AnimatedCollapse>
    </div>
  );
});


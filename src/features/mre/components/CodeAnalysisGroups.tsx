import { useState, useRef, useCallback, memo } from "react";
import { 
  Code, Bug, Layers, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutionStages, ExecutionStage } from "@/components/ExecutionStages";
import { LazyUnpackingLayers } from "@/components/lazy";
import type { UnpackLayer } from "@/types/dashboard";
import { 
  StaticCodeAnalysis, 
  DynamicCodeAnalysis, 
  CryptographyAnalysis,
  MicroBehaviorsSection,
  type StaticCodeAnalysisData,
  type DynamicCodeAnalysisData,
  type CryptoEntry,
} from "@/features/mre/components/code-analysis";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

// Group Header (collapsible main groups) - Unified style
interface GroupHeaderProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

function GroupHeader({ title, icon, isExpanded, onToggle }: GroupHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-sm border",
        "transition-all duration-300 ease-standard",
        "border-primary/30 bg-primary/10",
        "hover:border-primary/50 hover:bg-primary/15",
        "hover:shadow-md hover:shadow-primary/10"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-primary/20 text-primary">
          {icon}
        </div>
        <span className="text-sm font-mono uppercase tracking-widest font-medium text-primary">
          {title}
        </span>
      </div>
      <ChevronRight className={cn(
        "w-5 h-5 text-primary transition-all duration-300 ease-standard",
        isExpanded && "rotate-90"
      )} />
    </button>
  );
}

// Main data interfaces for Code Analysis section
export interface CodeAnalysisData {
  staticCodeAnalysis: StaticCodeAnalysisData;
  dynamicCodeAnalysis: DynamicCodeAnalysisData;
}

export interface DeepDiveData {
  executionStages: ExecutionStage[];
  cryptoEntries: CryptoEntry[];
  // Micro-behaviors mapping
  microBehaviors: { id: string; name: string; objectiveId: string; objectiveName: string }[];
}


interface CodeAnalysisGroupsProps {
  codeData: CodeAnalysisData;
  onCodeDataChange: (data: CodeAnalysisData) => void;
  deepDiveData: DeepDiveData;
  onDeepDiveDataChange: (data: DeepDiveData) => void;
  isPacked: string;
  unpackLayers: UnpackLayer[];
  onUnpackLayersChange: (layers: UnpackLayer[]) => void;
  onClearPacked: () => void;
}

export const CodeAnalysisGroups = memo(function CodeAnalysisGroups({
  codeData,
  onCodeDataChange,
  deepDiveData,
  onDeepDiveDataChange,
  isPacked,
  unpackLayers,
  onUnpackLayersChange,
  onClearPacked,
}: CodeAnalysisGroupsProps) {
  const { t } = useLanguage();
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  // Refs to avoid stale closures in onChange callbacks
  const codeDataRef = useRef(codeData);
  codeDataRef.current = codeData;
  const deepDiveDataRef = useRef(deepDiveData);
  deepDiveDataRef.current = deepDiveData;

  const toggleGroup = (groupNum: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupNum]: !prev[groupNum]
    }));
  };

  const handleStaticChange = useCallback((staticData: StaticCodeAnalysisData) => {
    onCodeDataChange({ ...codeDataRef.current, staticCodeAnalysis: staticData });
  }, [onCodeDataChange]);

  const handleDynamicChange = useCallback((dynamicData: DynamicCodeAnalysisData) => {
    onCodeDataChange({ ...codeDataRef.current, dynamicCodeAnalysis: dynamicData });
  }, [onCodeDataChange]);

  const handleStagesChange = useCallback((stages: ExecutionStage[]) => {
    onDeepDiveDataChange({ ...deepDiveDataRef.current, executionStages: stages });
  }, [onDeepDiveDataChange]);

  const handleCryptoChange = useCallback((entries: CryptoEntry[]) => {
    onDeepDiveDataChange({ ...deepDiveDataRef.current, cryptoEntries: entries });
  }, [onDeepDiveDataChange]);

  const handleBehaviorsChange = useCallback((behaviors: DeepDiveData['microBehaviors']) => {
    onDeepDiveDataChange({ ...deepDiveDataRef.current, microBehaviors: behaviors });
  }, [onDeepDiveDataChange]);

  return (
    <div className="space-y-3">
      {/* GROUP 1: STATIC CODE ANALYSIS */}
      <div className="space-y-2">
        <GroupHeader
          title={t("code.groups.static")}
          icon={<Code className="w-4 h-4" />}
          isExpanded={!!expandedGroups[1]}
          onToggle={() => toggleGroup(1)}
        />

        <AnimatedCollapse isOpen={!!expandedGroups[1]} className="ml-6">
          <StaticCodeAnalysis
            data={codeData.staticCodeAnalysis}
            onChange={handleStaticChange}
          />
        </AnimatedCollapse>
      </div>

      {/* GROUP 2: DYNAMIC CODE ANALYSIS */}
      <div className="space-y-2">
        <GroupHeader
          title={t("code.groups.dynamic")}
          icon={<Bug className="w-4 h-4" />}
          isExpanded={!!expandedGroups[2]}
          onToggle={() => toggleGroup(2)}
        />

        <AnimatedCollapse isOpen={!!expandedGroups[2]} className="ml-6">
          <DynamicCodeAnalysis
            data={codeData.dynamicCodeAnalysis}
            onChange={handleDynamicChange}
          />
        </AnimatedCollapse>
      </div>

      {/* GROUP 3: DEEP DIVE */}
      <div className="space-y-2">
        <GroupHeader
          title={t("code.groups.deepDive")}
          icon={<Layers className="w-4 h-4" />}
          isExpanded={!!expandedGroups[3]}
          onToggle={() => toggleGroup(3)}
        />

        <AnimatedCollapse isOpen={!!expandedGroups[3]} className="ml-6 space-y-4">
          {/* Unpacking Layers - Only shown when isPacked is "yes" */}
          {isPacked === "yes" && (
            <LazyUnpackingLayers
              unpackLayers={unpackLayers}
              onUnpackLayersChange={onUnpackLayersChange}
              onClearPacked={onClearPacked}
            />
          )}

          {/* Execution Stages */}
          <ExecutionStages
            stages={deepDiveData.executionStages}
            onStagesChange={handleStagesChange}
          />

          {/* Cryptography Analysis */}
          <CryptographyAnalysis
            entries={deepDiveData.cryptoEntries}
            onChange={handleCryptoChange}
          />

          {/* Micro-Behaviors */}
          <MicroBehaviorsSection
            selectedBehaviors={deepDiveData.microBehaviors}
            onBehaviorsChange={handleBehaviorsChange}
          />
        </AnimatedCollapse>
      </div>
    </div>
  );
});


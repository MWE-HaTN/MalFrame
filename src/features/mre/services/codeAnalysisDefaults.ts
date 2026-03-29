import { generateId } from "@/lib/utils";
import type { CodeAnalysisData, DeepDiveData } from "@/features/mre/components/CodeAnalysisGroups";

export const createInitialCodeAnalysisData = (): CodeAnalysisData => ({
  staticCodeAnalysis: {
    interestingFunctions: [],
    controlFlow: [],
    apiUsage: [],
    obfuscation: [],
  },
  dynamicCodeAnalysis: {
    breakpointEvents: [],
    memoryRegions: [],
    runtimeApiTrace: [],
    registerStack: [],
  },
});

export const createInitialDeepDiveData = (): DeepDiveData => ({
  executionStages: [
    {
      id: generateId(),
      stageNumber: 1,
      stageName: "Stage 1",
      entryPoint: "",
      entryCondition: "",
      purpose: "",
      actions: "",
      exitCondition: "",
      failureAbortBehavior: "",
      transitionMethod: "",
      apisUsed: "",
      artifacts: "",
      ioc: "",
    },
  ],
  cryptoEntries: [],
  microBehaviors: [],
});

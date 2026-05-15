import { memo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLanguage } from "@/hooks/useLanguage";
import type { GraphData } from "@/lib/graphBuilders";

// Custom tactic node — top-level grouping
function TacticNode({ data }: { data: { label: string; code: string; count: number } }) {
  return (
    <div className="bg-card border-2 border-primary rounded-md px-3 py-2 min-w-[160px] shadow-lg shadow-primary/10">
      <div className="text-[10px] font-mono text-accent mb-0.5">{data.code}</div>
      <div className="text-xs font-terminal text-primary tracking-wider uppercase leading-tight">
        {data.label}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">
        {data.count} technique{data.count !== 1 ? "s" : ""}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-primary !border-primary" />
    </div>
  );
}

// Custom technique node — child of tactic
function TechniqueNode({ data }: { data: { id: string; label: string } }) {
  return (
    <div className="bg-card/80 border border-border rounded-md px-3 py-1.5 min-w-[140px] shadow-md hover:border-primary/50 transition-colors">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-primary !border-primary" />
      <div className="text-[10px] font-mono text-accent">{data.id}</div>
      <div className="text-xs font-mono text-foreground/80 leading-tight truncate max-w-[180px]" title={data.label}>
        {data.label}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  tacticNode: TacticNode,
  techniqueNode: TechniqueNode,
};

interface GraphViewProps {
  data: GraphData;
  className?: string;
}

export const GraphView = memo(function GraphView({ data, className }: GraphViewProps) {
  const { t } = useLanguage();

  const { nodes, edges } = data;

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className ?? "h-[400px]"}`}>
        <p className="text-sm text-muted-foreground font-mono">{t("graph.noData")}</p>
      </div>
    );
  }

  return (
    <div className={className ?? "h-[400px] border border-border rounded-md overflow-hidden bg-background"}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} className="!bg-background" />
        <Controls className="!bg-card !border-border !shadow-md" />
        <MiniMap
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-card !border-border"
        />
      </ReactFlow>
    </div>
  );
});

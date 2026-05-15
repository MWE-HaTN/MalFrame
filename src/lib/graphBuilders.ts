/**
 * Build ReactFlow nodes/edges from MITRE ATT&CK mapping data.
 */
import type { Node, Edge } from "@xyflow/react";

interface Technique {
  id: string;
  name: string;
  fullName?: string;
}

interface MitreMapping {
  [tacticId: string]: Technique[];
}

interface TacticInfo {
  id: string;
  name: string;
  code: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

// Deterministic layout: tactics in columns, techniques stacked below
export function buildMitreGraph(
  mapping: MitreMapping,
  tactics: TacticInfo[],
): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const tacticIds = Object.keys(mapping).filter(
    (k) => mapping[k] && mapping[k].length > 0,
  );

  if (tacticIds.length === 0) return { nodes, edges };

  const TACTIC_GAP = 220;
  const TECH_GAP = 60;
  const TACTIC_Y = 0;
  const TECH_Y_START = 100;

  tacticIds.forEach((tacticId, col) => {
    const tactic = tactics.find((t) => t.id === tacticId);
    const techniques = mapping[tacticId];
    const x = col * TACTIC_GAP;

    // Tactic node
    nodes.push({
      id: `tactic-${tacticId}`,
      type: "tacticNode",
      position: { x, y: TACTIC_Y },
      data: {
        label: tactic?.name || tacticId,
        code: tactic?.code || "",
        count: techniques.length,
      },
    });

    // Technique nodes
    techniques.forEach((tech, row) => {
      const techId = `tech-${tacticId}-${tech.id}`;
      nodes.push({
        id: techId,
        type: "techniqueNode",
        position: { x, y: TECH_Y_START + row * TECH_GAP },
        data: {
          id: tech.id,
          label: tech.fullName || tech.name,
        },
      });

      edges.push({
        id: `edge-${tacticId}-${tech.id}`,
        source: `tactic-${tacticId}`,
        target: techId,
        animated: false,
      });
    });
  });

  return { nodes, edges };
}

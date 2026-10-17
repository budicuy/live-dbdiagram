import dagre from "@dagrejs/dagre";
import type { DatabaseSchema, NodePosition } from "../types/schema";

const NODE_WIDTH = 260;
const ROW_HEIGHT = 30;
const HEADER_HEIGHT = 46;
const PADDING = 20;

export function computeAutoLayout(
  schema: DatabaseSchema,
  direction: "LR" | "TB" = "LR",
): Record<string, NodePosition> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const nameToId = new Map<string, string>();

  for (const table of schema.tables) {
    const colCount = Math.max(table.columns.length, 1);
    const estimatedHeight = HEADER_HEIGHT + colCount * ROW_HEIGHT + PADDING;

    g.setNode(table.id, {
      width: NODE_WIDTH,
      height: estimatedHeight,
    });
    nameToId.set(table.name, table.id);
    if (table.alias) {
      nameToId.set(table.alias, table.id);
    }
  }

  for (const rel of schema.relations) {
    const srcId = nameToId.get(rel.sourceTable) || rel.sourceTable;
    const tgtId = nameToId.get(rel.targetTable) || rel.targetTable;
    if (g.hasNode(srcId) && g.hasNode(tgtId)) {
      g.setEdge(srcId, tgtId);
    }
  }

  dagre.layout(g);

  const positions: Record<string, NodePosition> = {};
  for (const table of schema.tables) {
    const node = g.node(table.id);
    if (node) {
      // dagre gives center coordinates; convert to top-left for React Flow
      positions[table.id] = {
        x: Math.round(node.x - node.width / 2),
        y: Math.round(node.y - node.height / 2),
      };
    } else {
      positions[table.id] = { x: 50, y: 50 };
    }
  }

  return positions;
}

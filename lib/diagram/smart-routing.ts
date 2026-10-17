import type { Edge } from "@xyflow/react";
import type { RelationDefinition } from "../types/schema";

export interface NodePositionInfo {
  id: string;
  position: { x: number; y: number };
  measured?: { width?: number; height?: number };
  data?: {
    table?: {
      id?: string;
      name?: string;
    };
  };
}

/**
 * Extracts the base column name from handle ID (e.g. "user_id-right" -> "user_id")
 */
export function extractColumnName(handleId: string | null | undefined): string {
  if (!handleId) return "";
  return handleId.replace(/-(left|right)$/, "");
}

/**
 * Dynamically computes optimal nearest-side handles for ERD relations.
 * Prevents 180° loops and connects cables directly to closest facing sides.
 */
export function computeSmartEdges(
  relations: RelationDefinition[],
  nodes: NodePositionInfo[],
  selectedRelationId?: string | null,
): Edge[] {
  const nodeMap = new Map<string, NodePositionInfo>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
    const tbl = node.data?.table;
    if (tbl?.id) {
      nodeMap.set(tbl.id, node);
    }
    if (tbl?.name) {
      nodeMap.set(tbl.name, node);
    }
  }

  return relations.map((rel) => {
    const isSelf = rel.sourceTable === rel.targetTable;

    if (isSelf) {
      return {
        id: rel.id,
        source: rel.sourceTable,
        sourceHandle: `${rel.sourceColumn}-right`,
        target: rel.targetTable,
        targetHandle: `${rel.targetColumn}-right`,
        type: "customEdge",
        data: {
          cardinality: rel.cardinality,
          relationId: rel.id,
          isSelf: true,
          inverted: false,
        },
        selected: selectedRelationId === rel.id,
      };
    }

    const nodeA = nodeMap.get(rel.sourceTable);
    const nodeB = nodeMap.get(rel.targetTable);

    const posA = nodeA?.position ?? { x: 0, y: 0 };
    const widthA = nodeA?.measured?.width ?? 260;
    const centerA = posA.x + widthA / 2;

    const posB = nodeB?.position ?? { x: 0, y: 0 };
    const widthB = nodeB?.measured?.width ?? 260;
    const centerB = posB.x + widthB / 2;

    let sourceHandle: string;
    let targetHandle: string;
    let inverted = false;

    if (centerA < centerB) {
      // Source table is to the left of Target table:
      // Edge leaves right of source, enters left of target
      sourceHandle = `${rel.sourceColumn}-right`;
      targetHandle = `${rel.targetColumn}-left`;
      inverted = false;
    } else {
      // Source table is to the right of Target table:
      // Edge leaves left of source, enters right of target
      sourceHandle = `${rel.sourceColumn}-left`;
      targetHandle = `${rel.targetColumn}-right`;
      inverted = true;
    }

    return {
      id: rel.id,
      source: rel.sourceTable,
      sourceHandle,
      target: rel.targetTable,
      targetHandle,
      type: "customEdge",
      data: {
        cardinality: rel.cardinality,
        relationId: rel.id,
        isSelf: false,
        inverted,
      },
      selected: selectedRelationId === rel.id,
    };
  });
}

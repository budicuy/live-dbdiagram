"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";
import type React from "react";
import { memo } from "react";
import { useProjectStore } from "../../lib/store/use-project-store";
import type { Cardinality } from "../../lib/types/schema";
import { cn } from "../../lib/utils";

interface CustomEdgeData {
  cardinality?: Cardinality;
  relationId?: string;
}

export const CustomEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    data,
  }: EdgeProps) => {
    const edgeData = data as CustomEdgeData | undefined;
    const setSelectedRelationId = useProjectStore(
      (s) => s.setSelectedRelationId,
    );

    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 16,
    });

    const getCardinalityLabel = (card?: Cardinality) => {
      switch (card) {
        case "one-to-one":
          return "1 : 1";
        case "one-to-many":
          return "1 : N";
        case "many-to-one":
          return "N : 1";
        case "many-to-many":
          return "N : M";
        default:
          return "N : 1";
      }
    };

    const handleEdgeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (edgeData?.relationId) {
        setSelectedRelationId(edgeData.relationId);
      }
    };

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          className={cn(
            "transition-colors cursor-pointer",
            selected
              ? "!stroke-blue-500 !stroke-[2.5px]"
              : "!stroke-slate-400 dark:!stroke-slate-600 hover:!stroke-blue-400",
          )}
        />
        <EdgeLabelRenderer>
          <button
            type="button"
            onClick={handleEdgeClick}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border shadow-xs transition-all",
              selected
                ? "bg-blue-500 text-white border-blue-600 shadow-blue-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400",
            )}
          >
            {getCardinalityLabel(edgeData?.cardinality)}
          </button>
        </EdgeLabelRenderer>
      </>
    );
  },
);

CustomEdge.displayName = "CustomEdge";

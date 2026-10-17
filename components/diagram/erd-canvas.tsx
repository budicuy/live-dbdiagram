"use client";

import {
  Background,
  BackgroundVariant,
  type Connection,
  ConnectionMode,
  Controls,
  type Edge,
  type EdgeChange,
  MiniMap,
  type Node,
  ReactFlow,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";
import {
  computeSmartEdges,
  extractColumnName,
} from "../../lib/diagram/smart-routing";
import { useProjectStore } from "../../lib/store/use-project-store";
import { CustomEdge } from "./custom-edge";
import { TableNode } from "./table-node";

const nodeTypes = {
  tableNode: TableNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

export function ErdCanvas() {
  const project = useProjectStore((s) => s.project);
  const selectedTableId = useProjectStore((s) => s.selectedTableId);
  const selectedRelationId = useProjectStore((s) => s.selectedRelationId);
  const updateTablePosition = useProjectStore((s) => s.updateTablePosition);
  const addRelation = useProjectStore((s) => s.addRelation);
  const deleteRelation = useProjectStore((s) => s.deleteRelation);
  const setSelectedTableId = useProjectStore((s) => s.setSelectedTableId);
  const setSelectedRelationId = useProjectStore((s) => s.setSelectedRelationId);
  const theme = useProjectStore((s) => s.ui.theme);
  const showMinimap = useProjectStore((s) => s.ui.showMinimap);
  const minimapPosition = useProjectStore((s) => s.ui.minimapPosition);
  const showControls = useProjectStore((s) => s.ui.showControls);
  const controlsPosition = useProjectStore((s) => s.ui.controlsPosition);

  // Transform tables to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!project) return [];
    return project.schema.tables.map((table) => {
      const pos = project.metadata.positions[table.name] ||
        project.metadata.positions[table.id] || { x: 100, y: 100 };

      return {
        id: table.name,
        type: "tableNode",
        position: pos,
        data: { table },
        selected: selectedTableId === table.name,
      };
    });
  }, [project, selectedTableId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Sync internal nodes state when project tables change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Dynamically compute smart nearest-side edges based on live node positions
  const edges: Edge[] = useMemo(() => {
    if (!project) return [];
    return computeSmartEdges(
      project.schema.relations,
      nodes,
      selectedRelationId,
    );
  }, [project, nodes, selectedRelationId]);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === "remove") {
          deleteRelation(change.id);
        }
      }
    },
    [deleteRelation],
  );

  // When node drag finishes, persist position in store
  const onNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      updateTablePosition(node.id, {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      });
    },
    [updateTablePosition],
  );

  // Validate connections before they can be dropped
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (!connection.source || !connection.target) return false;
      if (!connection.sourceHandle || !connection.targetHandle) return false;

      const sourceColName = extractColumnName(connection.sourceHandle);
      const targetColName = extractColumnName(connection.targetHandle);

      // 1. Cannot connect column to itself
      if (
        connection.source === connection.target &&
        sourceColName === targetColName
      ) {
        return false;
      }

      const tables = project?.schema.tables || [];
      const sourceTable = tables.find(
        (t) => t.name === connection.source || t.id === connection.source,
      );
      const targetTable = tables.find(
        (t) => t.name === connection.target || t.id === connection.target,
      );

      if (!sourceTable || !targetTable) return false;

      const sourceCol = sourceTable.columns.find(
        (c) => c.name === sourceColName,
      );
      const targetCol = targetTable.columns.find(
        (c) => c.name === targetColName,
      );

      if (!sourceCol || !targetCol) return false;

      // 2. If same table (self-reference), at least one column MUST be a Primary Key (e.g. parent_id -> id)
      if (connection.source === connection.target) {
        const hasPk = sourceCol.pk || targetCol.pk;
        if (!hasPk) {
          return false;
        }
      }

      // 3. Prevent duplicate relations
      const existingRelations = project?.schema.relations || [];
      const isDuplicate = existingRelations.some(
        (r) =>
          (r.sourceTable === connection.source &&
            r.sourceColumn === sourceColName &&
            r.targetTable === connection.target &&
            r.targetColumn === targetColName) ||
          (r.sourceTable === connection.target &&
            r.sourceColumn === targetColName &&
            r.targetTable === connection.source &&
            r.targetColumn === sourceColName),
      );

      if (isDuplicate) {
        return false;
      }

      return true;
    },
    [project],
  );

  // Connect handle to handle to form a foreign key relation
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) return;
      if (!connection.source || !connection.target) return;
      if (!connection.sourceHandle || !connection.targetHandle) return;

      const sourceColName = extractColumnName(connection.sourceHandle);
      const targetColName = extractColumnName(connection.targetHandle);

      const tables = project?.schema.tables || [];
      const sourceTable = tables.find(
        (t) => t.name === connection.source || t.id === connection.source,
      );
      const targetTable = tables.find(
        (t) => t.name === connection.target || t.id === connection.target,
      );

      const sourceCol = sourceTable?.columns.find(
        (c) => c.name === sourceColName,
      );
      const targetCol = targetTable?.columns.find(
        (c) => c.name === targetColName,
      );

      // If source is PK and target is not, normalize so FK points to PK (standard N:1)
      let finalSource = connection.source;
      let finalSourceHandle = sourceColName;
      let finalTarget = connection.target;
      let finalTargetHandle = targetColName;

      if (sourceCol?.pk && !targetCol?.pk) {
        finalSource = connection.target;
        finalSourceHandle = targetColName;
        finalTarget = connection.source;
        finalTargetHandle = sourceColName;
      }

      addRelation({
        sourceTable: finalSource,
        sourceColumn: finalSourceHandle,
        targetTable: finalTarget,
        targetColumn: finalTargetHandle,
        cardinality: "many-to-one",
      });
    },
    [addRelation, isValidConnection, project],
  );

  const onPaneClick = useCallback(() => {
    setSelectedTableId(null);
    setSelectedRelationId(null);
  }, [setSelectedTableId, setSelectedRelationId]);

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnection}
        onPaneClick={onPaneClick}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "customEdge",
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.5}
          color={theme === "dark" ? "#334155" : "#cbd5e1"}
        />
        {showControls && (
          <Controls
            position={controlsPosition}
            showInteractive={false}
            className={`!m-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden ${
              showMinimap && controlsPosition === minimapPosition
                ? controlsPosition.startsWith("bottom")
                  ? "!mb-[168px]"
                  : "!mt-[168px]"
                : ""
            }`}
          />
        )}
        {showMinimap && (
          <MiniMap
            position={minimapPosition}
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!w-[200px] !h-[140px] !m-4 !bg-white/90 dark:!bg-slate-900/90 !border !border-slate-200 dark:!border-slate-800 rounded-lg overflow-hidden shadow-sm backdrop-blur-xs"
            nodeColor={() => (theme === "dark" ? "#3b82f6" : "#60a5fa")}
            maskColor={
              theme === "dark"
                ? "rgba(15, 23, 42, 0.7)"
                : "rgba(241, 245, 249, 0.7)"
            }
          />
        )}
      </ReactFlow>
    </div>
  );
}

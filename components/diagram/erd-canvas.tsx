"use client";

import {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";
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
  const setSelectedTableId = useProjectStore((s) => s.setSelectedTableId);
  const setSelectedRelationId = useProjectStore((s) => s.setSelectedRelationId);
  const theme = useProjectStore((s) => s.ui.theme);

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

  // Transform relations to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!project) return [];
    return project.schema.relations.map((rel) => ({
      id: rel.id,
      source: rel.sourceTable,
      sourceHandle: rel.sourceColumn,
      target: rel.targetTable,
      targetHandle: rel.targetColumn,
      type: "customEdge",
      data: {
        cardinality: rel.cardinality,
        relationId: rel.id,
      },
      selected: selectedRelationId === rel.id,
    }));
  }, [project, selectedRelationId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync internal state when project changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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

  // Connect handle to handle to form a foreign key relation
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (!connection.sourceHandle || !connection.targetHandle) return;

      addRelation({
        sourceTable: connection.source,
        sourceColumn: connection.sourceHandle,
        targetTable: connection.target,
        targetColumn: connection.targetHandle,
        cardinality: "many-to-one",
      });
    },
    [addRelation],
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
        <Controls
          showInteractive={false}
          className="!bottom-4 !right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bottom-4 !left-4 !bg-white/80 dark:!bg-slate-900/80 !border !border-slate-200 dark:!border-slate-800 rounded-lg overflow-hidden backdrop-blur-xs"
          nodeColor={() => (theme === "dark" ? "#3b82f6" : "#60a5fa")}
          maskColor={
            theme === "dark"
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(241, 245, 249, 0.7)"
          }
        />
      </ReactFlow>
    </div>
  );
}

"use client";

import { Handle, Position } from "@xyflow/react";
import { Key, Plus, Table2, Trash2 } from "lucide-react";
import type React from "react";
import { memo } from "react";
import { useProjectStore } from "../../lib/store/use-project-store";
import type { TableDefinition } from "../../lib/types/schema";
import { cn } from "../../lib/utils";

interface TableNodeProps {
  id: string;
  data: {
    table: TableDefinition;
    isReferenced?: boolean;
  };
  selected?: boolean;
}

export const TableNode = memo(({ data, selected }: TableNodeProps) => {
  const { table } = data;
  const setSelectedTableId = useProjectStore((s) => s.setSelectedTableId);
  const deleteTable = useProjectStore((s) => s.deleteTable);
  const addColumn = useProjectStore((s) => s.addColumn);

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTableId(table.name);
  };

  const handleAddColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    addColumn(table.name);
  };

  const handleDeleteTable = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Hapus tabel '${table.name}'?`)) {
      deleteTable(table.name);
    }
  };

  return (
    <div
      onClick={handleNodeClick}
      className={cn(
        "group min-w-[240px] max-w-[320px] rounded-lg border bg-white dark:bg-slate-900 shadow-md transition-all select-none text-xs",
        selected
          ? "border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/10 shadow-lg"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 rounded-t-lg">
        <div className="flex items-center gap-2 overflow-hidden">
          <Table2 className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate text-[13px]">
            {table.name}
          </span>
          {table.alias && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              {table.alias}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="Tambah kolom"
            onClick={handleAddColumn}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Hapus tabel"
            onClick={handleDeleteTable}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Columns List */}
      <div className="py-1 divide-y divide-slate-100 dark:divide-slate-800/50">
        {table.columns.map((col) => (
          <div
            key={col.id}
            className="relative flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            {/* Target Handle (Left) */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${col.name}-left`}
              className="!w-2 !h-2 !-left-1 !bg-blue-500 !border-white dark:!border-slate-900"
            />

            {/* Left: Key & Name */}
            <div className="flex items-center gap-1.5 overflow-hidden pr-2">
              {col.pk ? (
                <span title="Primary Key">
                  <Key className="w-3 h-3 text-amber-500 shrink-0" />
                </span>
              ) : (
                <span className="w-3" />
              )}
              <span
                className={cn(
                  "font-mono truncate",
                  col.pk
                    ? "font-semibold text-slate-900 dark:text-slate-100"
                    : "text-slate-700 dark:text-slate-300",
                )}
                title={col.name}
              >
                {col.name}
              </span>
            </div>

            {/* Right: Type & Constraints */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                {col.type}
              </span>
              {col.notNull && !col.pk && (
                <span
                  title="NOT NULL"
                  className="text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                >
                  NN
                </span>
              )}
              {col.unique && !col.pk && (
                <span
                  title="UNIQUE"
                  className="text-[9px] font-mono px-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                >
                  UQ
                </span>
              )}
            </div>

            {/* Source Handle (Right) */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${col.name}-right`}
              className="!w-2 !h-2 !-right-1 !bg-blue-500 !border-white dark:!border-slate-900"
            />
          </div>
        ))}

        {table.columns.length === 0 && (
          <div className="px-3 py-2 text-center text-slate-400 italic text-[11px]">
            Belum ada kolom
          </div>
        )}
      </div>
    </div>
  );
});

TableNode.displayName = "TableNode";

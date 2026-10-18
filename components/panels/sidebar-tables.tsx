"use client";

import { Key, Link2, Plus, Search, Table2, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "../../lib/store/use-project-store";
import { cn } from "../../lib/utils";

export function SidebarTables() {
  const ui = useProjectStore((s) => s.ui);
  const toggleSidebar = useProjectStore((s) => s.toggleSidebar);
  const project = useProjectStore((s) => s.project);
  const selectedTableId = useProjectStore((s) => s.selectedTableId);
  const selectAndNavigateTable = useProjectStore(
    (s) => s.selectAndNavigateTable,
  );
  const addTable = useProjectStore((s) => s.addTable);
  const deleteTable = useProjectStore((s) => s.deleteTable);

  const [searchQuery, setSearchQuery] = useState("");

  const tables = project?.schema.tables || [];
  const relations = project?.schema.relations || [];

  // Auto scroll to selected table item in sidebar list
  useEffect(() => {
    if (!selectedTableId || !ui.sidebarOpen) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`sidebar-table-${selectedTableId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [selectedTableId, ui.sidebarOpen]);

  // Filter tables by table name or column names
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const q = searchQuery.toLowerCase().trim();
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.columns.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.type.toLowerCase().includes(q),
        ),
    );
  }, [tables, searchQuery]);

  if (!ui.sidebarOpen) return null;

  return (
    <div className="flex flex-col w-64 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 text-xs select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <Table2 className="w-4 h-4 text-blue-500" />
          <span>Tabel ({tables.length})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Tambah Tabel Baru"
            onClick={() => addTable()}
            className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tabel</span>
          </button>
          <button
            type="button"
            title="Tutup Panel Tabel"
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tabel atau kolom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden transition-all text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 p-1">
        {filteredTables.map((t) => {
          const isSelected = selectedTableId === t.name;
          const pkCols = t.columns.filter((c) => c.pk);
          const hasRelations = relations.some(
            (r) => r.sourceTable === t.name || r.targetTable === t.name,
          );

          return (
            <div
              key={t.id}
              id={`sidebar-table-${t.name}`}
              onClick={() =>
                selectAndNavigateTable(t.name, undefined, { focusCanvas: true })
              }
              className={cn(
                "group flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors",
                isSelected
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60",
              )}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Table2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <div className="truncate">
                  <div className="truncate font-mono">{t.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-normal">
                    <span>{t.columns.length} kolom</span>
                    {pkCols.length > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Key className="w-2.5 h-2.5" />
                        {pkCols.map((c) => c.name).join(", ")}
                      </span>
                    )}
                    {hasRelations && (
                      <span
                        className="flex items-center gap-0.5 text-blue-400"
                        title="Memiliki relasi"
                      >
                        <Link2 className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                title="Hapus tabel"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Hapus tabel '${t.name}'?`)) {
                    deleteTable(t.name);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="p-4 text-center text-slate-400 italic">
            Tidak ada tabel ditemukan
          </div>
        )}
      </div>
    </div>
  );
}

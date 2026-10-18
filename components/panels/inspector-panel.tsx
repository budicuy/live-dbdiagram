"use client";

import { Check, Database, Plus, Sliders, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useProjectStore } from "../../lib/store/use-project-store";
import type { Cardinality } from "../../lib/types/schema";
import { cn } from "../../lib/utils";

const COMMON_DATA_TYPES = [
  "integer",
  "bigint",
  "smallint",
  "serial",
  "varchar(255)",
  "varchar(100)",
  "varchar(50)",
  "text",
  "boolean",
  "timestamp",
  "timestamptz",
  "date",
  "time",
  "decimal(10,2)",
  "numeric",
  "float",
  "double",
  "json",
  "jsonb",
  "uuid",
];

export function InspectorPanel() {
  const ui = useProjectStore((s) => s.ui);
  const toggleInspector = useProjectStore((s) => s.toggleInspector);
  const project = useProjectStore((s) => s.project);
  const selectedTableId = useProjectStore((s) => s.selectedTableId);
  const selectedColumnName = useProjectStore((s) => s.selectedColumnName);
  const selectedRelationId = useProjectStore((s) => s.selectedRelationId);
  const selectAndNavigateTable = useProjectStore(
    (s) => s.selectAndNavigateTable,
  );

  const renameTable = useProjectStore((s) => s.renameTable);
  const deleteTable = useProjectStore((s) => s.deleteTable);
  const addColumn = useProjectStore((s) => s.addColumn);
  const updateColumn = useProjectStore((s) => s.updateColumn);
  const deleteColumn = useProjectStore((s) => s.deleteColumn);
  const deleteRelation = useProjectStore((s) => s.deleteRelation);
  const updateSchema = useProjectStore((s) => s.updateSchema);

  const [tableNameInput, setTableNameInput] = useState("");
  const [editingTableName, setEditingTableName] = useState(false);

  // Automatically scroll and focus the selected column input in the inspector
  useEffect(() => {
    if (!selectedColumnName || !ui.inspectorOpen) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`inspector-col-${selectedColumnName}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        const input = el.querySelector("input");
        if (input && document.activeElement !== input) {
          input.focus();
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [selectedColumnName, ui.inspectorOpen]);

  if (!ui.inspectorOpen) return null;

  const currentTable = project?.schema.tables.find(
    (t) => t.name === selectedTableId || t.id === selectedTableId,
  );

  const currentRelation = project?.schema.relations.find(
    (r) => r.id === selectedRelationId,
  );

  // Table renaming handlers
  const startEditingTableName = () => {
    if (currentTable) {
      setTableNameInput(currentTable.name);
      setEditingTableName(true);
    }
  };

  const saveEditingTableName = () => {
    if (currentTable && tableNameInput.trim()) {
      renameTable(currentTable.name, tableNameInput.trim());
      setEditingTableName(false);
    }
  };

  return (
    <div className="flex flex-col w-80 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <Sliders className="w-4 h-4 text-blue-500" />
          <span>
            {currentTable
              ? `Tabel: ${currentTable.name}`
              : currentRelation
                ? "Detail Relasi"
                : "Inspektor Database"}
          </span>
        </div>

        <button
          type="button"
          title="Tutup Panel Inspektor"
          onClick={toggleInspector}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body: Table Inspector */}
      {currentTable && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Table Details */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Nama Tabel
            </div>
            {editingTableName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tableNameInput}
                  onChange={(e) => setTableNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEditingTableName()}
                  className="flex-1 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-blue-500 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={saveEditingTableName}
                  className="p-1.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={startEditingTableName}
                className="px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs cursor-pointer hover:border-blue-400 transition-colors"
                title="Klik untuk mengubah nama tabel"
              >
                {currentTable.name}
              </div>
            )}
          </div>

          {/* Columns Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Kolom ({currentTable.columns.length})
              </div>
              <button
                type="button"
                onClick={() => addColumn(currentTable.name)}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-[11px] font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Kolom</span>
              </button>
            </div>

            <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
              {currentTable.columns.map((col) => {
                const isColSelected = selectedColumnName === col.name;
                return (
                  <div
                    key={col.id}
                    id={`inspector-col-${col.name}`}
                    className={cn(
                      "pt-2 pb-1 px-1.5 rounded-md space-y-2 transition-all",
                      isColSelected
                        ? "bg-blue-50/90 dark:bg-blue-950/50 ring-1 ring-blue-500/40 shadow-xs"
                        : "",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {/* Column Name */}
                      <input
                        type="text"
                        value={col.name}
                        onFocus={() =>
                          selectAndNavigateTable(currentTable.name, col.name)
                        }
                        onChange={(e) =>
                          updateColumn(currentTable.name, col.id, {
                            name: e.target.value,
                          })
                        }
                        placeholder="Nama kolom"
                        className="flex-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                      />

                      {/* Column Type with datalist */}
                      <input
                        type="text"
                        list={`types_${col.id}`}
                        value={col.type}
                        onChange={(e) =>
                          updateColumn(currentTable.name, col.id, {
                            type: e.target.value,
                          })
                        }
                        className="w-28 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                      <datalist id={`types_${col.id}`}>
                        {COMMON_DATA_TYPES.map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>

                      {/* Delete Column Button */}
                      <button
                        type="button"
                        title="Hapus kolom"
                        onClick={() => deleteColumn(currentTable.name, col.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Column Constraints Toggles */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(col.pk)}
                          onChange={(e) =>
                            updateColumn(currentTable.name, col.id, {
                              pk: e.target.checked,
                            })
                          }
                          className="rounded text-blue-500"
                        />
                        <span
                          className={cn(
                            col.pk && "font-semibold text-amber-500",
                          )}
                        >
                          PK
                        </span>
                      </label>

                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(col.notNull)}
                          onChange={(e) =>
                            updateColumn(currentTable.name, col.id, {
                              notNull: e.target.checked,
                            })
                          }
                          className="rounded text-blue-500"
                        />
                        <span>Not Null</span>
                      </label>

                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(col.unique)}
                          onChange={(e) =>
                            updateColumn(currentTable.name, col.id, {
                              unique: e.target.checked,
                            })
                          }
                          className="rounded text-blue-500"
                        />
                        <span>Unique</span>
                      </label>

                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(col.increment)}
                          onChange={(e) =>
                            updateColumn(currentTable.name, col.id, {
                              increment: e.target.checked,
                            })
                          }
                          className="rounded text-blue-500"
                        />
                        <span>Auto Inc</span>
                      </label>
                    </div>

                    {/* Default Value */}
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-[10px] text-slate-400 w-12">
                        Default:
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 0 atau 'active'"
                        value={col.defaultValue || ""}
                        onChange={(e) =>
                          updateColumn(currentTable.name, col.id, {
                            defaultValue: e.target.value || null,
                          })
                        }
                        className="flex-1 px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] focus:outline-hidden"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    `Hapus tabel '${currentTable.name}' berserta semua relasinya?`,
                  )
                ) {
                  deleteTable(currentTable.name);
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Tabel Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* Body: Relation Inspector */}
      {currentRelation && !currentTable && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Tabel Sumber & Kolom
            </div>
            <div className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200">
              {currentRelation.sourceTable}.{currentRelation.sourceColumn}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Tabel Target & Kolom
            </div>
            <div className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200">
              {currentRelation.targetTable}.{currentRelation.targetColumn}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Kardinalitas Relasi
            </div>
            <select
              value={currentRelation.cardinality}
              onChange={(e) => {
                const card = e.target.value as Cardinality;
                updateSchema((schema) => ({
                  ...schema,
                  relations: schema.relations.map((r) =>
                    r.id === currentRelation.id
                      ? { ...r, cardinality: card }
                      : r,
                  ),
                }));
              }}
              className="w-full px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="many-to-one">
                Many to One (N : 1) - Foreign Key Standar
              </option>
              <option value="one-to-many">One to Many (1 : N)</option>
              <option value="one-to-one">One to One (1 : 1)</option>
              <option value="many-to-many">Many to Many (N : M)</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              On Delete Action
            </div>
            <select
              value={currentRelation.onDelete || "none"}
              onChange={(e) => {
                const val = e.target.value === "none" ? null : e.target.value;
                updateSchema((schema) => ({
                  ...schema,
                  relations: schema.relations.map((r) =>
                    r.id === currentRelation.id ? { ...r, onDelete: val } : r,
                  ),
                }));
              }}
              className="w-full px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="none">Tidak Ditentukan</option>
              <option value="cascade">CASCADE</option>
              <option value="set null">SET NULL</option>
              <option value="restrict">RESTRICT</option>
              <option value="no action">NO ACTION</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (confirm("Hapus relasi ini?")) {
                  deleteRelation(currentRelation.id);
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Relasi Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* Body: No Selection / Database Overview */}
      {!currentTable && !currentRelation && (
        <div className="flex-1 p-4 space-y-4 text-slate-500 dark:text-slate-400">
          <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
              <Database className="w-4 h-4" />
              <span>Ringkasan Skema</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="block text-[10px] text-slate-400">
                  Dialect:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {project?.dialect}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">
                  Total Tabel:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {project?.schema.tables.length || 0}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">
                  Total Kolom:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {project?.schema.tables.reduce(
                    (acc, t) => acc + t.columns.length,
                    0,
                  ) || 0}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">
                  Total Relasi:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {project?.schema.relations.length || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-medium text-slate-700 dark:text-slate-300">
              Petunjuk Cepat:
            </div>
            <ul className="list-disc pl-4 space-y-1 leading-relaxed text-[11px]">
              <li>
                Klik pada tabel di kanvas atau panel kiri untuk mengubah
                properti tabel & kolom.
              </li>
              <li>
                Tarik garis dari titik handle kolom ke kolom tabel lain untuk
                membuat relasi Foreign Key.
              </li>
              <li>
                Klik garis relasi atau label kardinalitas untuk mengedit aturan
                relasi.
              </li>
              <li>
                Perubahan pada diagram otomatis tersinkronisasi ke DBML dan
                sebaliknya.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

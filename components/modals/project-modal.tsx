"use client";

import { Calendar, Copy, FolderOpen, Plus, Trash2, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useProjectStore } from "../../lib/store/use-project-store";
import type { Dialect } from "../../lib/types/schema";
import { cn } from "../../lib/utils";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectModal({ open, onClose }: ProjectModalProps) {
  const projectsList = useProjectStore((s) => s.projectsList);
  const currentProject = useProjectStore((s) => s.project);
  const switchProject = useProjectStore((s) => s.switchProject);
  const createNewProject = useProjectStore((s) => s.createNewProject);
  const duplicateCurrentProject = useProjectStore(
    (s) => s.duplicateCurrentProject,
  );
  const deleteCurrentProject = useProjectStore((s) => s.deleteCurrentProject);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDialect, setNewProjectDialect] =
    useState<Dialect>("postgres");

  if (!open) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProjectName.trim() || "Proyek Baru";
    await createNewProject(name, newProjectDialect);
    setNewProjectName("");
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 text-sm">
            <FolderOpen className="w-4 h-4 text-blue-500" />
            <span>Kelola Proyek Database</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Create New Project Section */}
          <form
            onSubmit={handleCreate}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
          >
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Buat Proyek Baru
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nama proyek (misal: Toko Online)"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:border-blue-500 focus:outline-hidden"
              />
              <select
                value={newProjectDialect}
                onChange={(e) =>
                  setNewProjectDialect(e.target.value as Dialect)
                }
                className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
              >
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat</span>
              </button>
            </div>
          </form>

          {/* Existing Projects List */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Daftar Proyek Tersimpan ({projectsList.length})
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              {projectsList.map((p) => {
                const isActive = p.id === currentProject?.id;

                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between p-3 transition-colors",
                      isActive
                        ? "bg-blue-50/70 dark:bg-blue-950/40"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                    )}
                  >
                    <div
                      onClick={async () => {
                        await switchProject(p.id);
                        onClose();
                      }}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-[13px]">
                          {p.name}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500 text-white font-medium">
                            Aktif
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                          {p.dialect}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Diperbarui {formatDate(p.updatedAt)}</span>
                        <span>•</span>
                        <span>{p.schema.tables.length} tabel</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pl-2">
                      <button
                        type="button"
                        title="Duplikasi proyek"
                        onClick={async () => {
                          await switchProject(p.id);
                          await duplicateCurrentProject();
                        }}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {projectsList.length > 1 && (
                        <button
                          type="button"
                          title="Hapus proyek"
                          onClick={async () => {
                            if (
                              confirm(
                                `Yakin ingin menghapus proyek '${p.name}'?`,
                              )
                            ) {
                              await deleteCurrentProject(p.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

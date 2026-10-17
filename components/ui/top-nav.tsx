"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Code2,
  Database,
  FileDown,
  FileUp,
  FolderOpen,
  HelpCircle,
  LayoutGrid,
  Loader2,
  Moon,
  PanelLeft,
  PanelRight,
  Redo2,
  Sun,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { useProjectStore } from "../../lib/store/use-project-store";
import type { Dialect, SaveStatus } from "../../lib/types/schema";
import { cn } from "../../lib/utils";

interface TopNavProps {
  onOpenProjectModal: () => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  onOpenShortcutModal: () => void;
}

export function TopNav({
  onOpenProjectModal,
  onOpenImportModal,
  onOpenExportModal,
  onOpenShortcutModal,
}: TopNavProps) {
  const project = useProjectStore((s) => s.project);
  const saveStatus = useProjectStore((s) => s.saveStatus);
  const history = useProjectStore((s) => s.history);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const applyAutoLayout = useProjectStore((s) => s.applyAutoLayout);
  const setDialect = useProjectStore((s) => s.setDialect);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const ui = useProjectStore((s) => s.ui);
  const toggleEditor = useProjectStore((s) => s.toggleEditor);
  const toggleSidebar = useProjectStore((s) => s.toggleSidebar);
  const toggleInspector = useProjectStore((s) => s.toggleInspector);
  const toggleTheme = useProjectStore((s) => s.toggleTheme);
  const persistNow = useProjectStore((s) => s.persistNow);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const handleStartEditTitle = () => {
    if (project) {
      setTitleInput(project.name);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      setProjectName(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const renderSaveStatus = (status: SaveStatus) => {
    switch (status) {
      case "saved":
        return (
          <button
            type="button"
            title="Tersimpan di IndexedDB lokal"
            onClick={persistNow}
            className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tersimpan</span>
          </button>
        );
      case "saving":
        return (
          <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Menyimpan...</span>
          </span>
        );
      case "unsaved":
        return (
          <button
            type="button"
            onClick={persistNow}
            title="Klik untuk menyimpan langsung ke IndexedDB"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="hidden sm:inline">Belum tersimpan</span>
          </button>
        );
      case "error":
        return (
          <button
            type="button"
            onClick={persistNow}
            title="Gagal menyimpan. Klik untuk mencoba lagi."
            className="flex items-center gap-1 text-[11px] text-red-500 font-medium"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gagal menyimpan</span>
          </button>
        );
    }
  };

  return (
    <header className="flex items-center justify-between h-13 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none text-xs shrink-0 z-20">
      {/* Left: Brand & Project Name */}
      <div className="flex items-center gap-3">
        {/* App Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
            <Database className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 hidden md:inline">
            Live DB Diagram
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {/* Project Name Editor */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenProjectModal}
            title="Buka Pengelola Proyek"
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                onBlur={handleSaveTitle}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-blue-500 font-semibold text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-1 text-emerald-500"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartEditTitle}
              title="Klik untuk mengubah nama proyek"
              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-500 truncate max-w-[160px] sm:max-w-xs transition-colors"
            >
              {project?.name || "Memuat Proyek..."}
            </button>
          )}

          {/* Dialect Switch */}
          <select
            value={project?.dialect || "postgres"}
            onChange={(e) => setDialect(e.target.value as Dialect)}
            className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] focus:outline-hidden"
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
          </select>
        </div>
      </div>

      {/* Middle: Save Status */}
      <div className="hidden lg:flex items-center gap-2">
        {renderSaveStatus(saveStatus)}
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={undo}
            disabled={history.past.length === 0}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800" />
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={redo}
            disabled={history.future.length === 0}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto Layout */}
        <button
          type="button"
          title="Atur Posisi Otomatis (Auto Layout)"
          onClick={() => applyAutoLayout("LR")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">Auto Layout</span>
        </button>

        {/* Import & Export */}
        <button
          type="button"
          onClick={onOpenImportModal}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium transition-colors"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Impor</span>
        </button>

        <button
          type="button"
          onClick={onOpenExportModal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-xs transition-colors"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Ekspor</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Panel View Toggles */}
        <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-0.5">
          <button
            type="button"
            title="Toggle Panel Tabel Kiri"
            onClick={toggleSidebar}
            className={cn(
              "p-1.5 rounded transition-colors",
              ui.sidebarOpen
                ? "bg-white dark:bg-slate-800 text-blue-500 shadow-xs"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Toggle Editor DBML"
            onClick={toggleEditor}
            className={cn(
              "p-1.5 rounded transition-colors",
              ui.editorOpen
                ? "bg-white dark:bg-slate-800 text-blue-500 shadow-xs"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Toggle Inspektor Kanan"
            onClick={toggleInspector}
            className={cn(
              "p-1.5 rounded transition-colors",
              ui.inspectorOpen
                ? "bg-white dark:bg-slate-800 text-blue-500 shadow-xs"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          title="Ubah Tema Gelap / Terang"
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          {ui.theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Shortcut & Help */}
        <button
          type="button"
          title="Bantuan & Pintasan Keyboard"
          onClick={onOpenShortcutModal}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

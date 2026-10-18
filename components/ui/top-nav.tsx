"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Database,
  FileDown,
  FileUp,
  FolderOpen,
  HelpCircle,
  History,
  LayoutGrid,
  Loader2,
  Redo2,
  Save,
  Settings,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { SiMysql, SiPostgresql } from "react-icons/si";
import { useProjectStore } from "../../lib/store/use-project-store";
import type { SaveStatus } from "../../lib/types/schema";
import { cn } from "../../lib/utils";
import { SettingsPopover } from "./settings-popover";

interface TopNavProps {
  onOpenProjectModal: () => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  onOpenShortcutModal: () => void;
  onOpenHistoryModal: () => void;
}

export function TopNav({
  onOpenProjectModal,
  onOpenImportModal,
  onOpenExportModal,
  onOpenShortcutModal,
  onOpenHistoryModal,
}: TopNavProps) {
  const project = useProjectStore((s) => s.project);
  const saveStatus = useProjectStore((s) => s.saveStatus);
  const history = useProjectStore((s) => s.history);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const applyAutoLayout = useProjectStore((s) => s.applyAutoLayout);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const persistNow = useProjectStore((s) => s.persistNow);
  const autoSave = useProjectStore((s) => s.ui.autoSave);
  const setShowWelcomeScreen = useProjectStore((s) => s.setShowWelcomeScreen);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

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
            className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer"
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
            title={
              autoSave
                ? "Menunggu auto-save... (Klik untuk simpan langsung)"
                : "Klik untuk menyimpan perubahan (Ctrl+S)"
            }
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors cursor-pointer",
              autoSave
                ? "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                : "bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs",
            )}
          >
            {autoSave ? (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            ) : (
              <Save className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            )}
            <span className="hidden sm:inline">Belum tersimpan*</span>
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
        {/* App Logo & Home / Welcome button */}
        <button
          type="button"
          onClick={() => setShowWelcomeScreen(true)}
          title="Kembali ke Halaman Awal (Welcome Screen)"
          className="flex items-center gap-2 group cursor-pointer text-left focus:outline-hidden"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Database className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 hidden md:inline group-hover:text-blue-500 transition-colors">
            Live DB Diagram
          </span>
        </button>

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

          {/* Dialect Badge (Read-only) */}
          <span
            className={cn(
              "px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold uppercase tracking-wider border select-none inline-flex items-center gap-1.5",
              project?.dialect === "mysql"
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60"
                : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
            )}
            title={`Database: ${project?.dialect === "mysql" ? "MySQL" : "PostgreSQL"}`}
          >
            {project?.dialect === "mysql" ? (
              <SiMysql className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <SiPostgresql className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{project?.dialect === "mysql" ? "MySQL" : "PostgreSQL"}</span>
          </span>
        </div>
      </div>

      {/* Middle: Save Status */}
      <div className="hidden lg:flex items-center gap-2">
        {renderSaveStatus(saveStatus)}
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo / Redo / History */}
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
          <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800" />
          <button
            type="button"
            title="Riwayat Versi Tersimpan & Restore"
            onClick={onOpenHistoryModal}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
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

        {/* Settings Popover */}
        <div className="relative">
          <button
            type="button"
            title="Pengaturan Tampilan & Kanvas"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              settingsOpen
                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
          >
            <Settings className="w-4 h-4" />
          </button>
          <SettingsPopover
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        </div>

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

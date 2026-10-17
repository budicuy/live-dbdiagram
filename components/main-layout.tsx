"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useProjectStore } from "../lib/store/use-project-store";
import { cn } from "../lib/utils";
import { ExportModal } from "./modals/export-modal";
import { ImportModal } from "./modals/import-modal";
import { ProjectModal } from "./modals/project-modal";
import { ShortcutModal } from "./modals/shortcut-modal";
import { InspectorPanel } from "./panels/inspector-panel";
import { SidebarTables } from "./panels/sidebar-tables";
import { TopNav } from "./ui/top-nav";

// Dynamic import with SSR false for Monaco Editor and React Flow Canvas
const EditorPanel = dynamic(
  () => import("./editor/editor-panel").then((mod) => mod.EditorPanel),
  { ssr: false },
);

const ErdCanvas = dynamic(
  () => import("./diagram/erd-canvas").then((mod) => mod.ErdCanvas),
  { ssr: false },
);

export function MainLayout() {
  const initStore = useProjectStore((s) => s.initStore);
  const isInitialized = useProjectStore((s) => s.isInitialized);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const topNavOpen = useProjectStore((s) => s.ui.topNavOpen);
  const toggleTopNav = useProjectStore((s) => s.toggleTopNav);
  const sidebarOpen = useProjectStore((s) => s.ui.sidebarOpen);
  const toggleSidebar = useProjectStore((s) => s.toggleSidebar);
  const editorOpen = useProjectStore((s) => s.ui.editorOpen);
  const toggleEditor = useProjectStore((s) => s.toggleEditor);
  const editorWidth = useProjectStore((s) => s.ui.editorWidth);
  const inspectorOpen = useProjectStore((s) => s.ui.inspectorOpen);
  const toggleInspector = useProjectStore((s) => s.toggleInspector);

  const sidebarLeft = sidebarOpen ? 256 : 0;
  const editorLeft = (sidebarOpen ? 256 : 0) + (editorOpen ? editorWidth : 0);
  const inspectorRight = inspectorOpen ? 320 : 0;

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);

  useEffect(() => {
    initStore();
  }, [initStore]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is inside an input, textarea, or monaco editor
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.classList.contains("monaco-mouse-cursor-text"))
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="font-medium text-sm">Memuat Live DB Diagram...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navbar with Collapsible Transition */}
      <div
        className={cn(
          "transition-all duration-200 ease-in-out shrink-0 overflow-visible relative z-20",
          topNavOpen ? "h-13" : "h-0",
        )}
      >
        <div
          className={cn(
            "transition-transform duration-200 ease-in-out w-full",
            topNavOpen ? "translate-y-0" : "-translate-y-full invisible",
          )}
        >
          <TopNav
            onOpenProjectModal={() => setProjectModalOpen(true)}
            onOpenImportModal={() => setImportModalOpen(true)}
            onOpenExportModal={() => setExportModalOpen(true)}
            onOpenShortcutModal={() => setShortcutModalOpen(true)}
          />
        </div>

        {/* Small Centered Hide/Unhide Button Attached Below Top Panel */}
        <button
          type="button"
          onClick={toggleTopNav}
          title={topNavOpen ? "Sembunyikan Panel Atas" : "Tampilkan Panel Atas"}
          className="absolute top-full left-1/2 -translate-x-1/2 z-30 flex items-center justify-center px-3 py-0.5 rounded-b-md border border-t-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer group focus:outline-hidden"
        >
          {topNavOpen ? (
            <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
          )}
        </button>
      </div>

      {/* Main Workspace: Left Sidebar + Editor + Canvas + Inspector */}
      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
        <SidebarTables />
        <EditorPanel />
        <main className="flex-1 h-full relative overflow-hidden">
          <ErdCanvas />
        </main>
        <InspectorPanel />

        {/* Small Hide/Unhide Tab for Sidebar (Panel Kiri) */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={
            sidebarOpen ? "Sembunyikan Panel Tabel" : "Tampilkan Panel Tabel"
          }
          style={{ left: `${sidebarLeft}px` }}
          className="absolute top-[calc(50%-22px)] -translate-y-1/2 z-30 flex items-center justify-center w-5 h-8 rounded-r-md border border-l-0 border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-[left,colors] duration-150 cursor-pointer group focus:outline-hidden"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>

        {/* Small Hide/Unhide Tab for Editor (Editor Kode) */}
        <button
          type="button"
          onClick={toggleEditor}
          title={
            editorOpen ? "Sembunyikan Editor DBML" : "Tampilkan Editor DBML"
          }
          style={{ left: `${editorLeft}px` }}
          className="absolute top-[calc(50%+22px)] -translate-y-1/2 z-30 flex items-center justify-center w-5 h-8 rounded-r-md border border-l-0 border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-[left,colors] duration-75 cursor-pointer group focus:outline-hidden"
        >
          {editorOpen ? (
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>

        {/* Small Hide/Unhide Tab for Inspector (Panel Kanan) */}
        <button
          type="button"
          onClick={toggleInspector}
          title={
            inspectorOpen
              ? "Sembunyikan Panel Inspektor"
              : "Tampilkan Panel Inspektor"
          }
          style={{ right: `${inspectorRight}px` }}
          className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-5 h-8 rounded-l-md border border-r-0 border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-[right,colors] duration-150 cursor-pointer group focus:outline-hidden"
        >
          {inspectorOpen ? (
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          )}
        </button>
      </div>

      {/* Modals */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
      />
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
      <ShortcutModal
        open={shortcutModalOpen}
        onClose={() => setShortcutModalOpen(false)}
      />
    </div>
  );
}

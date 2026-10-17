"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useProjectStore } from "../lib/store/use-project-store";
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
      {/* Top Navbar */}
      <TopNav
        onOpenProjectModal={() => setProjectModalOpen(true)}
        onOpenImportModal={() => setImportModalOpen(true)}
        onOpenExportModal={() => setExportModalOpen(true)}
        onOpenShortcutModal={() => setShortcutModalOpen(true)}
      />

      {/* Main Workspace: Left Sidebar + Editor + Canvas + Inspector */}
      <div className="flex flex-1 w-full h-[calc(100vh-3.25rem)] overflow-hidden">
        <SidebarTables />
        <EditorPanel />
        <main className="flex-1 h-full relative overflow-hidden">
          <ErdCanvas />
        </main>
        <InspectorPanel />
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

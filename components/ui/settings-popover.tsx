"use client";

import {
  Check,
  Map as MapIcon,
  Moon,
  Save,
  Sun,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type { CanvasPanelPosition } from "../../lib/storage/preference";
import { useProjectStore } from "../../lib/store/use-project-store";
import { cn } from "../../lib/utils";

interface SettingsPopoverProps {
  open: boolean;
  onClose: () => void;
}

const POSITION_OPTIONS: { id: CanvasPanelPosition; label: string }[] = [
  { id: "top-left", label: "Kiri Atas" },
  { id: "top-right", label: "Kanan Atas" },
  { id: "bottom-left", label: "Kiri Bawah" },
  { id: "bottom-right", label: "Kanan Bawah" },
];

export function SettingsPopover({ open, onClose }: SettingsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const theme = useProjectStore((s) => s.ui.theme);
  const setTheme = useProjectStore((s) => s.setTheme);

  const showControls = useProjectStore((s) => s.ui.showControls);
  const setShowControls = useProjectStore((s) => s.setShowControls);
  const controlsPosition = useProjectStore((s) => s.ui.controlsPosition);
  const setControlsPosition = useProjectStore((s) => s.setControlsPosition);

  const showMinimap = useProjectStore((s) => s.ui.showMinimap);
  const setShowMinimap = useProjectStore((s) => s.setShowMinimap);
  const minimapPosition = useProjectStore((s) => s.ui.minimapPosition);
  const setMinimapPosition = useProjectStore((s) => s.setMinimapPosition);

  const autoSave = useProjectStore((s) => s.ui.autoSave);
  const setAutoSave = useProjectStore((s) => s.setAutoSave);

  // Close on click outside or Escape key
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as HTMLElement)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-4 select-none z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            Pengaturan Tampilan
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Kustomisasi kanvas diagram & mode visual
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* 1. Dark Mode / Tema */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              {theme === "dark" ? (
                <Moon className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
              Tema / Mode Gelap
            </span>
            <span className="text-[11px] text-slate-400 capitalize">
              {theme === "dark" ? "Gelap (Dark)" : "Terang (Light)"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all text-xs",
                theme === "light"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              )}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Terang</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all text-xs",
                theme === "dark"
                  ? "bg-slate-700 text-white shadow-xs border border-slate-600"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              )}
            >
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Gelap</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* 2. Zoom Controls */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Zoom Controls
              </span>
            </div>
            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={showControls}
              onClick={() => setShowControls(!showControls)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden",
                showControls ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out mt-0.5",
                  showControls ? "translate-x-4.5 ml-0" : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          {showControls && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Posisi Tombol Zoom
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {POSITION_OPTIONS.map((pos) => {
                  const isSelected = controlsPosition === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setControlsPosition(pos.id)}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors",
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                      )}
                    >
                      <span>{pos.label}</span>
                      {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* 3. Minimap */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Minimap
              </span>
            </div>
            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={showMinimap}
              onClick={() => setShowMinimap(!showMinimap)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden",
                showMinimap ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out mt-0.5",
                  showMinimap ? "translate-x-4.5 ml-0" : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          {showMinimap && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Posisi Minimap
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {POSITION_OPTIONS.map((pos) => {
                  const isSelected = minimapPosition === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setMinimapPosition(pos.id)}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors",
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                      )}
                    >
                      <span>{pos.label}</span>
                      {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* 4. Auto Save */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-blue-500" />
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  Auto Save
                </div>
                <div className="text-[10px] text-slate-400">
                  {autoSave
                    ? "Simpan perubahan otomatis aktif"
                    : "Simpan manual (Ctrl+S)"}
                </div>
              </div>
            </div>
            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={autoSave}
              onClick={() => setAutoSave(!autoSave)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden",
                autoSave ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out mt-0.5",
                  autoSave ? "translate-x-4.5 ml-0" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Keyboard, X } from "lucide-react";

interface ShortcutModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "Ctrl + S / Cmd + S", desc: "Menyimpan proyek ke database lokal" },
  { key: "Ctrl + Z / Cmd + Z", desc: "Membatalkan perubahan skema (Undo)" },
  {
    key: "Ctrl + Y / Cmd + Shift + Z",
    desc: "Mengulangi perubahan skema (Redo)",
  },
  {
    key: "Tarik Handle Titik",
    desc: "Menghubungkan kolom untuk membuat relasi Foreign Key",
  },
  {
    key: "Klik Tabel",
    desc: "Memilih tabel dan membuka editor properti kolom",
  },
  {
    key: "Klik Garis Relasi",
    desc: "Memilih relasi dan mengatur aturan kardinalitas",
  },
  { key: "Scroll Mouse", desc: "Zoom in & Zoom out kanvas diagram" },
  { key: "Drag Kanvas", desc: "Menggeser tampilan kanvas diagram" },
];

export function ShortcutModal({ open, onClose }: ShortcutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 text-sm">
            <Keyboard className="w-4 h-4 text-blue-500" />
            <span>Pintasan Keyboard & Bantuan</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 text-xs">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            {SHORTCUTS.map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between p-2.5"
              >
                <span className="text-slate-600 dark:text-slate-400">
                  {s.desc}
                </span>
                <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-blue-700 dark:text-blue-300">
              Penyimpanan Lokal:
            </div>
            <p className="text-[11px] leading-relaxed">
              Semua data disimpan di peramban web lokal Anda menggunakan
              IndexedDB. Tidak ada data yang dikirim ke server luar. Disarankan
              mengekspor file proyek (JSON backup) secara berkala.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs shadow-xs transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

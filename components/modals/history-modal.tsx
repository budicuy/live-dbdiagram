"use client";

import {
  ChevronDown,
  Clock,
  Code2,
  History,
  RotateCcw,
  Table2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiMysql, SiPostgresql } from "react-icons/si";
import { useProjectStore } from "../../lib/store/use-project-store";
import type { ProjectHistoryItem } from "../../lib/types/schema";
import { cn } from "../../lib/utils";

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function HistoryModal({ open, onClose }: HistoryModalProps) {
  const currentProject = useProjectStore((s) => s.project);
  const getProjectHistory = useProjectStore((s) => s.getProjectHistory);
  const restoreSnapshot = useProjectStore((s) => s.restoreSnapshot);

  const [historyList, setHistoryList] = useState<ProjectHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<ProjectHistoryItem | null>(null);
  const [previewDbmlId, setPreviewDbmlId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedSnapshot(null);
      setPreviewDbmlId(null);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        const items = await getProjectHistory();
        setHistoryList(items);
      } catch (err) {
        console.error("Gagal memuat riwayat:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [open, getProjectHistory]);

  if (!open) return null;

  const handleConfirmRestore = async () => {
    if (!selectedSnapshot) return;
    setIsRestoring(true);
    try {
      await restoreSnapshot(selectedSnapshot);
      onClose();
    } catch (err) {
      console.error("Gagal restore snapshot:", err);
    } finally {
      setIsRestoring(false);
      setSelectedSnapshot(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "Baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
    return `${Math.floor(diff / 86400)} hari yang lalu`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <span>Riwayat Versi Tersimpan</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {historyList.length} Titik
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Pilih versi sebelumnya untuk dipulihkan (restore) ke kanvas &
                editor
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span>Memuat riwayat penyimpanan...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
              <p className="font-medium text-slate-600 dark:text-slate-400">
                Belum ada riwayat tersimpan
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 max-w-xs">
                Riwayat versi akan otomatis tercatat setiap kali proyek disimpan
                ke database lokal.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyList.map((item, _idx) => {
                const isCurrent =
                  currentProject &&
                  currentProject.dbml.trim() === item.dbml.trim();
                const isPreviewing = previewDbmlId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all space-y-2",
                      isCurrent
                        ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatDate(item.timestamp)}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(item.timestamp)}
                          </span>

                          {/* Label Badge */}
                          <span
                            className={cn(
                              "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase",
                              item.label === "Manual"
                                ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                                : item.label === "Restore"
                                  ? "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                            )}
                          >
                            {item.label || "Auto Save"}
                          </span>

                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                              Versi Saat Ini
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Table2 className="w-3 h-3 text-slate-400" />
                            <span>{item.tableCount} tabel</span>
                          </span>
                          <span className="flex items-center gap-1">
                            {item.dialect === "postgres" ? (
                              <SiPostgresql className="w-3 h-3 text-[#336791]" />
                            ) : (
                              <SiMysql className="w-3 h-3 text-[#00758F]" />
                            )}
                            <span className="capitalize">{item.dialect}</span>
                          </span>
                        </div>
                      </div>

                      {/* Action: Restore Button */}
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => setSelectedSnapshot(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium transition-colors shrink-0 shadow-2xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Pulihkan</span>
                        </button>
                      )}
                    </div>

                    {/* Collapsible DBML Preview Toggle */}
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDbmlId(isPreviewing ? null : item.id)
                        }
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-mono transition-colors"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>
                          {isPreviewing ? "Sembunyikan DBML" : "Lihat DBML"}
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-3 h-3 transition-transform duration-150",
                            isPreviewing && "rotate-180",
                          )}
                        />
                      </button>

                      {isPreviewing && (
                        <pre className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-40 border border-slate-800 leading-relaxed">
                          {item.dbml}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Restore Confirmation Dialog (Overlay) */}
        {selectedSnapshot && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 space-y-2.5 animate-in slide-in-from-bottom-2 duration-150">
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Konfirmasi Pemulihan Versi</span>
            </div>
            <p className="text-[11px] text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
              Anda akan memulihkan diagram ke versi{" "}
              <strong className="font-bold">
                {formatDate(selectedSnapshot.timestamp)}
              </strong>
              . Versi saat ini akan disimpan ke riwayat sehingga Anda tetap bisa
              membatalkan (Undo) jika dibutuhkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedSnapshot(null)}
                disabled={isRestoring}
                className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-xs"
              >
                {isRestoring ? (
                  <>
                    <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Memulihkan...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3" />
                    <span>Ya, Pulihkan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        {!selectedSnapshot && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
            <span className="text-[11px] text-slate-400">
              Disimpan otomatis di IndexedDB lokal
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

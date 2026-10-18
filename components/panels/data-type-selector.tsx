"use client";

import {
  AlertCircle,
  Check,
  ChevronDown,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_LABELS,
  type DataTypeCategory,
  type DataTypeDefinition,
  getDataTypesForDialect,
  isValidDataType,
  parseBaseDataType,
} from "../../lib/types/data-types";
import type { Dialect } from "../../lib/types/schema";
import { cn } from "../../lib/utils";

interface DataTypeSelectorProps {
  value: string;
  onChange: (newType: string) => void;
  dialect: Dialect;
  className?: string;
}

export function DataTypeSelector({
  value,
  onChange,
  dialect,
  className,
}: DataTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    DataTypeCategory | "all"
  >("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isValid = useMemo(
    () => isValidDataType(value, dialect),
    [value, dialect],
  );

  // All available types for the project's dialect
  const availableTypes = useMemo(
    () => getDataTypesForDialect(dialect),
    [dialect],
  );

  // Filtered types by search query and category
  const filteredTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return availableTypes.filter((dt) => {
      const matchCategory =
        selectedCategory === "all" || dt.category === selectedCategory;
      if (!matchCategory) return false;
      if (!q) return true;
      return (
        dt.name.toLowerCase().includes(q) ||
        dt.description.toLowerCase().includes(q) ||
        (dt.defaultParam && `${dt.name}(${dt.defaultParam})`.includes(q))
      );
    });
  }, [availableTypes, selectedCategory, searchQuery]);

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setSelectedCategory("all");
    }
  }, [isOpen]);

  const handleSelectType = (dt: DataTypeDefinition, customParam?: string) => {
    let finalType = dt.name;
    if (dt.name.includes(" ")) {
      finalType = `"${dt.name}"`;
    }
    const param = customParam || dt.defaultParam;
    if (param && dt.supportsParams) {
      finalType = `${dt.name}(${param})`;
    }
    onChange(finalType);
    setIsOpen(false);
  };

  const categories: { id: DataTypeCategory | "all"; label: string }[] = [
    { id: "all", label: "Semua" },
    { id: "numeric", label: "Angka" },
    { id: "string", label: "Teks" },
    { id: "datetime", label: "Waktu" },
    { id: "boolean", label: "Boolean" },
    { id: "json", label: "JSON" },
    { id: "network", label: "UUID" },
    { id: "binary", label: "Biner" },
  ];

  const currentBase = parseBaseDataType(value).base;

  return (
    <div ref={containerRef} className={cn("relative min-w-0", className)}>
      <div className="flex items-center">
        {/* Direct text input for full typing & custom params */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. varchar(255)"
          title={
            isValid
              ? `Tipe data valid (${dialect})`
              : `Tipe data '${value}' tidak valid untuk ${dialect === "postgres" ? "PostgreSQL" : "MySQL"}`
          }
          className={cn(
            "w-full min-w-0 px-2 py-1 rounded-l bg-slate-100 dark:bg-slate-800 border text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-hidden transition-colors",
            isValid
              ? "border-slate-200 dark:border-slate-700 focus:border-blue-500"
              : "border-red-400 dark:border-red-500/80 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 focus:border-red-500",
          )}
        />

        {/* Dropdown chevron trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Buka katalog tipe data"
          className={cn(
            "px-2 py-1 shrink-0 rounded-r border border-l-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors flex items-center justify-center cursor-pointer",
            isValid
              ? "border-slate-200 dark:border-slate-700"
              : "border-red-400 dark:border-red-500/80 text-red-500",
          )}
        >
          {isValid ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          )}
        </button>
      </div>

      {/* Floating Data Type Catalog Popover aligned to right */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-32px)] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100">
          {/* Popover Header & Dialect Badge */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Katalog Tipe Data</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {dialect}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tipe (misal: varchar, int, uuid)..."
              className="w-full pl-7 pr-6 py-1 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs focus:border-blue-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-2 py-0.5 rounded-full whitespace-nowrap transition-colors",
                  selectedCategory === cat.id
                    ? "bg-blue-500 text-white font-medium"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Types List */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
            {filteredTypes.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">
                Tidak ada tipe data yang cocok.
              </div>
            ) : (
              filteredTypes.map((dt) => {
                const isCurrent = currentBase === dt.name.toLowerCase();
                return (
                  <div
                    key={dt.name}
                    className={cn(
                      "group p-1.5 rounded-md border transition-all text-left",
                      isCurrent
                        ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-800"
                        : "border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSelectType(dt)}
                        className="flex-1 flex items-center gap-1.5 text-left"
                      >
                        <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-500">
                          {dt.name}
                        </span>
                        {isCurrent && (
                          <Check className="w-3 h-3 text-blue-500" />
                        )}
                      </button>

                      <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
                        {CATEGORY_LABELS[dt.category]?.split(" ")[0]}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {dt.description}
                    </div>

                    {/* Common quick parameters chips for types like varchar, decimal, etc. */}
                    {dt.supportsParams && dt.name === "varchar" && (
                      <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                        {["50", "100", "255"].map((len) => (
                          <button
                            key={len}
                            type="button"
                            onClick={() => handleSelectType(dt, len)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            varchar({len})
                          </button>
                        ))}
                      </div>
                    )}

                    {dt.supportsParams &&
                      (dt.name === "decimal" || dt.name === "numeric") && (
                        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                          {["10,2", "12,4", "18,4"].map((prec) => (
                            <button
                              key={prec}
                              type="button"
                              onClick={() => handleSelectType(dt, prec)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              {dt.name}({prec})
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { dbmlMonarchTokensProvider } from "@dbml/core";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef } from "react";
import { useProjectStore } from "../../lib/store/use-project-store";

export function DbmlEditor() {
  const project = useProjectStore((s) => s.project);
  const setDbml = useProjectStore((s) => s.setDbml);
  const diagnostics = useProjectStore((s) => s.diagnostics);
  const theme = useProjectStore((s) => s.ui.theme);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Setup Monaco language & tokens provider
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register DBML language if not already registered
    const languages = monaco.languages.getLanguages();
    if (!languages.some((l: any) => l.id === "dbml")) {
      monaco.languages.register({ id: "dbml" });
      monaco.languages.setMonarchTokensProvider(
        "dbml",
        dbmlMonarchTokensProvider as any,
      );
    }

    // Configure editor preferences
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 13,
      lineHeight: 20,
      fontFamily: "var(--font-geist-mono), monospace",
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      scrollBeyondLastLine: false,
      renderLineHighlight: "all",
      padding: { top: 12, bottom: 12 },
    });
  };

  // Sync Diagnostics to Monaco markers
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers = diagnostics.map((d) => ({
      message: d.message,
      severity:
        d.severity === "error"
          ? monaco.MarkerSeverity.Error
          : monaco.MarkerSeverity.Warning,
      startLineNumber: d.line ?? 1,
      startColumn: d.column ?? 1,
      endLineNumber: d.endLine ?? d.line ?? 1,
      endColumn: d.endColumn ?? 999,
    }));

    monaco.editor.setModelMarkers(model, "dbml", markers);
  }, [diagnostics]);

  // Handle text changes with debounce
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        setDbml(value);
      }, 300);
    },
    [setDbml],
  );

  return (
    <div className="w-full h-full overflow-hidden bg-white dark:bg-[#1e1e1e]">
      <Editor
        height="100%"
        language="dbml"
        value={project?.dbml || ""}
        theme={theme === "dark" ? "vs-dark" : "vs"}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          automaticLayout: true,
          cursorBlinking: "smooth",
          smoothScrolling: true,
        }}
      />
    </div>
  );
}

import { create } from "zustand";
import { computeAutoLayout } from "../engine/layout";
import { parseDbml } from "../engine/parser";
import { serializeDbml } from "../engine/serializer";
import { validateSchema } from "../engine/validator";
import {
  createProject,
  deleteProject as deleteDbProject,
  duplicateProject as duplicateDbProject,
  getProject,
  listProjects,
  saveProject,
} from "../storage/db";
import { getPreferences, savePreferences } from "../storage/preference";
import type {
  ColumnDefinition,
  DatabaseSchema,
  Dialect,
  ProjectRecord,
  RelationDefinition,
  SaveStatus,
  SchemaDiagnostic,
} from "../types/schema";

interface UIState {
  editorOpen: boolean;
  inspectorOpen: boolean;
  sidebarOpen: boolean;
  editorWidth: number;
  theme: "light" | "dark";
}

interface ProjectStore {
  project: ProjectRecord | null;
  projectsList: ProjectRecord[];
  saveStatus: SaveStatus;
  diagnostics: SchemaDiagnostic[];
  history: {
    past: string[];
    future: string[];
  };
  selectedTableId: string | null;
  selectedRelationId: string | null;
  ui: UIState;
  isInitialized: boolean;

  // Lifecycle
  initStore: () => Promise<void>;
  refreshProjectsList: () => Promise<void>;
  switchProject: (id: string) => Promise<void>;
  createNewProject: (
    name?: string,
    dialect?: Dialect,
    dbml?: string,
  ) => Promise<void>;
  duplicateCurrentProject: () => Promise<void>;
  deleteCurrentProject: (id: string) => Promise<void>;

  // Core Editor & Diagram Sync
  setDbml: (dbml: string, pushHistory?: boolean) => void;
  updateSchema: (updater: (draft: DatabaseSchema) => DatabaseSchema) => void;
  updateTablePosition: (
    tableId: string,
    position: { x: number; y: number },
  ) => void;
  updateAllPositions: (
    positions: Record<string, { x: number; y: number }>,
  ) => void;
  applyAutoLayout: (direction?: "LR" | "TB") => void;

  // Metadata Updates
  setProjectName: (name: string) => void;
  setDialect: (dialect: Dialect) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Selection
  setSelectedTableId: (id: string | null) => void;
  setSelectedRelationId: (id: string | null) => void;

  // High-Level Schema Mutations
  addTable: (name?: string) => void;
  renameTable: (oldName: string, newName: string) => void;
  deleteTable: (tableName: string) => void;
  addColumn: (tableName: string, col?: Partial<ColumnDefinition>) => void;
  updateColumn: (
    tableName: string,
    columnId: string,
    updates: Partial<ColumnDefinition>,
  ) => void;
  deleteColumn: (tableName: string, columnId: string) => void;
  addRelation: (rel: Omit<RelationDefinition, "id">) => void;
  deleteRelation: (relationId: string) => void;

  // UI
  toggleEditor: () => void;
  toggleInspector: () => void;
  toggleSidebar: () => void;
  setEditorWidth: (width: number) => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;

  // Manual save trigger
  persistNow: () => Promise<void>;
}

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useProjectStore = create<ProjectStore>((set, get) => {
  const triggerDebouncedSave = () => {
    set({ saveStatus: "unsaved" });
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

    saveDebounceTimer = setTimeout(async () => {
      const { project } = get();
      if (!project) return;
      set({ saveStatus: "saving" });
      try {
        await saveProject(project);
        set({ saveStatus: "saved" });
        get().refreshProjectsList();
      } catch (err) {
        console.error("Gagal menyimpan ke IndexedDB:", err);
        set({ saveStatus: "error" });
      }
    }, 800);
  };

  return {
    project: null,
    projectsList: [],
    saveStatus: "saved",
    diagnostics: [],
    history: { past: [], future: [] },
    selectedTableId: null,
    selectedRelationId: null,
    ui: {
      editorOpen: true,
      inspectorOpen: true,
      sidebarOpen: true,
      editorWidth: 420,
      theme: "dark",
    },
    isInitialized: false,

    initStore: async () => {
      const prefs = getPreferences();
      const theme = prefs.theme === "light" ? "light" : "dark";

      // Apply initial theme class to HTML
      if (typeof document !== "undefined") {
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }

      set({
        ui: {
          editorOpen: prefs.editorOpen,
          inspectorOpen: prefs.inspectorOpen,
          sidebarOpen: prefs.sidebarOpen,
          editorWidth: prefs.editorWidth || 420,
          theme,
        },
      });

      try {
        const list = await listProjects();
        set({ projectsList: list });

        let activeProject: ProjectRecord | undefined;
        if (prefs.lastProjectId) {
          activeProject = list.find((p) => p.id === prefs.lastProjectId);
        }

        if (!activeProject && list.length > 0) {
          activeProject = list[0];
        }

        if (!activeProject) {
          activeProject = await createProject("Proyek Default", "postgres");
          set({ projectsList: [activeProject] });
        }

        savePreferences({ lastProjectId: activeProject.id });

        const parseRes = parseDbml(activeProject.dbml, activeProject.dialect);
        const schema = parseRes.schema || activeProject.schema;
        const validationDiags = validateSchema(schema);
        const allDiags = [...parseRes.diagnostics, ...validationDiags];

        set({
          project: activeProject,
          diagnostics: allDiags,
          isInitialized: true,
        });
      } catch (err) {
        console.error("Init store error:", err);
        set({ isInitialized: true, saveStatus: "error" });
      }
    },

    refreshProjectsList: async () => {
      try {
        const list = await listProjects();
        set({ projectsList: list });
      } catch (err) {
        console.error("Gagal me-refresh daftar proyek:", err);
      }
    },

    switchProject: async (id: string) => {
      try {
        const p = await getProject(id);
        if (!p) return;
        savePreferences({ lastProjectId: p.id });

        const parseRes = parseDbml(p.dbml, p.dialect);
        const schema = parseRes.schema || p.schema;
        const allDiags = [...parseRes.diagnostics, ...validateSchema(schema)];

        set({
          project: p,
          diagnostics: allDiags,
          history: { past: [], future: [] },
          selectedTableId: null,
          selectedRelationId: null,
          saveStatus: "saved",
        });
      } catch (err) {
        console.error("Gagal beralih proyek:", err);
      }
    },

    createNewProject: async (
      name = "Proyek Baru",
      dialect: Dialect = "postgres",
      dbml?: string,
    ) => {
      try {
        const p = await createProject(name, dialect, dbml);
        savePreferences({ lastProjectId: p.id });
        await get().refreshProjectsList();
        await get().switchProject(p.id);
      } catch (err) {
        console.error("Gagal membuat proyek baru:", err);
      }
    },

    duplicateCurrentProject: async () => {
      const { project } = get();
      if (!project) return;
      try {
        const dup = await duplicateDbProject(project.id);
        await get().refreshProjectsList();
        await get().switchProject(dup.id);
      } catch (err) {
        console.error("Gagal menduplikasi proyek:", err);
      }
    },

    deleteCurrentProject: async (id: string) => {
      try {
        await deleteDbProject(id);
        const list = await listProjects();
        set({ projectsList: list });
        if (list.length > 0) {
          await get().switchProject(list[0].id);
        } else {
          await get().createNewProject();
        }
      } catch (err) {
        console.error("Gagal menghapus proyek:", err);
      }
    },

    setDbml: (dbml: string, pushHistory = true) => {
      const { project, history } = get();
      if (!project) return;

      const parseRes = parseDbml(dbml, project.dialect);
      let newSchema = project.schema;
      let diags: SchemaDiagnostic[] = parseRes.diagnostics;

      if (parseRes.success && parseRes.schema) {
        newSchema = parseRes.schema;
        const validationDiags = validateSchema(newSchema);
        diags = [...parseRes.diagnostics, ...validationDiags];
      }

      // Maintain positions: if there are new tables without positions, calculate default positions
      const positions = { ...project.metadata.positions };
      for (const t of newSchema.tables) {
        if (!positions[t.id]) {
          positions[t.id] = {
            x: 50 + Object.keys(positions).length * 40,
            y: 50 + Object.keys(positions).length * 40,
          };
        }
      }

      let newHistory = history;
      if (pushHistory && project.dbml !== dbml) {
        newHistory = {
          past: [...history.past.slice(-20), project.dbml],
          future: [],
        };
      }

      const updatedProject: ProjectRecord = {
        ...project,
        dbml,
        schema: newSchema,
        metadata: {
          ...project.metadata,
          positions,
        },
        updatedAt: Date.now(),
      };

      set({
        project: updatedProject,
        diagnostics: diags,
        history: newHistory,
      });

      triggerDebouncedSave();
    },

    updateSchema: (updater) => {
      const { project, history } = get();
      if (!project) return;

      const currentSchema = project.schema;
      const nextSchema = updater(currentSchema);
      const newDbml = serializeDbml(nextSchema);
      const validationDiags = validateSchema(nextSchema);

      const newHistory = {
        past: [...history.past.slice(-20), project.dbml],
        future: [],
      };

      const updatedProject: ProjectRecord = {
        ...project,
        dbml: newDbml,
        schema: nextSchema,
        updatedAt: Date.now(),
      };

      set({
        project: updatedProject,
        diagnostics: validationDiags,
        history: newHistory,
      });

      triggerDebouncedSave();
    },

    updateTablePosition: (
      tableId: string,
      position: { x: number; y: number },
    ) => {
      const { project } = get();
      if (!project) return;

      const positions = {
        ...project.metadata.positions,
        [tableId]: position,
      };

      set({
        project: {
          ...project,
          metadata: {
            ...project.metadata,
            positions,
          },
        },
      });

      triggerDebouncedSave();
    },

    updateAllPositions: (
      positions: Record<string, { x: number; y: number }>,
    ) => {
      const { project } = get();
      if (!project) return;

      set({
        project: {
          ...project,
          metadata: {
            ...project.metadata,
            positions,
          },
        },
      });

      triggerDebouncedSave();
    },

    applyAutoLayout: (direction = "LR") => {
      const { project } = get();
      if (!project) return;

      const newPositions = computeAutoLayout(project.schema, direction);
      get().updateAllPositions(newPositions);
    },

    setProjectName: (name: string) => {
      const { project } = get();
      if (!project) return;
      set({
        project: { ...project, name, updatedAt: Date.now() },
      });
      triggerDebouncedSave();
    },

    setDialect: (dialect: Dialect) => {
      const { project } = get();
      if (!project) return;

      const updatedSchema: DatabaseSchema = {
        ...project.schema,
        dialect,
      };

      const updatedProject: ProjectRecord = {
        ...project,
        dialect,
        schema: updatedSchema,
        updatedAt: Date.now(),
      };

      set({ project: updatedProject });
      triggerDebouncedSave();
    },

    undo: () => {
      const { project, history } = get();
      if (!project || history.past.length === 0) return;

      const previousDbml = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, -1);
      const newFuture = [project.dbml, ...history.future];

      set({
        history: { past: newPast, future: newFuture },
      });

      get().setDbml(previousDbml, false);
    },

    redo: () => {
      const { project, history } = get();
      if (!project || history.future.length === 0) return;

      const nextDbml = history.future[0];
      const newFuture = history.future.slice(1);
      const newPast = [...history.past, project.dbml];

      set({
        history: { past: newPast, future: newFuture },
      });

      get().setDbml(nextDbml, false);
    },

    setSelectedTableId: (id: string | null) => {
      set({ selectedTableId: id, selectedRelationId: null });
    },

    setSelectedRelationId: (id: string | null) => {
      set({ selectedRelationId: id, selectedTableId: null });
    },

    // High-Level Schema Mutations
    addTable: (name) => {
      const { project } = get();
      if (!project) return;

      const baseName = name || `table_${project.schema.tables.length + 1}`;
      let finalName = baseName;
      let counter = 1;
      while (
        project.schema.tables.some(
          (t) => t.name.toLowerCase() === finalName.toLowerCase(),
        )
      ) {
        finalName = `${baseName}_${counter++}`;
      }

      const newTable = {
        id: finalName,
        name: finalName,
        columns: [
          {
            id: `${finalName}_id`,
            name: "id",
            type: "integer",
            pk: true,
            increment: true,
            notNull: true,
          },
        ],
      };

      get().updateSchema((schema) => ({
        ...schema,
        tables: [...schema.tables, newTable],
      }));

      // Give new table a position
      get().updateTablePosition(finalName, {
        x: 100 + project.schema.tables.length * 40,
        y: 100 + project.schema.tables.length * 40,
      });

      get().setSelectedTableId(finalName);
    },

    renameTable: (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || oldName === trimmed) return;

      get().updateSchema((schema) => {
        const tables = schema.tables.map((t) =>
          t.name === oldName ? { ...t, name: trimmed, id: trimmed } : t,
        );
        const relations = schema.relations.map((r) => {
          let sourceTable = r.sourceTable;
          let targetTable = r.targetTable;
          if (sourceTable === oldName) sourceTable = trimmed;
          if (targetTable === oldName) targetTable = trimmed;
          return { ...r, sourceTable, targetTable };
        });
        return { ...schema, tables, relations };
      });

      const { project } = get();
      if (project?.metadata.positions[oldName]) {
        const pos = project.metadata.positions[oldName];
        get().updateTablePosition(trimmed, pos);
      }
      get().setSelectedTableId(trimmed);
    },

    deleteTable: (tableName: string) => {
      get().updateSchema((schema) => ({
        ...schema,
        tables: schema.tables.filter((t) => t.name !== tableName),
        relations: schema.relations.filter(
          (r) => r.sourceTable !== tableName && r.targetTable !== tableName,
        ),
      }));

      if (get().selectedTableId === tableName) {
        get().setSelectedTableId(null);
      }
    },

    addColumn: (tableName: string, col) => {
      get().updateSchema((schema) => {
        const tables = schema.tables.map((t) => {
          if (t.name !== tableName) return t;
          const colName = col?.name || `col_${t.columns.length + 1}`;
          const newCol: ColumnDefinition = {
            id: `${tableName}_${colName}_${Date.now()}`,
            name: colName,
            type: col?.type || "varchar(255)",
            pk: Boolean(col?.pk),
            increment: Boolean(col?.increment),
            notNull: Boolean(col?.notNull),
            unique: Boolean(col?.unique),
            defaultValue: col?.defaultValue || null,
            note: col?.note || null,
          };
          return {
            ...t,
            columns: [...t.columns, newCol],
          };
        });
        return { ...schema, tables };
      });
    },

    updateColumn: (
      tableName: string,
      columnId: string,
      updates: Partial<ColumnDefinition>,
    ) => {
      get().updateSchema((schema) => {
        const tables = schema.tables.map((t) => {
          if (t.name !== tableName) return t;
          const columns = t.columns.map((c) =>
            c.id === columnId ? { ...c, ...updates } : c,
          );
          return { ...t, columns };
        });
        return { ...schema, tables };
      });
    },

    deleteColumn: (tableName: string, columnId: string) => {
      const { project } = get();
      if (!project) return;
      const targetTable = project.schema.tables.find(
        (t) => t.name === tableName,
      );
      const targetCol = targetTable?.columns.find((c) => c.id === columnId);
      const colName = targetCol?.name;

      get().updateSchema((schema) => {
        const tables = schema.tables.map((t) => {
          if (t.name !== tableName) return t;
          return {
            ...t,
            columns: t.columns.filter((c) => c.id !== columnId),
          };
        });

        // Also remove any relations referencing this column
        const relations = schema.relations.filter((r) => {
          if (r.sourceTable === tableName && r.sourceColumn === colName)
            return false;
          if (r.targetTable === tableName && r.targetColumn === colName)
            return false;
          return true;
        });

        return { ...schema, tables, relations };
      });
    },

    addRelation: (rel) => {
      const newRel: RelationDefinition = {
        ...rel,
        id: `ref_${rel.sourceTable}_${rel.sourceColumn}_${rel.targetTable}_${rel.targetColumn}_${Date.now()}`,
      };

      get().updateSchema((schema) => ({
        ...schema,
        relations: [...schema.relations, newRel],
      }));

      get().setSelectedRelationId(newRel.id);
    },

    deleteRelation: (relationId: string) => {
      get().updateSchema((schema) => ({
        ...schema,
        relations: schema.relations.filter((r) => r.id !== relationId),
      }));

      if (get().selectedRelationId === relationId) {
        get().setSelectedRelationId(null);
      }
    },

    // UI actions
    toggleEditor: () => {
      const next = !get().ui.editorOpen;
      set((s) => ({ ui: { ...s.ui, editorOpen: next } }));
      savePreferences({ editorOpen: next });
    },

    toggleInspector: () => {
      const next = !get().ui.inspectorOpen;
      set((s) => ({ ui: { ...s.ui, inspectorOpen: next } }));
      savePreferences({ inspectorOpen: next });
    },

    toggleSidebar: () => {
      const next = !get().ui.sidebarOpen;
      set((s) => ({ ui: { ...s.ui, sidebarOpen: next } }));
      savePreferences({ sidebarOpen: next });
    },

    setEditorWidth: (width: number) => {
      set((s) => ({ ui: { ...s.ui, editorWidth: width } }));
      savePreferences({ editorWidth: width });
    },

    setTheme: (theme: "light" | "dark") => {
      if (typeof document !== "undefined") {
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      set((s) => ({ ui: { ...s.ui, theme } }));
      savePreferences({ theme });
    },

    toggleTheme: () => {
      const next = get().ui.theme === "dark" ? "light" : "dark";
      get().setTheme(next);
    },

    persistNow: async () => {
      const { project } = get();
      if (!project) return;
      set({ saveStatus: "saving" });
      try {
        await saveProject(project);
        set({ saveStatus: "saved" });
        await get().refreshProjectsList();
      } catch (err) {
        console.error("Gagal menyimpan:", err);
        set({ saveStatus: "error" });
      }
    },
  };
});

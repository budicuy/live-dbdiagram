import { type IDBPDatabase, openDB } from "idb";
import { computeAutoLayout } from "../engine/layout";
import { parseDbml } from "../engine/parser";
import { DEFAULT_DBML } from "../engine/sample";
import type {
  Dialect,
  ProjectHistoryItem,
  ProjectRecord,
} from "../types/schema";

const DB_NAME = "live_dbdiagram_db";
const DB_VERSION = 2;
const STORE_PROJECTS = "projects";
const STORE_HISTORY = "project_history";
const MAX_HISTORY_PER_PROJECT = 30;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("IndexedDB is only accessible in browser environment"),
    );
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          const store = db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          const histStore = db.createObjectStore(STORE_HISTORY, {
            keyPath: "id",
          });
          histStore.createIndex("projectId", "projectId");
          histStore.createIndex("timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  if (typeof window === "undefined") return [];
  const db = await getDb();
  const tx = db.transaction(STORE_PROJECTS, "readonly");
  const store = tx.objectStore(STORE_PROJECTS);
  const items = await store.getAll();
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(
  id: string,
): Promise<ProjectRecord | undefined> {
  if (typeof window === "undefined") return undefined;
  const db = await getDb();
  return db.get(STORE_PROJECTS, id);
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await getDb();
  const updated: ProjectRecord = {
    ...project,
    updatedAt: Date.now(),
  };
  await db.put(STORE_PROJECTS, updated);
}

export async function createProject(
  name = "Proyek Baru",
  dialect: Dialect = "postgres",
  dbml = DEFAULT_DBML,
): Promise<ProjectRecord> {
  const parseRes = parseDbml(dbml, dialect);
  const schema = parseRes.schema || { tables: [], relations: [], dialect };
  const positions = computeAutoLayout(schema);

  const project: ProjectRecord = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    dialect,
    dbml,
    schema,
    metadata: {
      positions,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveProject(project);
  return project;
}

export async function duplicateProject(id: string): Promise<ProjectRecord> {
  const original = await getProject(id);
  if (!original) {
    throw new Error("Proyek asli tidak ditemukan");
  }

  const duplicated: ProjectRecord = {
    ...original,
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `${original.name} (Salinan)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveProject(duplicated);
  return duplicated;
}

export async function deleteProject(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await getDb();
  await db.delete(STORE_PROJECTS, id);
  await deleteProjectHistory(id);
}

export async function saveProjectSnapshot(
  project: ProjectRecord,
  label = "Auto Save",
): Promise<ProjectHistoryItem | null> {
  if (typeof window === "undefined") return null;
  const db = await getDb();
  const tx = db.transaction(STORE_HISTORY, "readwrite");
  const store = tx.objectStore(STORE_HISTORY);
  const index = store.index("projectId");
  const existing = await index.getAll(project.id);

  existing.sort((a, b) => b.timestamp - a.timestamp);

  // If latest snapshot has identical DBML, skip creating duplicate
  if (existing.length > 0 && existing[0].dbml.trim() === project.dbml.trim()) {
    await tx.done;
    return null;
  }

  const snapshot: ProjectHistoryItem = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectId: project.id,
    name: project.name,
    dialect: project.dialect,
    dbml: project.dbml,
    schema: project.schema,
    metadata: project.metadata,
    tableCount: project.schema.tables.length,
    timestamp: Date.now(),
    label,
  };

  await store.put(snapshot);

  // Prune older snapshots if exceeding MAX_HISTORY_PER_PROJECT
  if (existing.length >= MAX_HISTORY_PER_PROJECT) {
    const toDelete = existing.slice(MAX_HISTORY_PER_PROJECT - 1);
    for (const item of toDelete) {
      await store.delete(item.id);
    }
  }

  await tx.done;
  return snapshot;
}

export async function getProjectHistory(
  projectId: string,
): Promise<ProjectHistoryItem[]> {
  if (typeof window === "undefined") return [];
  const db = await getDb();
  const tx = db.transaction(STORE_HISTORY, "readonly");
  const store = tx.objectStore(STORE_HISTORY);
  const index = store.index("projectId");
  const items = await index.getAll(projectId);
  return items.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteProjectHistory(projectId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await getDb();
  const tx = db.transaction(STORE_HISTORY, "readwrite");
  const store = tx.objectStore(STORE_HISTORY);
  const index = store.index("projectId");
  const items = await index.getAll(projectId);
  for (const item of items) {
    await store.delete(item.id);
  }
  await tx.done;
}

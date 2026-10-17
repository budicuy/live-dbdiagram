import { type IDBPDatabase, openDB } from "idb";
import { computeAutoLayout } from "../engine/layout";
import { parseDbml } from "../engine/parser";
import { DEFAULT_DBML } from "../engine/sample";
import type { Dialect, ProjectRecord } from "../types/schema";

const DB_NAME = "live_dbdiagram_db";
const DB_VERSION = 1;
const STORE_PROJECTS = "projects";

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
      },
    });
  }
  return dbPromise;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const db = await getDb();
  const tx = db.transaction(STORE_PROJECTS, "readonly");
  const store = tx.objectStore(STORE_PROJECTS);
  const items = await store.getAll();
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(
  id: string,
): Promise<ProjectRecord | undefined> {
  const db = await getDb();
  return db.get(STORE_PROJECTS, id);
}

export async function saveProject(project: ProjectRecord): Promise<void> {
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
  const db = await getDb();
  await db.delete(STORE_PROJECTS, id);
}

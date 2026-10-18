import { z } from "zod";

export type Dialect = "postgres" | "mysql";

export type Cardinality =
  | "one-to-one"
  | "one-to-many"
  | "many-to-one"
  | "many-to-many";

export interface ColumnDefinition {
  id: string;
  name: string;
  type: string;
  pk?: boolean;
  increment?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defaultValue?: string | null;
  note?: string | null;
}

export interface IndexDefinition {
  name?: string;
  columns: string[];
  unique?: boolean;
}

export interface TableDefinition {
  id: string;
  name: string;
  schema?: string;
  alias?: string;
  note?: string | null;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
}

export interface RelationDefinition {
  id: string;
  name?: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  cardinality: Cardinality;
  onDelete?: string | null;
  onUpdate?: string | null;
}

export interface EnumDefinition {
  name: string;
  values: string[];
}

export interface DatabaseSchema {
  tables: TableDefinition[];
  relations: RelationDefinition[];
  enums?: EnumDefinition[];
  dialect: Dialect;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface DiagramMetadata {
  positions: Record<string, NodePosition>;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  collapsedTables?: Record<string, boolean>;
}

export interface ProjectRecord {
  id: string;
  name: string;
  dialect: Dialect;
  dbml: string;
  schema: DatabaseSchema;
  metadata: DiagramMetadata;
  createdAt: number;
  updatedAt: number;
}

export type SaveStatus = "unsaved" | "saving" | "saved" | "error";

export interface SchemaDiagnostic {
  message: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  severity: "error" | "warning";
  rule?: string;
  suggestion?: string;
}

// Zod Schemas for Validation and Project Backup Import
export const ColumnSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama kolom tidak boleh kosong"),
  type: z.string().min(1, "Tipe kolom tidak boleh kosong"),
  pk: z.boolean().optional(),
  increment: z.boolean().optional(),
  notNull: z.boolean().optional(),
  unique: z.boolean().optional(),
  defaultValue: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const TableSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama tabel tidak boleh kosong"),
  schema: z.string().optional(),
  alias: z.string().optional(),
  note: z.string().nullable().optional(),
  columns: z.array(ColumnSchema),
  indexes: z
    .array(
      z.object({
        name: z.string().optional(),
        columns: z.array(z.string()),
        unique: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const RelationSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  sourceTable: z.string(),
  sourceColumn: z.string(),
  targetTable: z.string(),
  targetColumn: z.string(),
  cardinality: z.enum([
    "one-to-one",
    "one-to-many",
    "many-to-one",
    "many-to-many",
  ]),
  onDelete: z.string().nullable().optional(),
  onUpdate: z.string().nullable().optional(),
});

export const EnumSchema = z.object({
  name: z.string(),
  values: z.array(z.string()),
});

export const DatabaseSchemaValidator = z.object({
  tables: z.array(TableSchema),
  relations: z.array(RelationSchema),
  enums: z.array(EnumSchema).optional(),
  dialect: z.enum(["postgres", "mysql"]),
});

export const DiagramMetadataSchema = z.object({
  positions: z.record(
    z.string(),
    z.object({
      x: z.number(),
      y: z.number(),
    }),
  ),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .optional(),
  collapsedTables: z.record(z.string(), z.boolean()).optional(),
});

export const ProjectBackupSchema = z.object({
  version: z.literal(1).optional(),
  id: z.string(),
  name: z.string(),
  dialect: z.enum(["postgres", "mysql"]),
  dbml: z.string(),
  schema: DatabaseSchemaValidator,
  metadata: DiagramMetadataSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ProjectBackup = z.infer<typeof ProjectBackupSchema>;

export const ProjectHistoryItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  dialect: z.enum(["postgres", "mysql"]),
  dbml: z.string(),
  schema: DatabaseSchemaValidator,
  metadata: DiagramMetadataSchema,
  tableCount: z.number(),
  timestamp: z.number(),
  label: z.string().optional(),
});

export type ProjectHistoryItem = z.infer<typeof ProjectHistoryItemSchema>;

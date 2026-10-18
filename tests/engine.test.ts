import { describe, expect, it } from "vitest";
import {
  calculateEstimatedDimensions,
  calculateExportTransform,
  getDiagramBounds,
} from "../lib/engine/canvas-exporter";
import { computeAutoLayout } from "../lib/engine/layout";
import { parseDbml } from "../lib/engine/parser";
import { serializeDbml } from "../lib/engine/serializer";
import { exportDbmlToSql } from "../lib/engine/sql-exporter";
import { importSqlToDbml } from "../lib/engine/sql-importer";
import { validateSchema } from "../lib/engine/validator";
import { useProjectStore } from "../lib/store/use-project-store";
import {
  getSuggestedDataTypes,
  isValidDataType,
  parseBaseDataType,
} from "../lib/types/data-types";
import {
  ProjectBackupSchema,
  ProjectHistoryItemSchema,
} from "../lib/types/schema";

describe("DBML Parser & Serializer", () => {
  it("parses DBML tables, columns, constraints and references correctly", () => {
    const dbml = `
Table users {
  id integer [pk, increment]
  email varchar [not null, unique]
  bio text
}

Table orders {
  id integer [pk]
  user_id integer [not null]
  total decimal [default: 0]
}

Ref: orders.user_id > users.id [delete: cascade]
`;

    const result = parseDbml(dbml, "postgres");
    expect(result.success).toBe(true);
    expect(result.schema).toBeDefined();
    const schema = result.schema;
    if (!schema) throw new Error("Schema should be defined");
    expect(schema.tables.length).toBe(2);

    const usersTable = schema.tables.find((t) => t.name === "users");
    expect(usersTable).toBeDefined();
    expect(usersTable?.columns.length).toBe(3);

    const idCol = usersTable?.columns.find((c) => c.name === "id");
    expect(idCol?.pk).toBe(true);
    expect(idCol?.increment).toBe(true);

    const emailCol = usersTable?.columns.find((c) => c.name === "email");
    expect(emailCol?.notNull).toBe(true);
    expect(emailCol?.unique).toBe(true);

    // Relations
    expect(schema.relations.length).toBe(1);
    const rel = schema.relations[0];
    expect(rel.sourceTable).toBe("orders");
    expect(rel.sourceColumn).toBe("user_id");
    expect(rel.targetTable).toBe("users");
    expect(rel.targetColumn).toBe("id");
    expect(rel.cardinality).toBe("many-to-one");
    expect(rel.onDelete).toBe("cascade");
  });

  it("handles DBML syntax errors gracefully with diagnostics", () => {
    const invalidDbml = `
Table broken_table {
  id integer [pk
`;
    const result = parseDbml(invalidDbml, "postgres");
    expect(result.success).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].severity).toBe("error");
  });

  it("serializes DatabaseSchema into valid DBML format", () => {
    const schema = {
      dialect: "postgres" as const,
      tables: [
        {
          id: "products",
          name: "products",
          columns: [
            {
              id: "products_id",
              name: "id",
              type: "integer",
              pk: true,
              increment: true,
            },
            {
              id: "products_name",
              name: "name",
              type: "varchar(100)",
              notNull: true,
            },
            {
              id: "products_price",
              name: "price",
              type: "numeric(10,2)",
              defaultValue: "0.00",
            },
          ],
        },
        {
          id: "categories",
          name: "categories",
          columns: [
            {
              id: "cat_id",
              name: "id",
              type: "integer",
              pk: true,
            },
          ],
        },
      ],
      relations: [
        {
          id: "rel_1",
          sourceTable: "products",
          sourceColumn: "id",
          targetTable: "categories",
          targetColumn: "id",
          cardinality: "many-to-one" as const,
        },
      ],
    };

    const serialized = serializeDbml(schema);
    expect(serialized).toContain("Table products {");
    expect(serialized).toContain("id integer [pk, increment]");
    expect(serialized).toContain("name varchar(100) [not null]");
    expect(serialized).toContain("price numeric(10,2) [default: 0.00]");
    expect(serialized).toContain("Ref: products.id > categories.id");

    // Reparsing serialized DBML should succeed without any syntax errors
    const reparse = parseDbml(serialized, "postgres");
    expect(reparse.success).toBe(true);
    expect(reparse.schema?.tables.length).toBe(2);
    expect(reparse.schema?.relations.length).toBe(1);
  });
});

describe("Schema Validator", () => {
  it("detects missing target references and duplicate tables", () => {
    const invalidSchema = {
      dialect: "postgres" as const,
      tables: [
        {
          id: "users",
          name: "users",
          columns: [{ id: "c1", name: "id", type: "int", pk: true }],
        },
        {
          id: "users_dup",
          name: "users",
          columns: [{ id: "c2", name: "id", type: "int" }],
        },
      ],
      relations: [
        {
          id: "r1",
          sourceTable: "users",
          sourceColumn: "id",
          targetTable: "non_existent_table",
          targetColumn: "id",
          cardinality: "many-to-one" as const,
        },
      ],
    };

    const diagnostics = validateSchema(invalidSchema);
    expect(
      diagnostics.some((d) => d.message.includes("lebih dari satu kali")),
    ).toBe(true);
    expect(
      diagnostics.some((d) => d.message.includes("non_existent_table")),
    ).toBe(true);
  });

  it("detects invalid self-referencing relation connecting a column to itself", () => {
    const invalidSelfSchema = {
      dialect: "postgres" as const,
      tables: [
        {
          id: "categories",
          name: "categories",
          columns: [
            { id: "c1", name: "id", type: "int", pk: true },
            { id: "c2", name: "parent_id", type: "int" },
          ],
        },
      ],
      relations: [
        {
          id: "r_invalid_self",
          sourceTable: "categories",
          sourceColumn: "id",
          targetTable: "categories",
          targetColumn: "id",
          cardinality: "many-to-one" as const,
        },
      ],
    };

    const diagnostics = validateSchema(invalidSelfSchema);
    expect(
      diagnostics.some((d) =>
        d.message.includes(
          "tidak dapat mereferensikan kolom 'id' ke dirinya sendiri",
        ),
      ),
    ).toBe(true);
  });

  it("enriches diagnostics with accurate line numbers and fix suggestions based on DBML text", () => {
    const dbml = `Table users {
  id integer [pk]
}

Table orders {
  user_id integer
  total decimal
}
`;
    const schema = {
      dialect: "postgres" as const,
      tables: [
        {
          id: "users",
          name: "users",
          columns: [{ id: "u_id", name: "id", type: "integer", pk: true }],
        },
        {
          id: "orders",
          name: "orders",
          columns: [
            { id: "o_user_id", name: "user_id", type: "integer" },
            { id: "o_total", name: "total", type: "decimal" },
          ],
        },
      ],
      relations: [],
    };

    const diagnostics = validateSchema(schema, dbml);
    const orderWarning = diagnostics.find(
      (d) => d.message.includes("orders") && d.severity === "warning",
    );

    expect(orderWarning).toBeDefined();
    expect(orderWarning?.rule).toBe("missing-primary-key");
    expect(orderWarning?.line).toBe(5); // Table orders starts at line 5
    expect(orderWarning?.suggestion).toContain("Tambahkan atribut '[pk]'");
  });
});

describe("SQL Importer and Exporter", () => {
  it("imports PostgreSQL DDL to DBML and internal schema", () => {
    const pgDdl = `
CREATE TABLE "customers" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL
);

CREATE TABLE "invoices" (
  "id" SERIAL PRIMARY KEY,
  "customer_id" INT REFERENCES "customers" ("id")
);
`;

    const res = importSqlToDbml(pgDdl, "postgres");
    expect(res.success).toBe(true);
    expect(res.schema).toBeDefined();
    expect(res.schema?.tables.some((t) => t.name === "customers")).toBe(true);
    expect(res.schema?.tables.some((t) => t.name === "invoices")).toBe(true);
  });

  it("imports MySQL DDL and warns on triggers or procedures", () => {
    const mysqlDdl = `
CREATE TABLE \`items\` (
  \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  \`title\` varchar(255) NOT NULL
) ENGINE=InnoDB;

CREATE TRIGGER \`before_insert_items\` BEFORE INSERT ON \`items\`
FOR EACH ROW BEGIN
  SET NEW.title = UPPER(NEW.title);
END;
`;

    const res = importSqlToDbml(mysqlDdl, "mysql");
    expect(res.success).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings[0]).toContain("TRIGGER terdeteksi");
    expect(res.schema?.tables.some((t) => t.name === "items")).toBe(true);
  });

  it("exports schema to PostgreSQL and MySQL DDL", () => {
    const dbml = `
Table categories {
  id int [pk, increment]
  title varchar [not null]
}
`;
    const pgSql = exportDbmlToSql(dbml, "postgres");
    expect(pgSql).toContain("CREATE TABLE");
    expect(pgSql).toContain("categories");

    const mySql = exportDbmlToSql(dbml, "mysql");
    expect(mySql).toContain("CREATE TABLE");
    expect(mySql).toContain("categories");
  });
});

describe("Dagre Auto-Layout Engine", () => {
  it("computes non-overlapping coordinates for nodes", () => {
    const schema = {
      dialect: "postgres" as const,
      tables: [
        {
          id: "t1",
          name: "users",
          columns: [{ id: "c1", name: "id", type: "int", pk: true }],
        },
        {
          id: "t2",
          name: "orders",
          columns: [
            { id: "c2", name: "id", type: "int", pk: true },
            { id: "c3", name: "user_id", type: "int" },
          ],
        },
      ],
      relations: [
        {
          id: "r1",
          sourceTable: "orders",
          sourceColumn: "user_id",
          targetTable: "users",
          targetColumn: "id",
          cardinality: "many-to-one" as const,
        },
      ],
    };

    const positions = computeAutoLayout(schema);
    expect(positions.t1).toBeDefined();
    expect(positions.t2).toBeDefined();
    expect(positions.t1.x).not.toBe(positions.t2.x);
  });
});

describe("Project Backup Schema Validation", () => {
  it("validates full project backup JSON schema", () => {
    const sampleBackup = {
      id: "p1",
      name: "Test Backup",
      dialect: "postgres",
      dbml: "Table t1 { id int [pk] }",
      schema: {
        dialect: "postgres",
        tables: [
          {
            id: "t1",
            name: "t1",
            columns: [{ id: "c1", name: "id", type: "int", pk: true }],
          },
        ],
        relations: [],
      },
      metadata: {
        positions: {
          t1: { x: 100, y: 150 },
        },
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const parsed = ProjectBackupSchema.safeParse(sampleBackup);
    expect(parsed.success).toBe(true);
  });
});

describe("Editor Line Navigation (gotoEditorLine)", () => {
  it("sets line, column, and timestamp correctly", () => {
    useProjectStore.getState().gotoEditorLine(40, 7);
    const target = useProjectStore.getState().editorTargetLine;

    expect(target).not.toBeNull();
    expect(target?.line).toBe(40);
    expect(target?.column).toBe(7);
    expect(target?.timestamp).toBeGreaterThan(0);
  });

  it("automatically opens editor if it was closed", () => {
    useProjectStore.setState({
      ui: {
        ...useProjectStore.getState().ui,
        editorOpen: false,
      },
    });

    expect(useProjectStore.getState().ui.editorOpen).toBe(false);

    useProjectStore.getState().gotoEditorLine(25, 3);

    expect(useProjectStore.getState().ui.editorOpen).toBe(true);
    expect(useProjectStore.getState().editorTargetLine?.line).toBe(25);
  });

  it("generates a new timestamp on consecutive calls to the same line", async () => {
    useProjectStore.getState().gotoEditorLine(40, 7);
    const firstTimestamp =
      useProjectStore.getState().editorTargetLine?.timestamp;

    await new Promise((r) => setTimeout(r, 10));

    useProjectStore.getState().gotoEditorLine(40, 7);
    const secondTimestamp =
      useProjectStore.getState().editorTargetLine?.timestamp;

    expect(secondTimestamp).toBeGreaterThan(firstTimestamp ?? 0);
  });
});

describe("Auto Save Setting & Persistence", () => {
  it("defaults to autoSave: true", () => {
    expect(useProjectStore.getState().ui.autoSave).toBe(true);
  });

  it("toggles autoSave state correctly", () => {
    useProjectStore.getState().setAutoSave(false);
    expect(useProjectStore.getState().ui.autoSave).toBe(false);

    useProjectStore.getState().toggleAutoSave();
    expect(useProjectStore.getState().ui.autoSave).toBe(true);
  });

  it("keeps unsaved status without auto saving when autoSave is false", () => {
    useProjectStore.getState().setAutoSave(false);
    useProjectStore.setState({
      project: {
        id: "test_proj",
        name: "Test Project",
        dialect: "postgres",
        dbml: "Table old { id int }",
        schema: { dialect: "postgres", tables: [], relations: [] },
        metadata: { positions: {} },
        createdAt: 1000,
        updatedAt: 1000,
      },
      saveStatus: "saved",
    });

    useProjectStore.getState().setDbml("Table test_autosave { id int [pk] }");
    expect(useProjectStore.getState().saveStatus).toBe("unsaved");

    // Restore autoSave to true
    useProjectStore.getState().setAutoSave(true);
  });
});

describe("Project Save History & Restore", () => {
  it("validates ProjectHistoryItemSchema correctly", () => {
    const sampleHistory = {
      id: "hist_123",
      projectId: "proj_1",
      name: "E-Commerce",
      dialect: "postgres" as const,
      dbml: "Table users { id int [pk] }",
      schema: {
        dialect: "postgres" as const,
        tables: [
          {
            id: "users",
            name: "users",
            columns: [{ id: "c1", name: "id", type: "int", pk: true }],
          },
        ],
        relations: [],
      },
      metadata: { positions: { users: { x: 50, y: 50 } } },
      tableCount: 1,
      timestamp: Date.now(),
      label: "Manual",
    };

    const res = ProjectHistoryItemSchema.safeParse(sampleHistory);
    expect(res.success).toBe(true);
  });

  it("restores snapshot correctly and pushes previous state to undo history", async () => {
    const initialDbml = "Table current_state { id int }";
    useProjectStore.setState({
      project: {
        id: "proj_restore_test",
        name: "Restore Test",
        dialect: "postgres",
        dbml: initialDbml,
        schema: { dialect: "postgres", tables: [], relations: [] },
        metadata: { positions: {} },
        createdAt: 1000,
        updatedAt: 1000,
      },
      history: { past: [], future: [] },
    });

    const snapshot = {
      id: "hist_target",
      projectId: "proj_restore_test",
      name: "Restored Version",
      dialect: "postgres" as const,
      dbml: "Table previous_state { id int [pk] }",
      schema: {
        dialect: "postgres" as const,
        tables: [
          {
            id: "previous_state",
            name: "previous_state",
            columns: [{ id: "c1", name: "id", type: "int", pk: true }],
          },
        ],
        relations: [],
      },
      metadata: { positions: { previous_state: { x: 100, y: 100 } } },
      tableCount: 1,
      timestamp: 500,
      label: "Auto Save",
    };

    await useProjectStore.getState().restoreSnapshot(snapshot);

    const updated = useProjectStore.getState().project;
    expect(updated?.dbml).toBe(snapshot.dbml);
    expect(updated?.name).toBe("Restored Version");
    expect(updated?.schema.tables.length).toBe(1);

    // Verify previous state was pushed to past undo history
    expect(useProjectStore.getState().history.past).toContain(initialDbml);
  });
});

describe("Canvas Exporter Dimensions & Configuration", () => {
  it("calculates scaled dimensions correctly based on bounds and padding", () => {
    const customBounds = { x: 0, y: 0, width: 1000, height: 600 };
    const dim1x = calculateEstimatedDimensions(4, 50, 1, customBounds);
    expect(dim1x.width).toBe(1100);
    expect(dim1x.height).toBe(700);
    expect(dim1x.scaledWidth).toBe(1100);
    expect(dim1x.scaledHeight).toBe(700);

    const dim2x = calculateEstimatedDimensions(4, 50, 2, customBounds);
    expect(dim2x.scaledWidth).toBe(2200);
    expect(dim2x.scaledHeight).toBe(1400);

    const dim4x = calculateEstimatedDimensions(4, 20, 4, customBounds);
    expect(dim4x.width).toBe(1040);
    expect(dim4x.scaledWidth).toBe(4160);
  });

  it("handles fallback dimension calculation when custom bounds are not available", () => {
    const fallbackDim = calculateEstimatedDimensions(5, 50, 1, null);
    expect(fallbackDim.width).toBeGreaterThanOrEqual(1000);
    expect(fallbackDim.height).toBeGreaterThanOrEqual(700);
  });

  it("calculates export transform with 1:1 scale and accurate translation", () => {
    const bounds = { x: 200, y: 150, width: 800, height: 600 };
    const transform = calculateExportTransform(bounds, 50);

    // Padding is 50px on each side
    expect(transform.width).toBe(900);
    expect(transform.height).toBe(700);
    // Translation offsets to place (200, 150) at exactly (50, 50)
    expect(transform.x).toBe(-150);
    expect(transform.y).toBe(-100);
    // Crucial: Zoom must be 1.0 (natural 1:1 scale), never crushed to 0.1
    expect(transform.zoom).toBe(1);
  });

  it("computes diagram bounds correctly from table positions fallback", () => {
    const tables = [
      { name: "users", columnCount: 3 },
      { name: "posts", columnCount: 6 },
    ];
    const positions = {
      users: { x: 100, y: 100 },
      posts: { x: 600, y: 300 },
    };

    const bounds = getDiagramBounds(tables, positions);
    expect(bounds).not.toBeNull();
    expect(bounds?.x).toBe(100);
    expect(bounds?.y).toBe(100);
    expect(bounds?.width).toBeGreaterThanOrEqual(780); // 600 + 280 - 100
    expect(bounds?.height).toBeGreaterThanOrEqual(300);
  });
});

describe("Database Data Types & Validation", () => {
  it("validates standard data types for PostgreSQL and MySQL correctly", () => {
    // PostgreSQL valid types
    expect(isValidDataType("integer", "postgres")).toBe(true);
    expect(isValidDataType("varchar(255)", "postgres")).toBe(true);
    expect(isValidDataType("decimal(10,2)", "postgres")).toBe(true);
    expect(isValidDataType("jsonb", "postgres")).toBe(true);
    expect(isValidDataType("uuid", "postgres")).toBe(true);
    expect(isValidDataType("timestamptz", "postgres")).toBe(true);
    expect(isValidDataType("integer[]", "postgres")).toBe(true);

    // PostgreSQL invalid types
    expect(isValidDataType("datetime", "postgres")).toBe(false);
    expect(isValidDataType("tinyint", "postgres")).toBe(false);
    expect(isValidDataType("varchr", "postgres")).toBe(false);
    expect(isValidDataType("foobar", "postgres")).toBe(false);

    // MySQL valid types
    expect(isValidDataType("int", "mysql")).toBe(true);
    expect(isValidDataType("tinyint(1)", "mysql")).toBe(true);
    expect(isValidDataType("datetime", "mysql")).toBe(true);
    expect(isValidDataType("longtext", "mysql")).toBe(true);
    expect(isValidDataType("blob", "mysql")).toBe(true);
    expect(isValidDataType("varchar(100)", "mysql")).toBe(true);

    // MySQL invalid types
    expect(isValidDataType("jsonb", "mysql")).toBe(false);
    expect(isValidDataType("bytea", "mysql")).toBe(false);
    expect(isValidDataType("integer[]", "mysql")).toBe(false);
  });

  it("parses base type, parameters, and array indicators properly", () => {
    expect(parseBaseDataType("varchar(255)")).toEqual({
      base: "varchar",
      params: "255",
      isArray: false,
    });
    expect(parseBaseDataType("decimal(10, 2)")).toEqual({
      base: "decimal",
      params: "10, 2",
      isArray: false,
    });
    expect(parseBaseDataType('"double precision"')).toEqual({
      base: "double precision",
      params: null,
      isArray: false,
    });
    expect(parseBaseDataType("integer[]")).toEqual({
      base: "integer",
      params: null,
      isArray: true,
    });
  });

  it("provides fuzzy suggestions for misspelled data types", () => {
    const suggestions1 = getSuggestedDataTypes("varchr", "postgres");
    expect(suggestions1).toContain("varchar");

    const suggestions2 = getSuggestedDataTypes("intgerr", "postgres");
    expect(suggestions2).toContain("integer");

    const suggestions3 = getSuggestedDataTypes("timstamp", "postgres");
    expect(suggestions3).toContain("timestamp");
  });

  it("detects invalid data type error in validateSchema with suggestions", () => {
    const schema = {
      dialect: "postgres" as const,
      tables: [
        {
          id: "users",
          name: "users",
          schema: "public",
          columns: [
            { id: "c1", name: "id", type: "integer", pk: true },
            { id: "c2", name: "email", type: "varchr(255)" }, // Typo
          ],
          indexes: [],
        },
      ],
      relations: [],
    };

    const dbml = `
Table users {
  id integer [pk]
  email varchr(255)
}
`;

    const diagnostics = validateSchema(schema, dbml, "postgres");
    const typeError = diagnostics.find(
      (d) => d.rule === "invalid-column-type" && d.severity === "error",
    );

    expect(typeError).toBeDefined();
    expect(typeError?.line).toBe(4); // email varchr(255) is at line 4
    expect(typeError?.message).toContain("varchr(255)");
    expect(typeError?.message).toContain("PostgreSQL");
    expect(typeError?.suggestion).toContain("varchar");
  });

  it("validates postgres synonyms such as doubleprecision and float8 without error", () => {
    expect(isValidDataType("doubleprecision", "postgres")).toBe(true);
    expect(isValidDataType("double precision", "postgres")).toBe(true);
    expect(isValidDataType("float8", "postgres")).toBe(true);
    expect(isValidDataType("float4", "postgres")).toBe(true);
    expect(isValidDataType("int8", "postgres")).toBe(true);
    expect(isValidDataType("int4", "postgres")).toBe(true);
    expect(isValidDataType("int2", "postgres")).toBe(true);
    expect(isValidDataType("character varying(255)", "postgres")).toBe(true);
    expect(isValidDataType("timestamp with time zone", "postgres")).toBe(true);
  });

  it("validates custom enums with or without schema prefix in validateSchema", () => {
    const dbml = `
Enum "public"."jenis_sampah" {
  "Karton"
  "Etiket"
  "Paper Cup"
}

Table harga_sampah {
  id integer [pk]
  jenis public.jenis_sampah
  jenis_bare jenis_sampah
  berat doubleprecision
}
`;

    const parsed = parseDbml(dbml, "postgres");
    expect(parsed.success).toBe(true);
    expect(parsed.schema).toBeDefined();
    expect(parsed.schema?.enums?.length).toBeGreaterThanOrEqual(1);

    if (!parsed.schema) throw new Error("Parsed schema is undefined");
    const diagnostics = validateSchema(parsed.schema, dbml, "postgres");
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);
  });
});

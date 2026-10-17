import { describe, expect, it } from "vitest";
import { computeAutoLayout } from "../lib/engine/layout";
import { parseDbml } from "../lib/engine/parser";
import { serializeDbml } from "../lib/engine/serializer";
import { exportDbmlToSql } from "../lib/engine/sql-exporter";
import { importSqlToDbml } from "../lib/engine/sql-importer";
import { validateSchema } from "../lib/engine/validator";
import { ProjectBackupSchema } from "../lib/types/schema";

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
      ],
      relations: [],
    };

    const serialized = serializeDbml(schema);
    expect(serialized).toContain("Table products {");
    expect(serialized).toContain("id integer [pk, increment]");
    expect(serialized).toContain("name varchar(100) [not null]");
    expect(serialized).toContain("price numeric(10,2) [default: 0.00]");

    // Reparsing serialized DBML should succeed
    const reparse = parseDbml(serialized, "postgres");
    expect(reparse.success).toBe(true);
    expect(reparse.schema?.tables[0].columns.length).toBe(3);
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

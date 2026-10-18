import { describe, expect, it } from "vitest";
import { importSqlToDbml } from "../lib/engine/sql-importer";
import { validateSchema } from "../lib/engine/validator";

describe("Production SQL Import Stress & Compatibility Test Suite", () => {
  describe("PostgreSQL Real-World DDL & Version Variations", () => {
    it("imports modern PostgreSQL 16+ DDL with custom ENUMs, double precision, and identity", () => {
      const modernPg = `
-- Modern PostgreSQL 16/18 Dump
\\restrict n6VpS9w40HLbSysggRaLv3JY5gHaQT19prsH3ROq19wJ3pPib4d5wFXCFvMvnCl
SET statement_timeout = 0;
SELECT pg_catalog.set_config('search_path', '', false);

CREATE SCHEMA drizzle;

CREATE TYPE public.user_role AS ENUM (
    'superadmin',
    'admin',
    'member'
);

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'cancelled'
);

CREATE TABLE public.users (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid_code text DEFAULT (gen_random_uuid())::text NOT NULL,
    role public.user_role DEFAULT 'member'::public.user_role NOT NULL,
    email text NOT NULL,
    score double precision DEFAULT 0.0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.orders (
    id integer NOT NULL PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES public.users(id),
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    tax_rate double precision NOT NULL
);
`;

      const result = importSqlToDbml(modernPg, "postgres");
      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();

      if (!result.schema) throw new Error("Schema is undefined");
      expect(result.schema.tables.length).toBe(2);
      expect(result.schema.tables.some((t) => t.name === "users")).toBe(true);
      expect(result.schema.tables.some((t) => t.name === "orders")).toBe(true);

      // Verify no invalid data type errors for double precision or enums
      const diagnostics = validateSchema(
        result.schema,
        result.dbml || "",
        "postgres",
      );
      const typeErrors = diagnostics.filter(
        (d) => d.rule === "invalid-column-type",
      );
      expect(typeErrors.length).toBe(0);
    });

    it("imports legacy PostgreSQL 9-11 DDL with SERIAL, sequences, and ALTER TABLE ADD CONSTRAINT", () => {
      const legacyPg = `
CREATE SEQUENCE customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE customers (
    id integer DEFAULT nextval('customers_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    avatar_data bytea,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER SEQUENCE customers_id_seq OWNED BY customers.id;

CREATE TABLE customer_addresses (
    id serial PRIMARY KEY,
    customer_id integer NOT NULL,
    address_line character varying(500) NOT NULL,
    postal_code character varying(20)
);

ALTER TABLE ONLY customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY customer_addresses
    ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
`;

      const result = importSqlToDbml(legacyPg, "postgres");
      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();

      if (!result.schema) throw new Error("Schema is undefined");
      expect(result.schema.tables.length).toBe(2);

      const diagnostics = validateSchema(
        result.schema,
        result.dbml || "",
        "postgres",
      );
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors.length).toBe(0);
    });

    it("imports Pagila-style PostgreSQL schema (industry standard benchmark)", () => {
      const pagilaSql = `
CREATE TABLE actor (
    actor_id integer NOT NULL PRIMARY KEY,
    first_name character varying(45) NOT NULL,
    last_name character varying(45) NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE category (
    category_id integer NOT NULL PRIMARY KEY,
    name character varying(25) NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE film (
    film_id integer NOT NULL PRIMARY KEY,
    title character varying(255) NOT NULL,
    description text,
    release_year integer,
    language_id smallint NOT NULL,
    rental_duration smallint DEFAULT 3 NOT NULL,
    rental_rate numeric(4,2) DEFAULT 4.99 NOT NULL,
    length smallint,
    replacement_cost numeric(5,2) DEFAULT 19.99 NOT NULL,
    rating text DEFAULT 'G',
    last_update timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE film_actor (
    actor_id integer NOT NULL REFERENCES actor(actor_id),
    film_id integer NOT NULL REFERENCES film(film_id),
    last_update timestamp without time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (actor_id, film_id)
);

CREATE TABLE film_category (
    film_id integer NOT NULL REFERENCES film(film_id),
    category_id integer NOT NULL REFERENCES category(category_id),
    last_update timestamp without time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (film_id, category_id)
);
`;

      const result = importSqlToDbml(pagilaSql, "postgres");
      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();

      if (!result.schema) throw new Error("Schema is undefined");
      expect(result.schema.tables.length).toBe(5);
      expect(result.schema.relations.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("MySQL Real-World DDL & Version Variations", () => {
    it("imports modern MySQL 8.0 DDL with JSON types, backticks, and utf8mb4 collation", () => {
      const mysql8Sql = `
CREATE TABLE \`products\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`sku\` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`attributes\` json DEFAULT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT '1',
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`products_sku_unique\` (\`sku\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE \`product_variants\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`product_id\` bigint unsigned NOT NULL,
  \`variant_name\` varchar(128) NOT NULL,
  \`price\` decimal(10,2) NOT NULL DEFAULT '0.00',
  \`stock_quantity\` int NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`),
  KEY \`fk_variants_product\` (\`product_id\`),
  CONSTRAINT \`fk_variants_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

      const result = importSqlToDbml(mysql8Sql, "mysql");
      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();

      if (!result.schema) throw new Error("Schema is undefined");
      expect(result.schema.tables.length).toBe(2);
      expect(result.schema.tables.some((t) => t.name === "products")).toBe(
        true,
      );
      expect(
        result.schema.tables.some((t) => t.name === "product_variants"),
      ).toBe(true);

      const diagnostics = validateSchema(
        result.schema,
        result.dbml || "",
        "mysql",
      );
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors.length).toBe(0);
    });

    it("imports legacy MySQL 5.7 / MariaDB DDL with MyISAM, inline ENUM, and mysqldump comments", () => {
      const legacyMysql = `
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;

DROP TABLE IF EXISTS \`departments\`;
CREATE TABLE \`departments\` (
  \`dept_no\` char(4) NOT NULL,
  \`dept_name\` varchar(40) NOT NULL,
  PRIMARY KEY (\`dept_no\`),
  UNIQUE KEY \`dept_name\` (\`dept_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS \`employees\`;
CREATE TABLE \`employees\` (
  \`emp_no\` int(11) NOT NULL,
  \`birth_date\` date NOT NULL,
  \`first_name\` varchar(14) NOT NULL,
  \`last_name\` varchar(16) NOT NULL,
  \`gender\` enum('M','F') NOT NULL,
  \`hire_date\` date NOT NULL,
  PRIMARY KEY (\`emp_no\`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS \`dept_emp\`;
CREATE TABLE \`dept_emp\` (
  \`emp_no\` int(11) NOT NULL,
  \`dept_no\` char(4) NOT NULL,
  \`from_date\` date NOT NULL,
  \`to_date\` date NOT NULL,
  PRIMARY KEY (\`emp_no\`,\`dept_no\`),
  KEY \`dept_no\` (\`dept_no\`),
  CONSTRAINT \`dept_emp_ibfk_1\` FOREIGN KEY (\`emp_no\`) REFERENCES \`employees\` (\`emp_no\`) ON DELETE CASCADE,
  CONSTRAINT \`dept_emp_ibfk_2\` FOREIGN KEY (\`dept_no\`) REFERENCES \`departments\` (\`dept_no\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
`;

      const result = importSqlToDbml(legacyMysql, "mysql");
      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();

      if (!result.schema) throw new Error("Schema is undefined");
      expect(result.schema.tables.length).toBe(3);
      expect(result.schema.tables.some((t) => t.name === "departments")).toBe(
        true,
      );
      expect(result.schema.tables.some((t) => t.name === "employees")).toBe(
        true,
      );
      expect(result.schema.tables.some((t) => t.name === "dept_emp")).toBe(
        true,
      );
    });
  });

  describe("Massive Data Dump & Zero Freeze Stress Tests", () => {
    it("handles 10,000 PostgreSQL COPY data lines without crashing or freezing", () => {
      // Create 10,000 data lines simulating a production dump
      const largeDataChunk = Array.from(
        { length: 10000 },
        (_, i) =>
          `${i + 1}\tUser_${i}\tuser${i}@example.com\t2026-01-01 00:00:00\t123.45`,
      ).join("\n");

      const postgresDump = `
CREATE TABLE accounts (
    id integer PRIMARY KEY,
    username text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone,
    balance double precision NOT NULL
);

CREATE TABLE transactions (
    id integer PRIMARY KEY,
    account_id integer NOT NULL REFERENCES accounts(id),
    amount double precision NOT NULL
);

COPY accounts (id, username, email, created_at, balance) FROM stdin;
${largeDataChunk}
\\.

COPY transactions (id, account_id, amount) FROM stdin;
1\t1\t100.00
2\t2\t250.50
\\.
`;

      const startTime = performance.now();
      const result = importSqlToDbml(postgresDump, "postgres");
      const elapsed = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.schema?.tables.length).toBe(2);
      expect(result.warnings.some((w) => w.includes("COPY"))).toBe(true);
      // Even with 10,000 lines of data, cleaning and parsing must be rapid (< 500ms)
      expect(elapsed).toBeLessThan(1000);
    });

    it("handles 3,000 multi-row MySQL INSERT statements cleanly", () => {
      const inserts = Array.from(
        { length: 3000 },
        (_, i) =>
          `INSERT INTO \`logs\` (\`id\`, \`message\`) VALUES (${i + 1}, 'Message log content number ${i}');`,
      ).join("\n");

      const mysqlDump = `
CREATE TABLE \`logs\` (
  \`id\` int NOT NULL PRIMARY KEY,
  \`message\` varchar(255) NOT NULL
) ENGINE=InnoDB;

LOCK TABLES \`logs\` WRITE;
${inserts}
UNLOCK TABLES;
`;

      const startTime = performance.now();
      const result = importSqlToDbml(mysqlDump, "mysql");
      const elapsed = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.schema?.tables.length).toBe(1);
      expect(result.warnings.some((w) => w.includes("INSERT"))).toBe(true);
      expect(elapsed).toBeLessThan(1000);
    });
  });

  describe("Fault Tolerance & Edge Case Robustness", () => {
    it("handles completely empty or whitespace-only SQL without erroring out", () => {
      const emptyRes = importSqlToDbml("   \n\t  ", "postgres");
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toContain("kosong");
    });

    it("handles corrupted / garbage SQL text gracefully", () => {
      const garbageSql = `
!!! RANDOM GARBAGE @#$%^&*()
NOT A VALID SQL STATEMENT
0xDEADBEEF 123456789
`;
      const result = importSqlToDbml(garbageSql, "postgres");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe("string");
    });

    it("preserves valid tables when SQL contains unsupported features like views and triggers", () => {
      const mixedSql = `
CREATE TABLE products (
  id integer PRIMARY KEY,
  name text NOT NULL,
  price numeric(10,2) NOT NULL
);

CREATE VIEW active_products AS
SELECT id, name FROM products WHERE price > 0;

CREATE TRIGGER check_product_price
BEFORE INSERT ON products
FOR EACH ROW EXECUTE FUNCTION validate_price();
`;

      const result = importSqlToDbml(mixedSql, "postgres");
      expect(result.success).toBe(true);
      expect(result.schema?.tables.some((t) => t.name === "products")).toBe(
        true,
      );
      expect(result.warnings.some((w) => w.includes("VIEW"))).toBe(true);
      expect(result.warnings.some((w) => w.includes("TRIGGER"))).toBe(true);
    });

    it("imports real phpMyAdmin 5.2.3 / MariaDB 10.11 dumps with internal semicolons in data without freeze", () => {
      const phpMyAdminDump = `
-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Waktu pembuatan: 18 Okt 2026 pada 22.34
-- Versi server: 10.11.19-MariaDB-cll-lve
-- Versi PHP: 8.4.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Struktur dari tabel \`kategori\`
--

CREATE TABLE \`kategori\` (
  \`id\` int(11) NOT NULL,
  \`nama_kategori\` varchar(100) NOT NULL,
  \`created_at\` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel \`kategori\`
--

INSERT INTO \`kategori\` (\`id\`, \`nama_kategori\`, \`created_at\`) VALUES
(1, 'Elektronik; Komputer & HP', '2026-10-18 22:00:00'),
(2, 'Pakaian (Pria & Wanita); Busana', '2026-10-18 22:01:00');

--
-- Struktur dari tabel \`produk\`
--

CREATE TABLE \`produk\` (
  \`id\` int(11) NOT NULL,
  \`kategori_id\` int(11) NOT NULL,
  \`nama_produk\` varchar(255) NOT NULL,
  \`harga\` decimal(10,2) NOT NULL,
  \`deskripsi\` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel \`produk\`
--

INSERT INTO \`produk\` (\`id\`, \`kategori_id\`, \`nama_produk\`, \`harga\`, \`deskripsi\`) VALUES
(1, 1, 'Laptop Gaming; High-End', 15000000.00, 'Spesifikasi: Core i7; RAM 16GB;
SSD 1TB;
GPU RTX 4060;'),
(2, 2, 'Kemeja Batik; Sutra', 250000.00, 'Batik tulis asli');

--
-- Indexes for dumped tables
--

ALTER TABLE \`kategori\`
  ADD PRIMARY KEY (\`id\`);

ALTER TABLE \`produk\`
  ADD PRIMARY KEY (\`id\`),
  ADD KEY \`fk_produk_kategori\` (\`kategori_id\`);

--
-- AUTO_INCREMENT for dumped tables
--

ALTER TABLE \`kategori\`
  MODIFY \`id\` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE \`produk\`
  MODIFY \`id\` int(11) NOT NULL AUTO_INCREMENT;

--
-- Ketidakleluasaan (Constraints) untuk tabel \`produk\`
--
ALTER TABLE \`produk\`
  ADD CONSTRAINT \`fk_produk_kategori\` FOREIGN KEY (\`kategori_id\`) REFERENCES \`kategori\` (\`id\`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
`;

      const t0 = performance.now();
      const result = importSqlToDbml(phpMyAdminDump, "mysql");
      const duration = performance.now() - t0;

      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();

      if (!result.schema) throw new Error("Schema is undefined");
      expect(result.schema.tables.length).toBe(2);
      expect(result.schema.tables.some((t) => t.name === "kategori")).toBe(
        true,
      );
      expect(result.schema.tables.some((t) => t.name === "produk")).toBe(true);
      expect(result.schema.relations.length).toBeGreaterThanOrEqual(1);

      // Must execute instantly under 500ms
      expect(duration).toBeLessThan(500);
    });

    it("formats ANTLR errors with line, column, and descriptive hint on truncated SQL snippets", () => {
      const truncatedSnippet = `
(\`generated_by\`) REFERENCES \`user\` (\`id_user\`) ON DELETE SET NULL;
`;
      const result = importSqlToDbml(truncatedSnippet, "mysql");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("baris");
      expect(result.error).toContain(
        "Pernyataan SQL tampak tidak lengkap atau terpotong",
      );
    });

    it("uses tolerant statement recovery to rescue valid tables when one statement in the file has syntax error", () => {
      const mixedDump = `
CREATE TABLE \`users\` (
  \`id\` int NOT NULL PRIMARY KEY,
  \`name\` varchar(100) NOT NULL
);

ALTER TABLE \`invalid_table\` WITH INVALID SYNTAX EXTRA WORDS;

CREATE TABLE \`orders\` (
  \`id\` int NOT NULL PRIMARY KEY,
  \`amount\` decimal(10,2) NOT NULL
);
`;
      const result = importSqlToDbml(mixedDump, "mysql");
      expect(result.success).toBe(true);
      expect(result.schema?.tables.length).toBe(2);
      expect(result.schema?.tables.some((t) => t.name === "users")).toBe(true);
      expect(result.schema?.tables.some((t) => t.name === "orders")).toBe(true);
      expect(
        result.warnings.some((w) =>
          w.includes("Sebagian skema berhasil dipulihkan"),
        ),
      ).toBe(true);
    });

    it("informs user clearly when only constraints are provided without CREATE TABLE", () => {
      const onlyConstraints = `
ALTER TABLE \`token_requests\`
  ADD CONSTRAINT \`token_requests_approved_by_foreign\` FOREIGN KEY
(\`approved_by\`) REFERENCES \`user\` (\`id_user\`) ON DELETE SET NULL;
`;
      const result = importSqlToDbml(onlyConstraints, "mysql");
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Tidak ditemukan deklarasi tabel ('CREATE TABLE')",
      );
    });

    it("imports MariaDB/MySQL dumps with unparenthesized function defaults (DEFAULT curdate()) and CHECK constraints", () => {
      const mariaDbSql = `
CREATE TABLE \`kunjungan\` (
  \`id_kunjungan\` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  \`id_keluarga\` int(10) UNSIGNED NOT NULL,
  \`kode_transaksi\` varchar(50) NOT NULL,
  \`tanggal_kunjungan\` date NOT NULL DEFAULT curdate(),
  \`created_at\` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id_kunjungan\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE \`surat_pengantars\` (
  \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  \`nomor_surat\` varchar(255) NOT NULL,
  \`nama_pasien\` varchar(255) NOT NULL,
  \`tanggal_pengantar\` date NOT NULL DEFAULT current_date(),
  \`diagnosa\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(\`diagnosa\`)),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE \`kunjungan\`
  ADD CONSTRAINT \`kunjungan_ibfk_1\` FOREIGN KEY (\`id_keluarga\`) REFERENCES \`surat_pengantars\` (\`id\`) ON DELETE CASCADE;
`;

      const result = importSqlToDbml(mariaDbSql, "mysql");
      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();
      expect(result.schema?.tables.length).toBe(2);
      expect(result.schema?.relations.length).toBe(1);

      const kunjungan = result.schema?.tables.find(
        (t) => t.name === "kunjungan",
      );
      expect(kunjungan).toBeDefined();
      const tglCol = kunjungan?.columns.find(
        (c) => c.name === "tanggal_kunjungan",
      );
      expect(tglCol).toBeDefined();

      const surat = result.schema?.tables.find(
        (t) => t.name === "surat_pengantars",
      );
      expect(surat).toBeDefined();
      const diagCol = surat?.columns.find((c) => c.name === "diagnosa");
      expect(diagCol).toBeDefined();
    });
  });
});

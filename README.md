# Live DB Diagram

Aplikasi web visual lokal untuk merancang, memvisualisasikan, mengedit, mengimpor, dan mengekspor struktur skema database **MySQL** dan **PostgreSQL** secara real-time.

Aplikasi ini beroperasi 100% di browser lokal pada perangkat Anda tanpa memerlukan akun, autentikasi, database server internal, maupun koneksi ke backend eksternal.

---

## Fitur Utama

- **Live Two-Way Synchronization**:
  - Perubahan kode DBML langsung memperbarui diagram relasi ERD.
  - Perubahan visual pada diagram (menambah tabel/kolom/relasi) langsung memperbarui kode DBML di editor.
- **Visual ERD Canvas (@xyflow/react)**:
  - Drag-and-drop tabel dengan penataan koordinat otomatis.
  - Garis relasi interaktif dengan indikator kardinalitas (`1:1`, `1:N`, `N:M`).
  - MiniMap, zoom, pan, dan kontrol canvas.
  - Menghubungkan foreign key secara visual hanya dengan menarik titik handle kolom ke tabel lain.
- **Monaco DBML Editor**:
  - Syntax highlighting DBML menggunakan `@dbml/core` monarch tokens.
  - Validasi sintaks real-time dan error markers (diagnostics).
  - Panel editor yang dapat dibuka, ditutup, dan diubah ukurannya (resizable drawer).
- **Auto Layout (Dagre)**:
  - Tombol **Auto Layout** untuk menata posisi semua tabel dan relasi secara rapi seketika.
- **Penyimpanan Lokal (IndexedDB)**:
  - Autosave dengan debounce langsung ke IndexedDB peramban Anda.
  - Pengelola proyek: buat proyek baru, buka, duplikasi, dan hapus proyek.
- **Impor & Ekspor Lengkap**:
  - **Impor**: DBML, PostgreSQL DDL SQL, MySQL DDL SQL, dan File Cadangan JSON.
  - **Ekspor**: PostgreSQL SQL, MySQL SQL, DBML, dan Backup JSON (termasuk metadata koordinat).
  - Tombol salin SQL langsung ke papan klip (clipboard).
- **Inspektor Properti Interaktif**:
  - Edit nama tabel, nama kolom, tipe data, Primary Key (PK), Auto Increment, Not Null, Unique, Default Value, dan aturan On Delete/Update relasi.
- **Undo & Redo**:
  - Dukungan pintasan `Ctrl + Z` dan `Ctrl + Y` untuk membatalkan dan mengulangi perubahan skema.
- **Tema Gelap & Terang**:
  - Dukungan visual Dark mode dan Light mode.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) App Router (v16.4)
- **Library UI**: React 19 & TypeScript
- **Styling**: Tailwind CSS v4
- **Diagram Engine**: `@xyflow/react` (React Flow)
- **Editor**: `@monaco-editor/react` & `@dbml/core`
- **State Management**: Zustand
- **Penyimpanan**: IndexedDB (`idb`) & LocalStorage
- **Auto Layout**: `@dagrejs/dagre`
- **Testing**: Vitest
- **Linter & Formatter**: Biome

---

## Panduan Instalasi & Menjalankan Proyek

Pastikan Anda telah memasang **[Bun](https://bun.sh/)** (atau Node.js versi 20+).

### 1. Pasang Dependensi
```bash
bun install
```

### 2. Jalankan Server Pengembangan
```bash
bun run dev
```
Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

### 3. Jalankan Pengujian (Unit Tests)
```bash
bun run test
```

### 4. Periksa Linting & Format Kode
```bash
bun run lint
bun run format
```

### 5. Kompilasi Produksi (Production Build)
```bash
bun run build
bun run start
```

---

## Pintasan Keyboard & Navigasi

| Pintasan | Keterangan |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | Membatalkan perubahan skema terakhir (Undo) |
| `Ctrl + Y` / `Cmd + Shift + Z` | Mengulangi perubahan skema (Redo) |
| **Tarik Titik Handle Kolom** | Menghubungkan relasi Foreign Key antar tabel |
| **Klik Tabel** | Membuka editor properti kolom di panel inspektor |
| **Klik Garis / Label Relasi** | Mengedit kardinalitas dan aturan `ON DELETE` relasi |
| **Scroll Mouse** | Memperbesar / memperkecil tampilan kanvas (Zoom) |

---

## Keamanan & Privasi Data

Aplikasi ini bekerja sepenuhnya di sisi klien (*client-side*). Seluruh skema database dan definisi tabel Anda tersimpan di media penyimpanan lokal browser Anda (**IndexedDB**) dan **tidak pernah dikirim ke server pihak ketiga mana pun**.

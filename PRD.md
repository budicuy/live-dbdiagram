# TUJUAN PROYEK

Bangun aplikasi web lokal untuk merancang, memvisualisasikan, mengedit, mengimpor, dan mengekspor struktur database MySQL dan PostgreSQL.

Aplikasi terinspirasi oleh alur kerja dbdiagram.io, tetapi harus memiliki identitas visual sendiri.

Aplikasi ini ditujukan untuk penggunaan lokal pada satu perangkat. Tidak diperlukan sistem akun, autentikasi, backend API untuk pengelolaan proyek, atau database server internal.

Fokus utama adalah membuat editor database visual yang benar-benar berfungsi dengan sinkronisasi antara editor kode dan diagram ERD.

# 1. STACK TEKNOLOGI

Gunakan:

- Next.js App Router.
- React dan TypeScript dengan strict mode.
- Tailwind CSS.
- shadcn/ui.
- React Flow menggunakan paket @xyflow/react.
- Monaco Editor menggunakan @monaco-editor/react.
- @dbml/core untuk parsing DBML dan fitur impor/ekspor SQL yang didukung.
- Zustand untuk pengelolaan state aplikasi.
- IndexedDB untuk penyimpanan proyek lokal.
- ELK.js atau Dagre untuk automatic layout.
- Vitest untuk unit testing.
- Zod untuk validasi input yang sesuai.

Jangan gunakan Prisma, Drizzle ORM, PostgreSQL internal, MySQL internal, sistem autentikasi, atau layanan backend eksternal.

Jangan menambahkan ORM karena aplikasi ini tidak membutuhkan akses ke database internal.

Semua fitur inti harus dapat digunakan tanpa koneksi internet setelah aplikasi dan dependensinya tersedia secara lokal.

Pastikan fitur parsing dan konversi skema dapat berjalan di browser. Periksa kompatibilitas @dbml/core dengan lingkungan browser. Jika suatu bagian memerlukan Node.js, gunakan adapter yang sesuai atau implementasikan pemrosesan lokal yang kompatibel tanpa menambahkan backend permanen.

# 2. ARSITEKTUR APLIKASI

Buat arsitektur client-side dengan komponen berikut:

1. UI aplikasi.
2. Editor DBML.
3. Diagram ERD.
4. Schema engine.
5. Adapter MySQL dan PostgreSQL.
6. Modul impor dan ekspor.
7. Penyimpanan proyek lokal.
8. Modul pengaturan dan preferensi.

Gunakan satu model skema internal sebagai sumber data utama untuk editor dan diagram.

Jangan menyimpan kode, diagram, dan data tabel sebagai tiga sumber data terpisah yang dapat mengalami ketidaksinkronan.

Pisahkan metadata posisi diagram dari definisi skema database.

# 3. ANTARMUKA PENGGUNA

Buat antarmuka profesional yang menyerupai aplikasi developer modern.

Sediakan:

- Tema terang dan gelap.
- Bilah navigasi atas.
- Nama proyek yang dapat diubah.
- Pilihan dialect MySQL atau PostgreSQL.
- Status penyimpanan lokal.
- Tombol Undo dan Redo jika didukung.
- Menu impor dan ekspor.
- Tombol Auto Layout.
- Kontrol zoom dan Fit to Screen.

Panel kiri:
- Daftar tabel.
- Pencarian tabel dan kolom.
- Tombol tambah tabel.
- Penanda primary key dan foreign key.

Panel tengah:
- Kanvas ERD interaktif.
- Node tabel kustom.
- Garis relasi.
- Drag-and-drop.
- Zoom dan pan.
- Pemilihan tabel dan relasi.
- Automatic layout.

Panel kanan:
- Editor properti tabel.
- Editor properti kolom.
- Editor relasi.
- Tipe data.
- Primary key.
- Foreign key.
- Nullable.
- Unique.
- Default value.
- Index dan komentar.

Sediakan panel editor DBML yang dapat dibuka, ditutup, dan diubah ukurannya.

Setiap tombol yang terlihat harus mempunyai fungsi yang nyata.

# 4. MESIN SKEMA

Gunakan DBML sebagai bahasa definisi skema utama.

Implementasikan:

- Parsing DBML.
- Serialisasi DBML.
- Normalisasi skema.
- Validasi skema.
- Diagnostik kesalahan.
- Impor DDL SQL yang didukung.
- Ekspor DDL SQL.
- Dukungan dialect.
- Pemeliharaan metadata.

Model skema harus mendukung tabel, kolom, tipe data, primary key, composite key, foreign key, unique constraint, indeks, default value, nullability, komentar, dan relasi.

Gunakan @dbml/core sesuai API yang benar-benar tersedia pada versi yang digunakan.

Jangan mengarang fungsi library atau mengklaim dukungan fitur yang belum diverifikasi.

Jika sebuah fitur SQL belum didukung, berikan peringatan yang jelas dan jangan menghilangkan informasi secara diam-diam.

# 5. EDITOR DAN DIAGRAM

Implementasikan sinkronisasi dua arah.

DBML berubah:
- Parsing kode.
- Validasi skema.
- Perbarui model internal.
- Perbarui diagram jika parsing berhasil.

Diagram berubah:
- Perbarui model internal.
- Serialisasikan menjadi DBML.
- Perbarui editor kode.

Gunakan debounce untuk parsing.

Jika DBML tidak valid, pertahankan diagram valid terakhir dan tampilkan diagnostik pada editor.

Gunakan ID stabil untuk tabel dan kolom jika memungkinkan.

Pisahkan perubahan posisi tabel dari perubahan struktur database.

Implementasikan penambahan, pengeditan, dan penghapusan tabel, kolom, serta foreign key.

Sediakan dukungan relasi one-to-one dan one-to-many, serta pemodelan many-to-many melalui tabel penghubung.

# 6. DUKUNGAN DATABASE

Dukung dua target:

- MySQL.
- PostgreSQL.

Pilihan dialect harus memengaruhi validasi dan SQL yang dihasilkan.

Tangani perbedaan tipe data, auto-increment, identity columns, JSON dan JSONB, UNSIGNED, schema namespace, indeks, serta constraint sejauh didukung oleh schema engine.

Jangan mengeksekusi SQL yang diimpor.

SQL hanya digunakan sebagai input definisi skema dan tidak boleh dijalankan terhadap database apa pun.

Dokumentasikan fitur SQL yang didukung dan berikan peringatan untuk konversi yang berpotensi kehilangan semantik.

# 7. PENYIMPANAN LOKAL

Gunakan IndexedDB sebagai penyimpanan utama proyek.

Buat modul penyimpanan lokal dengan operasi:

- Membuat proyek.
- Membaca proyek.
- Mengubah proyek.
- Menghapus proyek.
- Menduplikasi proyek.
- Menyimpan DBML.
- Menyimpan snapshot skema.
- Menyimpan posisi diagram.
- Menyimpan preferensi proyek.

Implementasikan autosave dengan debounce.

Tampilkan status:
- Belum tersimpan.
- Sedang menyimpan.
- Tersimpan.
- Gagal menyimpan.

Jangan menyatakan penyimpanan berhasil sebelum operasi IndexedDB selesai.

Gunakan localStorage hanya untuk preferensi ringan, misalnya tema atau preferensi antarmuka.

Tambahkan mekanisme pemulihan jika aplikasi ditutup saat perubahan belum tersimpan.

# 8. IMPOR DAN EKSPOR FILE

Sediakan:

- Impor DBML.
- Impor SQL MySQL.
- Impor SQL PostgreSQL.
- Ekspor DBML.
- Ekspor SQL MySQL.
- Ekspor SQL PostgreSQL.
- Ekspor dan impor proyek lengkap sebagai JSON.
- Unduh file.
- Salin SQL ke clipboard.

Format proyek JSON harus dapat mempertahankan definisi skema, dialect, dan metadata posisi diagram.

Validasi file sebelum mengganti proyek yang sedang aktif.

Jika impor gagal, jangan menghapus atau menimpa proyek yang sedang terbuka.

Jangan menggunakan regular expression sebagai satu-satunya metode untuk mem-parsing seluruh sintaks SQL.

# 9. KEAMANAN DAN PRIVASI

Aplikasi tidak memerlukan akun atau pengiriman data ke server eksternal.

Semua proyek disimpan di perangkat pengguna.

Jangan mengirim skema, file SQL, atau isi proyek ke layanan pihak ketiga.

Jangan menjalankan SQL impor.

Validasi file yang diimpor dan tangani input yang tidak valid secara aman.

Jelaskan dalam dokumentasi bahwa data IndexedDB dapat hilang jika data situs dihapus oleh pengguna atau browser.

Sediakan ekspor file proyek sebagai mekanisme backup.

# 10. PENGUJIAN

Buat pengujian untuk:

- Parsing DBML.
- Serialisasi DBML.
- Validasi skema.
- Primary key dan foreign key.
- Composite key.
- Relasi.
- Impor SQL MySQL.
- Impor SQL PostgreSQL.
- Ekspor SQL MySQL.
- Ekspor SQL PostgreSQL.
- Peringatan fitur yang tidak didukung.
- Sinkronisasi kode dan diagram.
- Penyimpanan dan pemuatan proyek.
- Impor dan ekspor JSON.
- Pemeliharaan posisi diagram.
- Pemulihan saat parsing gagal.

Tambahkan pengujian end-to-end untuk alur pembuatan proyek, pengeditan diagram, perubahan DBML, penyimpanan lokal, pemuatan kembali, dan ekspor SQL.

Jangan mengklaim hasil pengujian berhasil jika pengujian belum dijalankan.

# 11. TAHAPAN IMPLEMENTASI

Tahap pertama:
- Periksa repository.
- Siapkan Next.js.
- Verifikasi kompatibilitas library.
- Implementasikan parsing DBML.
- Render diagram dasar.

Tahap kedua:
- Implementasikan editor DBML.
- Implementasikan sinkronisasi kode dan diagram.
- Implementasikan editing tabel, kolom, dan relasi.

Tahap ketiga:
- Implementasikan impor dan ekspor SQL.
- Tambahkan dukungan dialect MySQL dan PostgreSQL.
- Tambahkan diagnostik dan validasi.

Tahap keempat:
- Implementasikan penyimpanan IndexedDB.
- Implementasikan manajemen proyek lokal.
- Implementasikan impor dan ekspor proyek JSON.

Tahap kelima:
- Tambahkan automatic layout.
- Tambahkan Undo dan Redo.
- Sempurnakan antarmuka.
- Jalankan pengujian dan perbaiki masalah.

Setelah setiap tahap, jalankan pengujian yang relevan dan pastikan aplikasi tetap dapat dijalankan.

Jangan berhenti pada mockup atau rencana. Lanjutkan sampai fitur inti berfungsi.

# 12. KRITERIA SELESAI

Aplikasi dianggap siap sebagai MVP jika:

1. Berjalan secara lokal.
2. Tidak membutuhkan akun atau backend untuk fitur inti.
3. DBML valid menghasilkan diagram yang benar.
4. Perubahan diagram memperbarui DBML.
5. Diagram valid terakhir tetap tersedia saat kode mengalami kesalahan.
6. DDL MySQL dan PostgreSQL dapat diimpor sesuai subset yang didukung.
7. SQL dapat diekspor sesuai dialect yang dipilih.
8. Proyek tersimpan dan dapat dibuka kembali dari IndexedDB.
9. File proyek dapat diekspor dan diimpor.
10. Posisi diagram tersimpan.
11. Tidak ada informasi yang dihilangkan diam-diam saat konversi.
12. Pengujian yang relevan lulus.
13. Instruksi instalasi dan penggunaan tersedia dalam README berbahasa Indonesia.

Mulailah dengan memeriksa repository dan membuktikan alur DBML menjadi diagram ERD. Prioritaskan ketepatan mesin skema dan sinkronisasi editor daripada fitur tambahan.
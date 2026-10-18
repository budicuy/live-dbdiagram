<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aturan Kerja Agent (Workflow Rules)

1. **Wajib Membuat Plan Sebelum Eksekusi**:
   - Selalu buat dokumen atau ringkasan rencana kerja (plan) terlebih dahulu sebelum mengubah kode atau mengeksekusi implementasi fitur/perbaikan bug.
   - Tunggu konfirmasi atau persetujuan pengguna sebelum melakukan perubahan kode, kecuali pengguna secara eksplisit memberikan perintah langsung seperti `"eksekusi"`, `"lanjutkan"`, atau *"langsung eksekusi"*.
   - Rencana harus mencakup analisis kebutuhan/masalah, daftar file yang akan dimodifikasi, dan rencana verifikasi.

2. **Larangan Melakukan Git Commit / Push**:
   - DILARANG menjalankan `git commit` atau `git push`.
   - Seluruh perubahan kode harus ditinggalkan dalam status *working tree* karena pengelolaan commit dilakukan sendiri oleh pengguna.

3. **Standar Kebersihan dan Kualitas Kode**:
   - Jalankan `bun run lint` (TypeScript + Biome) dan pastikan 0 error serta 0 warning.
   - Jalankan `bun test` dan pastikan seluruh unit test lolos 100%.
   - Selalu bersihkan kode lama yang sudah usang dan hindari variabel/kode tak terpakai.

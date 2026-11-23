# Personal Finance — Ali Irawan

Situs pribadi statis: **Personal Finance** (jalan penuh), **Portfolio & LinkedIn Branding** dan **Education Lifeskill** (coming soon).
Dibuat untuk GitHub Pages. Tanpa framework, tanpa build step.

## Cara kerjanya

- Data disimpan di **browser** (`localStorage`). Situs langsung jalan tanpa setup apa pun.
- Kalau mau sinkron antar perangkat, hubungkan ke **Google Sheet** lewat Apps Script (langkah di bawah).
- **URL Sheet dan kunci rahasianya tidak ada di dalam kode.** Kamu isi sekali di halaman Profil & Pengaturan, tersimpan di browser itu saja. Aman walaupun repo ini publik.
- **Password e-statement juga tidak ada di kode.** Kamu ketik sekali saat import PDF, centang "Ingat password", tersimpan di browser itu saja.
- File PDF yang kamu import **tidak pernah diunggah** ke mana pun. Dibaca di browser, diambil baris transaksinya, lalu dibuang.

## Isi repo

```
index.html             Beranda — hero interaktif, 3 pintu masuk
portfolio.html         Coming soon
education.html         Coming soon

finance/index.html     Dashboard: total aset, grafik, insight otomatis
finance/transaksi.html Daftar transaksi + filter + ekspor CSV
finance/tambah.html    Catat manual + import e-statement PDF
finance/anggaran.html  Pos anggaran, gauge, peringatan
finance/pengaturan.html  Sumber dana, kategori, profil, koneksi Sheet

favicon.png            Ikon tab browser

style.css         Tema: warna, tipografi, animasi blur
icons.js          24 ikon 3D (SVG, digambar sendiri)
data.js           Lapisan data: localStorage + sinkron Sheet
ui.js             Shell, format angka, tombol sembunyikan-angka
insights.js       Mesin rekomendasi dan skor finansial
pdf.js            Parser e-statement PDF
page-*.js         Logika tiap halaman
Code.gs           Backend Google Apps Script (tempel ke Apps Script)
appsscript.json   Manifest Apps Script
```

Semua skrip dan gaya ada di root; halaman Finance dikelompokkan di folder `finance/` supaya alamatnya jadi `/personal/finance/`.

## 1 — Pasang di GitHub Pages

1. Buat repo baru di GitHub, misalnya `personal`. Publik tidak apa-apa.
2. Unggah semua isi folder ini ke root repo.
3. Buka **Settings → Pages**. Di *Source* pilih **Deploy from a branch**, branch `main`, folder `/ (root)`. Simpan.
4. Tunggu satu sampai dua menit. Situsnya terbit di `https://<username>.github.io/<nama-repo>/`, dan halaman Finance di `/<nama-repo>/finance/`.

File `.nojekyll` sudah disertakan supaya GitHub Pages menyajikan file apa adanya.

## 2 — Hubungkan ke Google Sheet (opsional, untuk sinkron antar perangkat)

Spreadsheet-nya sudah dibuat dengan tab `Transaksi`, `Kategori`, `SumberDana`, `Anggaran`, `Pengaturan`.

1. Buka spreadsheet itu → menu **Extensions → Apps Script**.
2. Hapus isi `Code.gs` bawaan, tempel isi `Code.gs` dari repo ini.
3. Di panel kiri pilih **Project Settings** (ikon gerigi) → bagian **Script Properties** → **Add script property**:
   - Property: `TOKEN`
   - Value: kunci rahasia bebas buatanmu sendiri, misalnya 24 karakter acak. **Jangan** pakai password e-statement.
4. Kembali ke editor, klik **Deploy → New deployment** → tipe **Web app**.
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Deploy, lalu izinkan aksesnya saat Google meminta.
5. Salin **Web app URL** yang muncul (berakhiran `/exec`).
6. Buka situsmu → **Profil & Pengaturan** → bagian *Data & Keamanan* → tempel URL dan `TOKEN` → **Simpan & tes**.

Setelah itu setiap perubahan otomatis didorong ke Sheet, dan tombol **Tarik dari Sheet** menarik data terbaru di perangkat lain.

> "Who has access: Anyone" aman di sini karena setiap permintaan ditolak kalau tokennya tidak cocok. Itulah gunanya langkah 3.

## 3 — Import e-statement PDF

1. Buka **Finance → Tambah → Import e-Statement (PDF)**.
2. Pilih file PDF, pilih sumber dananya, masukkan password PDF kalau terkunci.
3. Centang "Ingat password" supaya tidak perlu ketik ulang lain kali.
4. Klik **Baca file**. Baris transaksi muncul, yang sudah pernah masuk ditandai "Sudah ada" dan dilewati.
5. Perbaiki tebakan kategori kalau perlu, lalu **Impor**. PDF-nya dibuang dari memori saat itu juga.

Format yang sudah dikenali: e-Statement Mandiri dan OCTO/CIMB Niaga. Untuk bank lain, kirim satu contoh PDF supaya polanya ditambahkan di `pdf.js`.

## Catatan keamanan

- Repo ini aman dibuat publik: tidak ada URL Sheet, token, maupun password di dalamnya.
- Yang tersimpan di browser: data transaksi, URL + token Sheet, dan password e-statement. Semua hilang kalau kamu bersihkan data browser — ekspor `.json` secara berkala dari **Profil & Pengaturan**.
- Jangan centang "Ingat password" di komputer yang dipakai bersama.

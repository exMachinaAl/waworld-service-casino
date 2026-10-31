# Kebutuhan proyek upgrade melalui AI chat dan agent

Diperiksa 31 Oktober 2026. Baseline source: `package.json` **1.0.0-rc.3**. Dokumen ini mengatur proses kerja; tidak menyatakan fitur VAL sudah diimplementasikan atau paket patch sudah dibuat.

## Tujuan dan batas pekerjaan

Dokumen ini memperjelas kebutuhan untuk meminta AI membantu upgrade proyek: bahan yang diberikan, pekerjaan yang diminta, urutan tahap, dan hasil yang harus dikembalikan. Istilah **upgrader via AI** di sini berarti alur pengembangan melalui AI chat dan agent yang bekerja pada source proyek.

Scope permintaan dokumentasi ini adalah memperjelas panduan. Implementasi fitur, pembuatan tool upgrader, pembuatan ZIP, menjalankan migrasi, dan pemasangan ke aplikasi aktif merupakan tugas lanjutan jika diminta. Prompt implementasi di bawah adalah template untuk tugas lanjutan tersebut; membaca dokumen ini saja bukan instruksi untuk langsung menjalankannya.

## Alur kerja yang diinginkan

**Kebutuhan upgrade → ZIP source bersih → review melalui AI chat → brief untuk agent → pengerjaan di folder → hasil pengujian dan catatan kelanjutan.**

| Pelaksana | Tugas | Hasil yang diserahkan |
|---|---|---|
| Pemilik proyek | Menentukan fitur/masalah, prioritas, batas perubahan dan versi asal | Brief kebutuhan dan source ZIP atau folder proyek |
| AI chat | Membaca source yang tersedia, memperjelas kebutuhan, memetakan dampak dan membagi tahapan | Rencana upgrade, kriteria penerimaan dan instruksi agent |
| Agent di folder | Saat implementasi diminta, memeriksa source aktual, mengedit, menguji dan mencatat hasil | Perubahan kode yang dapat ditinjau, hasil tes dan status pekerjaan |
| Pemilik/operator | Meninjau hasil dan menentukan penerapan ke instalasi aktif | Keputusan penerapan berdasarkan bukti pengujian |

ZIP digunakan untuk membawa source dan konteks ke sesi AI. Agent melanjutkan dari folder hasil ekstraksi atau workspace proyek yang ditentukan. Bila AI chat juga memiliki alat edit dan eksekusi, sebagian implementasi dapat dilakukan di sana sesuai tugas; hasilnya tetap perlu diserahkan dan diverifikasi ketika berpindah ke folder lokal.

## Template brief kebutuhan

Isi sebelum meminta implementasi. Untuk tahap perencanaan, bagian yang belum diketahui boleh ditandai **perlu diperiksa dari source**.

```text
Proyek dan versi asal:
Fitur/masalah yang ingin di-upgrade:
Hasil yang diharapkan pengguna:
Prioritas tahap ini:
Yang harus tetap kompatibel/tidak boleh berubah:
Input: ZIP source / folder workspace:
Perubahan lokal yang perlu dipertahankan:
Dampak database/migrasi yang perlu diperiksa:
Kriteria selesai dan skenario pengujian:
Output yang diminta: rencana / perubahan source / paket patch:
Tugas sesi ini: dokumentasi saja / implementasi pada staging:
```

Prompt untuk **memperjelas kebutuhan saja**:

```text
Baca source dan dokumentasi proyek yang tersedia. Perjelas kebutuhan upgrade,
gap fitur, urutan roadmap, dependensi, risiko migrasi dan kriteria penerimaan.
Susun brief yang bisa diteruskan ke agent yang bekerja di folder proyek.
Fokus sesi ini hanya dokumentasi; jangan implementasikan fitur, membuat ZIP
patch, menjalankan migrasi atau memasang upgrade. Bedakan fitur yang sudah
ada dari usulan, dan tandai informasi yang belum dapat diverifikasi.
```

## Hasil pemeriksaan dokumentasi

| Kebutuhan | Dokumen yang sudah ada | Pemakaian |
|---|---|---|
| Instalasi, backup, upgrade dan rollback RC1 | [Runbook RC1](rc1/RUNBOOK.md) | Referensi historis; perintah patch khusus paket RC1 |
| Perubahan RC2 dan migrasi policy | [Daftar RC2](rc2/UPGRADE_LIST.md) | Pahami dampak policy sebelum instalasi |
| Upgrade RC2 ke RC3 lewat ZIP sibling | [Panduan RC3](rc3/UPGRADE_RC3.md) | Memerlukan paket patch RC3 yang cocok dengan baseline |
| Roadmap produk dan syarat beta | [Roadmap WAW](waw/ROADMAP.md) | Rancangan fase 0–6, bukan daftar fitur selesai |
| Rincian upgrade wallet | [VAL Wallet](waw/VAL-WALLET.md), [backlog](waw/BUILD-BACKLOG.md) | Kontrak, migrasi, dan kriteria penerimaan |
| Prompt implementasi dan kelanjutan | [Prompt VAL](waw/START-DEVELOPMENT-PROMPT.md) | Arcade dahulu, WA-WORLD setelah fondasi stabil |

Kekurangan sebelumnya adalah satu pintu masuk untuk menyiapkan ZIP, membawa konteks antar sesi, dan meneruskan pekerjaan ke folder lokal. Panduan ini melengkapinya.

## Pilih jenis paket dengan benar

- **ZIP source untuk ChatGPT/agent:** snapshot kode untuk dibaca, diedit dan diuji di folder kerja baru. Bukan installer yang aman ditimpa ke instalasi aktif.
- **ZIP patch untuk instalasi lama:** perubahan terhadap baseline tertentu, dengan pemeriksaan checksum, backup, prosedur apply dan rollback yang sudah diuji. Full source yang dikompres ulang bukan patch.
- **Backup operasional:** source lama, konfigurasi privat, database konsisten dan data runtime. Simpan lokal terpisah; jangan ikut unggah ke chat.

Repo ini tidak menyediakan upgrader umum Arcade di root. `CHECK.bat` root adalah pemeriksaan proyek, bukan CHECK paket patch. `integrations/wa-world/optional-patch/upgrade.mjs` milik integrasi WA-WORLD, bukan pengganti upgrader Arcade. Nama CHECK/UPGRADE/ROLLBACK dalam panduan RC3 merujuk file di ZIP patch eksternal; verifikasi paket tersedia sebelum mengikuti langkah tersebut.

## Yang harus disiapkan

1. Versi asal, target fase, sistem operasi, versi Node/npm, serta perubahan lokal yang harus dipertahankan. Verifikasi dari source, jangan hanya dari nama ZIP.
2. Node.js minimal 22.16.0, npm, dependency frontend sesuai `web/package.json` dan lockfile yang tersedia, serta akses instalasi dependency bila belum tersimpan.
3. Folder staging baru dan ruang untuk source, dependency, bundle, backup serta hasil pengujian.
4. Backup source/config privat dan snapshot SQLite konsisten, beserta latihan restore. Jangan menyalin hanya file `.sqlite` saat writer/WAL masih aktif; ikuti runbook backup.
5. Scope satu tahap yang jelas, daftar file berubah, kebutuhan migrasi dan syarat lulus. Jangan mengerjakan semua fase sekaligus.

## Metode utama: ZIP untuk ChatGPT

### 1. Buat snapshot source bersih

Buat folder sementara baru dan salin hanya source yang diperlukan: `src/`, `web/` tanpa dependency/cache, `scripts/`, `tests/`, `docs/`, `integrations/`, `public/`, `legacy-ui/`, file `.bat`, `package.json`, lockfile yang memang dipakai, README, CHANGELOG, `.gitignore`, serta `.env.example` setelah memastikan nilainya contoh. Sertakan instruksi `AGENTS.md` yang berlaku bila ada dan sudah diperiksa tidak memuat informasi privat.

Jangan menyertakan `.env` asli, `data/`, SQLite/WAL/SHM, backup, log, upload pengguna, sesi WA, token, private key, `.aws/`, `.codex/`, `.git/`, `node_modules/`, atau `web/node_modules/`. Tinjau isi source dan dokumen juga: pengecualian nama file saja tidak membuktikan bebas secret. `web-dist/` tidak diperlukan untuk input source; build ulang saat validasi. Manifest build lama tidak otomatis berlaku untuk snapshot baru.

Kompres folder bersih menjadi `WAE-SOURCE-<versi>-<tanggal>.zip` dengan satu folder root yang memuat `package.json`. Buka ZIP dan periksa daftar isinya sebelum mengunggah. Jangan langsung mengompres seluruh folder instalasi aktif. Catat hash SHA-256 ZIP lokal (`Get-FileHash` di PowerShell atau `sha256sum` di Linux) untuk identifikasi serah-terima, bukan sebagai bukti keamanan.

Tambahkan `HANDOFF.md` ke snapshot: versi aktual, commit bila ada, perubahan belum di-commit, scope tahap, daftar file, perintah/hasil tes terakhir, migrasi yang tersedia versus yang sudah diterapkan, dan tugas berikutnya. Jangan memasukkan secret atau data pemain. ZIP harus mencakup perubahan lokal yang relevan; arsip commit lama saja dapat melewatkannya.

### 2. Unggah dan berikan tugas konkret

Gunakan sesi ChatGPT yang menyediakan unggah dan pengolahan berkas. Dukungan membuka ZIP, menjalankan Node, jaringan dan menghasilkan unduhan harus diperiksa di sesi tersebut; panduan ini tidak menjamin semua sesi memiliki kemampuan itu. Bila ZIP tidak dapat dibaca, berikan file source/dokumen relevan atau lanjutkan melalui agent di folder. Jangan menganggap hasil analisis chat sudah mengubah komputer lokal.

```text
Saya melampirkan ZIP source WORLD Arcade Engine. Periksa apakah Anda dapat
membuka dan mengedit isinya; sebutkan versi dari package.json dan folder root.
Baca docs/UPGRADE-WORKFLOW.md, HANDOFF.md bila ada, lalu docs/waw/README.md,
ROADMAP.md, BUILD-BACKLOG.md dan START-DEVELOPMENT-PROMPT.md di docs/waw/.
Kerjakan satu tahap: [isi fase dan hasil konkret yang diminta].
Pertahankan perubahan lokal, saldo, histori, sesi dan reserve; jangan memakai
database pemain atau mengubah ekonomi WA-WORLD. Gunakan fixture untuk uji.
Jika alat tersedia, implementasikan dan uji sampai hasil tahap dapat ditinjau.
Kembalikan ZIP source hasil, daftar perubahan dan penghapusan file, instruksi
migrasi/rollback, hasil tes aktual dan catatan kelanjutan. Tandai tes yang
tidak bisa dijalankan sebagai BELUM DIJALANKAN. Jangan menyebut ZIP source
sebagai patch siap produksi. Bila tidak bisa membuat berkas, berikan diff
dan catatan untuk agent lokal tanpa mengklaim sudah menerapkan perubahan.
```

### 3. Periksa keluaran dan lanjutkan di folder

Unduh hasil ke folder staging baru. Periksa daftar path sebelum ekstraksi; tolak path absolut, `../`, atau symlink yang keluar folder. Bandingkan dengan snapshot input, termasuk file yang dihapus. Jika folder lokal berubah sejak ZIP dikirim, lakukan merge terhadap baseline input; jangan overwrite hasil kerja terbaru.

Minta setiap hasil tahap menyertakan changelog, status implementasi, versi asal/target, hasil pemeriksaan, dan kebutuhan migrasi. Manifest baru dapat mencatat hash tiap file serta operasi tambah/ubah/hapus; jangan memakai `BUILD-MANIFEST.json` RC1 sebagai bukti integritas RC3 atau hasil baru. Pembuatan patch instalasi merupakan pekerjaan tersendiri yang harus diuji terhadap salinan versi asal.

## Work in folder: agent mengerjakan source langsung

Buka folder staging yang memuat `package.json` sebagai workspace agent. Untuk Codex CLI yang sudah terpasang, masuk ke direktori proyek lalu jalankan `codex`; penggunaan CLI dari direktori proyek dijelaskan dalam [dokumentasi resmi Codex CLI](https://learn.chatgpt.com/docs/codex/cli). Nama tombol folder di aplikasi dapat berbeda; pastikan path workspace yang dilaporkan benar.

```text
Bekerjalah langsung sebagai agent pada folder proyek ini. Baca AGENTS.md
yang berlaku, docs/UPGRADE-WORKFLOW.md, HANDOFF.md bila ada dan
docs/waw/IMPLEMENTATION-STATUS.md bila ada. Periksa package.json, git status
dan diff; bila ZIP tidak membawa .git, bandingkan dengan snapshot asal.
Lanjutkan tahap [isi fase] dari hasil ZIP, pertahankan edit pengguna.
Implementasikan, jalankan tes relevan, build bila frontend berubah, lalu
perbarui catatan kelanjutan. Bedakan kegagalan baseline dari regresi.
Jangan menjalankan instalasi/migrasi pada data aktif atau deployment sebagai
bagian eksperimen. Akhiri dengan hasil konkret, file berubah, hasil tes,
blocker dan langkah berikutnya; jangan berhenti pada proposal bila alat ada.
```

Jika hanya satu folder kerja dipakai, jangan biarkan dua agent/editor menulis file yang sama bersamaan. Setelah tahap selesai, jadikan hasil terverifikasi sebagai baseline ZIP berikutnya. Simpan keputusan dan status di file, agar sesi berikutnya tidak bergantung pada ingatan percakapan.

## Roadmap pelaksanaan upgrade

| Tahap | Yang dikerjakan | Syarat lanjut |
|---|---|---|
| 0 — Baseline dan paket | Audit versi, snapshot ZIP, inventaris jalur transaksi, backup/restore latihan dan hasil tes awal | Baseline dapat direproduksi; perubahan lokal terdata |
| 1 — Perlindungan | Guard backend lintas kanal, batas sesi/stake, jeda, blokir mandiri, hapus auto-spin publik | Bypass ditolak; payout/refund lama tetap selesai |
| 2 — VAL + Arcade | Kontrak wallet, metadata VAL/pocket arcade, adapter ACR, riwayat/receipt dan UI | Angka saldo 1:1, ledger/reserve konsisten, retry tidak menggandakan transaksi |
| 3 — Lab QR | Akun sintetis, faucet lab, QR demo, refund/outbox | Scan bersamaan hanya satu settlement; tanpa uang nyata |
| 4 — WAW | Identitas dan adapter WA-WORLD dengan scope aplikasi | Hak akses teruji; V/VCUR tidak berubah |
| 5 — Beta | Uji beban, perangkat WA, browser, pemulihan dan observasi | Gate roadmap lulus; hasil aktual terdokumentasi |
| 6 — Opsional | Ekstraksi layanan VAL | Retry/crash lintas layanan tidak menggandakan saldo/payout |

Rincian dan estimasi ada di [roadmap](waw/ROADMAP.md). Prompt VAL memprioritaskan integrasi Arcade sebelum WA-WORLD; fondasi wallet lokal boleh dikembangkan sambil menuntaskan perlindungan, tetapi gate perlindungan tetap wajib sebelum beta. QR dan ekstraksi service bukan syarat memulai wallet. Semua tahap di atas adalah rencana sampai dibuktikan source dan tes, bukan status selesai.

## Validasi dan penerapan ke instalasi lama

Pada folder staging tanpa data pemain, jalankan pemeriksaan dari `package.json` aktual:

```sh
node --version
npm --version
npm test
npm run check
npm run build:web
node scripts/require-web-build.mjs
```

`npm run check` dapat hanya memberi WARN bila bundle belum tersedia; itu belum membuktikan build sukses. Jalankan browser test jika lingkungannya siap sesuai runbook. Untuk perubahan wallet/migrasi, buktikan preservasi saldo/histori/reserve, idempotensi, konkurensi, otorisasi receipt dan rollback pada fixture. Catat PASS/FAIL/BELUM DIJALANKAN beserta perintah dan alasannya. Hasil tes RC lama tidak menggantikan uji perubahan baru.

**INSTALL.bat saat ini menjalankan setup, migrasi utama, migrasi policy RC2, build dan check.** Karena itu bukan sekadar instalasi dependency dan jangan dipakai untuk eksperimen pada folder produksi. Panduan RC3 menyebut patch tidak memigrasikan schema, tetapi langkah INSTALL setelahnya tetap perlu diperiksa terhadap script aktual ini.

Untuk instalasi RC2 dengan paket patch RC3 yang cocok: hentikan server, ekstrak patch sejajar dengan `WORLD-Arcade-Engine-Main`, jalankan CHECK milik patch, UPGRADE, lalu langkah proyek sesuai [panduan RC3](rc3/UPGRADE_RC3.md). Simpan `_backups/` patch. Jangan mengganti nama folder atau memaksa checksum agar target lain diterima.

Untuk baseline lain atau upgrade VAL baru: siapkan dan uji paket migrasi khusus sebelum menyentuh instalasi aktif. Jangan mencampur perintah APPLY/DRYRUN RC1 dengan UPGRADE RC3. Rollback source tidak otomatis memulihkan database; bila ada transaksi baru, restore snapshot lama bisa menghilangkan transaksi. Ikuti batas rollback versi terkait dan utamakan perbaikan maju bila rollback tidak aman.

Upgrade dianggap siap dipasang hanya setelah paket cocok dengan baseline, pemeriksaan staging lulus, backup/restore terbukti, migrasi serta rollback jelas, dan smoke test saldo → main → hasil → receipt berhasil untuk scope yang diubah. Dokumen ini sendiri tidak menerapkan upgrade atau menghasilkan ZIP patch.

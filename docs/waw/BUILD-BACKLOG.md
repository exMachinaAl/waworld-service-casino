# Backlog pembangunan awal

Status deliverable WAW/VAL/LAB/OPS di bawah: **belum dikerjakan**. Validasi baseline dan perbaikan scheduler multiplayer sudah dimulai; lihat [status implementasi](IMPLEMENTATION-STATUS.md). Dokumen perencanaan tidak mengaktifkan fitur. Indeks: [WAW & VAL](README.md).

## Urutan issue

Sebelum mengambil fitur, ikuti [prioritas stabilisasi pada roadmap](ROADMAP.md#prioritas-proyek-stabilisasi-dahulu-fitur-bertahap). Urutan terdekat adalah validasi RC3 → fix bug terkonfirmasi → perlindungan → VAL Arcade. Lab QR dapat ditunda; bukan syarat integrasi wallet Arcade.

| ID persiapan | Jenis | Hasil yang diminta | Syarat selesai |
|---|---|---|---|
| BASE-01 | Lingkungan | Staging dengan Node >=22.16.0, dependency dan baseline source teridentifikasi | Test/check dapat dieksekusi; hambatan lingkungan tercatat |
| BASE-02 | Verifikasi | Hasil test, check, build, smoke test dan inventaris pemulihan aktual | Daftar PASS/FAIL/BELUM DIJALANKAN serta bukti reproduksi temuan |
| FIX-xxx | Bug, dibuat setelah reproduksi | Satu tiket per penyebab/kelompok gejala terkait | Expected/actual jelas; fix dan uji regresi relevan lulus |

Pembaruan verifikasi 31 Oktober 2026: Node telah diperbarui dari v20.19.2 ke v24.22.1 melalui NVM (npm 11.19.1). `npm test` lulus 108/108 tanpa skip setelah diizinkan membuka localhost di luar sandbox; kegagalan awal `listen EPERM` merupakan batas lingkungan, bukan bug game. `npm run check` lulus dengan peringatan bundle belum dibangun. Hambatan runtime teratasi, tetapi BASE-01/02 belum ditutup sepenuhnya: dependency/build frontend, smoke test dan bukti pemulihan masih perlu diverifikasi. Shell agent perlu memuat NVM atau PATH Node yang sesuai. Jangan membuat tiket FIX fiktif untuk memenuhi antrean. WAW-01 tetap mencakup backup/restore staging; BASE melengkapinya dengan bukti runtime dan pemeriksaan rilis.

P0 = syarat sebelum beta; P1 = fondasi integrasi; P2 = perluasan setelah fondasi lulus.

| ID | Prioritas | Deliverable | Dependensi | Bukti penerimaan |
|---|---|---|---|---|
| WAW-01 | P0 | Snapshot source/schema dan restore staging | — | Backup konsisten, restore dapat dibaca, hasil ledger/reserve terdokumentasi |
| WAW-02 | P0 | Service kebijakan bermain bersama | 01 | Semua jalur taruhan Web/WA melewati guard; tidak cukup UI saja |
| WAW-03 | P0 | Batas waktu/anggaran, jeda dan self-exclusion | 02 | Reload/restart/tab baru tidak melewati batas; penurunan langsung, kenaikan tertunda |
| WAW-04 | P0 | UI manual, timer, hasil bersih, sembunyikan kasino | 03 | Tidak ada kontrol auto-spin atau ajakan mengejar bonus; aksesibilitas dan mobile diuji |
| WAW-05 | P0 | Penyelesaian kewajiban saat blokir | 03 | Bonus/blackjack/roulette/lottery yang sudah mengikat dapat selesai tanpa taruhan baru |
| VAL-01 | P1 | Metadata VAL dan pocket, compatibility contract | WAW-01 | ACR lama tetap terbaca; unit/pocket eksplisit di kontrak baru |
| VAL-02 | P1 | Modul ledger, integrasi debit/payout/refund Arcade dan idempotency konsisten | VAL-01 | Jalur instan/bonus/multiplayer/terjadwal terinventaris; transfer atomik, fingerprint mismatch ditolak, seluruh akun dapat direkonsiliasi |
| VAL-03 | P1 | API dan UI wallet: saldo posted/held/available, riwayat, receipt, pagination, otorisasi | VAL-02 | Saldo berasal dari server; loading/error/retry/mobile teruji; pengguna A tidak membaca receipt pribadi B; IDOR tests lulus |
| LAB-01 | P1 | Faucet dan P2P sintetis terisolasi | VAL-02 | Hanya akun lab; kuota tidak ter-reset oleh retry; tidak ada rute lab publik |
| LAB-02 | P1 | QR dinamis, intent, konfirmasi, refund | LAB-01, VAL-03 | Dua konfirmasi bersamaan hanya satu settlement; refund tidak berlebih |
| WAW-06 | P1 | Mapping identitas dan adapter WA | WAW-03, VAL-03 | DM dan identity binding terverifikasi, VCUR tidak berubah |
| VAL-04 | P1 | Dry-run migrasi ACR→VAL Arcade | VAL-02, WAW-05 | Saldo/hold/sesi cocok; writer lama ditolak setelah cutoff |
| LAB-03 | P2 | Fake provider, lalu sandbox resmi | LAB-02 | Timeout, replay, invalid signature, late callback dan enquiry teruji |
| OPS-01 | P0 | Gate beta dan observability | WAW-01..06, VAL-04 | Hasil tes aktual, restore drill, kalibrasi game, live WA bila diaktifkan |
| VAL-05 | P2 | Ekstraksi VAL Core lintas aplikasi | OPS-01 | Protokol pemulihan lintas layanan lulus crash matrix sebelum cutover |

## Peta file untuk implementasi berikutnya

| Lokasi | Tindakan yang direncanakan |
|---|---|
| `src/db.mjs` | Pertahankan atomic commit; jangan mengganti saldo manual atau mengubah seed tanpa migrasi |
| `src/rc-schema.mjs`, `src/migrations.mjs` | Migrasi additive, fingerprint, metadata dan tabel kebijakan |
| `src/games.mjs` dan modul game/round | Inventaris entry point taruhan, bonus, reserve dan settlement |
| `src/server.mjs`, `src/rc-api.mjs` | Enforcement auth/limit lintas endpoint; projection unit dan receipt |
| `src/play-safety.mjs` (baru, usulan) | Policy service, kuota, waktu efektif dan blokir mandiri |
| `src/val/` (baru, usulan) | Kontrak wallet, command, ledger dan rekonsiliasi |
| `web/src/components/GamePanel.jsx`, `web/src/auto-spin.mjs` | Lepas auto-spin dari pengalaman publik; tampilkan batas dan hasil bersih |
| `web/src/App.jsx` dan komponen wallet baru | Pocket, history, receipt dan kontrol sesi |
| `integrations/wa-world/adapter.mjs` | Batas yang sama di DM; pesan yang mudah dipahami dan idempotensi |
| `tests/` | Perbarui ekspektasi auto-spin yang berubah; tambah pengujian invariant dan bypass |

Jangan langsung menghapus file auto-spin sebelum memeriksa import dan test yang menggunakannya. Daftar ini memetakan pekerjaan, bukan izin melewati pemeriksaan kompatibilitas rilis.

## Matriks uji wajib saat implementasi

| Kasus | Hasil yang harus dibuktikan |
|---|---|
| 20 retry untuk command identik | Satu journal dan receipt yang sama |
| Key sama, nominal/penerima berbeda | Conflict, tidak ada perubahan saldo |
| Dua debit bersamaan melebihi available | Hanya debit yang didanai diterima; tidak ada saldo negatif |
| Crash sebelum/sesudah commit | Semua perubahan rollback atau semua persisted; retry tidak menduplikasi |
| Hold aktif + pembayaran/refund | Available benar; hold tidak dihitung ganda; reserve lain terlindungi |
| Dua capture satu hold | Hanya satu capture |
| Dua refund total melampaui pembayaran | Salah satu ditolak; jumlah refund tetap sah |
| QR dipindai dan dikonfirmasi dua payer | Satu settlement; receipt tidak bocor ke payer lain |
| Token kadaluarsa/diubah atau intent dibatalkan | Tidak ada debit |
| Payer/tenant/app/pocket dimanipulasi | Tolak akses, tanpa bocoran saldo |
| Self-exclusion bersamaan dengan taruhan | Urutan commit menentukan: tidak ada taruhan baru setelah blokir committed |
| Blokir lalu retry transaksi yang sudah selesai | Receipt lama dapat dibaca; tidak membuat taruhan baru |
| Buka WA + beberapa tab + restart | Satu anggaran/waktu server yang konsisten |
| Batas tercapai saat kewajiban aktif | Taruhan baru ditolak; penyelesaian hak berjalan sesuai aturan |
| Pergantian hari WIB dan jam klien dimanipulasi | Reset hanya menurut server; jeda tidak hilang |
| Callback palsu/duplikat/terlambat | Verifikasi, deduplikasi dan enquiry; tidak ada grant ke Arcade |
| Migrasi dengan sesi lama dan reserve | Saldo, opening balances, entries, kewajiban dan ID terjaga |
| Rollback sesudah write baru | Restore destruktif diblokir; recovery mempertahankan transaksi baru |

Untuk perubahan source nanti, jalankan `npm test` dan `npm run check` sesuai prasyarat repo. Jalankan build web dan pengujian browser bila UI berubah. Tes yang sekarang mengharapkan auto-spin harus diperbarui sesuai perilaku baru, bukan sekadar dihapus agar lulus. Uji provider sandbox dan dua akun WA nyata dicatat terpisah dari tes otomatis lokal; jangan menandainya PASS jika belum dijalankan.

## Latihan paling awal untuk belajar

Hari 1: baca `src/db.mjs`, gambar contoh faucet–pemain–merchant, lalu hitung jurnal contoh pada dokumen VAL secara manual.

Hari 2: buat prototipe ledger dalam database `:memory:` dengan akun sintetis; implementasikan transfer atomik dan receipt idempoten. Uji retry dan insufficient balance terlebih dahulu.

Hari 3: tambah payment intent, preview dan confirm; gunakan token QR teks dahulu. Gambar QR hanya diperlukan setelah alur transaksi benar.

Hari 4: tambah refund dan rekonsiliasi, simulasikan crash/retry; pastikan total entry nol dan saldo tiap akun cocok.

Hari 5: bangun layar lab saldo–scan–confirm–receipt, kemudian rencanakan penggabungan modul ke Arcade melalui backlog. Lab ini dapat berjalan tanpa kredensial DANA, QRIS, atau akses WA nyata.

Gunakan fixture akun rekaan, bukan database `data/` pengguna. Tahapan belajar dapat lebih panjang dari satu hari; urutan konsep lebih penting daripada kecepatan.

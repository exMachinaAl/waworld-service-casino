# Status implementasi

## Stabilitas multiplayer — tahap awal, 31 Oktober 2026

Baseline: source 1.0.0-rc.3, Node v24.22.1 / npm 11.19.1. Scope tahap ini adalah scheduler pemulihan ronde multiplayer. Implementasi VAL belum dimulai.

### Perbaikan yang sudah berjalan

- Scheduler blackjack memeriksa seluruh meja aktif. Sebelumnya batas 100 baris diterapkan sebelum pemeriksaan deadline sehingga meja kedaluwarsa setelah 100 meja yang belum jatuh tempo tidak diproses.
- Kegagalan satu meja dilaporkan setelah meja sehat lain selesai diproses. State tidak valid atau membership hilang tidak dilewati diam-diam.
- Timeout tetap memakai transaksi dan command id berbasis meja/versi yang sudah ada. Transaksi gagal mengembalikan perubahan state dan reserve; retry tidak menyelesaikan meja dua kali.
- Scheduler server memanggil blackjack, lottery dan roulette secara terpisah, lalu melaporkan kumpulan error. Kegagalan satu jenis game tidak mencegah jenis lainnya berjalan.

File utama: `src/blackjack-tables.mjs`, `src/scheduled-rounds.mjs`, `src/server.mjs`, `tests/multiplayer-stability.test.mjs`.

### Bukti pengujian

- Dua tes reproduksi pertama gagal sebelum fix: meja kedaluwarsa di luar 100 baris dan meja sehat yang terhalang state rusak.
- Empat tes regresi baru lulus: dua kasus tersebut, rollback reserve saat timeout gagal, dan roulette tetap sampai SETTLED ketika blackjack serta lottery gagal.
- `npm test`: **112 PASS, 0 FAIL, 0 skipped**, termasuk test HTTP, restart, ledger, Dice Duel dan blackjack. Tes HTTP membutuhkan izin membuka localhost di luar sandbox.
- `npm ci --prefix web --cache /tmp/wae-npm-cache --no-audit --no-fund --fetch-retries=0 --fetch-timeout=30000`: **PASS**, dependency dipasang sesuai lockfile dengan akses jaringan; percobaan install di sandbox sebelumnya dihentikan karena tertahan.
- `npm run build:web`: **PASS**, bundle React dibuat di `web-dist/`.
- `node scripts/require-web-build.mjs`: **PASS**, marker bundle RC3 sesuai.
- `npm run check` setelah build: **PASS**, termasuk ketersediaan bundle RC3.
- Browser, Windows native, WA nyata dan load berkepanjangan: **BELUM DIJALANKAN** untuk perubahan ini.

### Migrasi, penerapan dan batasan

Tidak ada perubahan schema atau migrasi data untuk tahap ini. Tidak menerapkan perubahan ke instalasi/data pemain aktif. Rilis tetap RC3; perubahan ini belum menjadi ZIP patch rilis.

Scan semua meja aktif menghilangkan starvation pada batas 100, tetapi biaya scan bertambah mengikuti jumlah meja aktif. Belum ada klaim kapasitas produksi; ukur waktu sweep pada uji beban sebelum beta. Error meja rusak akan dilaporkan lagi pada tick berikutnya sampai penyebab diperbaiki; tidak ada perbaikan state atau saldo otomatis. Isolasi per ronde di dalam scheduler lottery/roulette belum diperluas pada tahap ini.

### Tugas berikutnya

1. Ukur durasi sweep dan respons HTTP ketika banyak meja aktif; rancang batching yang adil jika diperlukan.
2. Audit retry command Dice Duel/blackjack: command yang sama saat ini mengembalikan hasil tersimpan tanpa fingerprint payload lengkap. Siapkan kompatibilitas histori sebelum mengubah kontrak replay.
3. Uji reconnect SSE, pergantian meja, respons terlambat dan konflik versi dengan dua pengguna browser.
4. Evaluasi isolasi error per ronde lottery/roulette dan pembatasan log error berulang.
5. Lanjutkan perlindungan bermain dan VAL sesuai roadmap setelah gate relevan lulus. WA-WORLD belum menjadi target perubahan.

# Menjalankan WAE 1.0.0-rc.1

## Instalasi baru Windows

1. Pasang Node.js minimal 22.16.0 (pengujian di Node 24.22.1). Ekstrak full source ke folder baru, misalnya `C:\Program Files X\WAE-1.0.0-rc.1`. Jangan ekstrak menimpa instalasi yang mempunyai database.
2. Klik `INSTALL.bat`. Ini membuat .env hanya jika belum ada, menjalankan migrasi, memasang dependency frontend dan membangun React. Paket juga menyertakan bundle React hasil build yang diuji.
3. Klik `START.bat`, buka `http://127.0.0.1:8787`. Demo lokal menggunakan satu identitas; gunakan handoff WA untuk identitas berbeda.
4. Untuk mengelola ronde: isi `WAE_ADMIN_ENABLED=1` pada .env, jalankan `ADMIN-SETUP.bat`, restart, lalu login menu Admin ACR. Grant test tetap OFF (`WAE_ADMIN_TEST_GRANTS=0`).
5. Lottery default OFF. Untuk pengujian privat yang disetujui operator, set `LOTTERY_ENABLED=true`, restart. Buat DRAFT pada panel admin, cek rules/commitment lalu OPEN. Jangan aktifkan publik sebelum review hukum/kebijakan platform.
6. Roulette: admin membuka OPEN_BETS dengan waktu tutup dan budget. Peserta masuk menu Arcade → European Roulette atau Multiplayer → Roulette. Slip final tidak dapat diedit setelah konfirmasi. Ronde berikutnya tidak melakukan auto-charge.

Port berbeda: ubah WAE_PORT dan gunakan alamat yang sama persis saat browser mengirim Origin. Untuk domain HTTPS gunakan WAE_PUBLIC_ORIGIN dan WAE_COOKIE_SECURE=1; DEMO harus OFF. Admin RC tetap lokal; halaman admin tidak didukung lewat ngrok/proxy publik.

## Upgrade v0.14 yang sudah memiliki data

Tutup WAE dan konektor yang mengirim command. Ekstrak patch sebagai folder sejajar. Jalankan dari CMD (path boleh mengandung spasi):

```bat
CHECK.bat "C:\Program Files X\WORLD-Arcade-Engine-MVP"
DRYRUN.bat "C:\Program Files X\WORLD-Arcade-Engine-MVP"
APPLY.bat "C:\Program Files X\WORLD-Arcade-Engine-MVP"
```

Jika double-click tanpa argumen, masukkan path proyek pada prompt. Backup dan journal hanya di `TARGET\data\_wae-upgrades\wae-rc1\`. Tidak ada backup baru di folder induk. `.env`, database, uploads, log, session bot, dan file lokal lain tidak ditimpa. README/CHANGELOG kustom dilewati. Konflik source menghentikan sebelum penulisan; laporan memuat path dan hash expected/current/incoming. Bandingkan dengan payload patch dan lakukan merge terpisah, tidak ada opsi force.

Patch menyertakan bundle React dan perubahan lockfile; `npm ci --prefix web` diperlukan bila akan membangun ulang. CHECK membandingkan source/payload; DRYRUN tidak melakukan migrasi atau penulisan proyek. APPLY memeriksa port WAE mati, backup SQLite konsisten dengan API backup SQLite, checksum, journal, migrasi additive, lalu memverifikasi ledger. Jangan menjalankan dua upgrader atau editor source bersamaan.

Setelah upgrade: jalankan `CHECK.bat` milik proyek, lalu `START.bat`. Existing .env tetap dipakai, jadi tambahkan opsi admin/Lottery secara manual bila diperlukan. Baca cadangan treasury pada panel admin sebelum menerima taruhan.

## Database lampiran: tindakan operator diperlukan

Snapshot yang diuji memiliki defisit reserve konservatif 1.725.070 ACR dari bonus lama. Migrasi tetap mempertahankan seluruh saldo dan sesi, dan aplikasi dapat dibuka untuk inspeksi. Permainan yang tidak memiliki cadangan ditolak dengan TREASURY_RESERVE_INSUFFICIENT/TREASURY_RESERVED. Bukan berarti semua reserve akan dibayar.

Pilihan yang diimplementasikan: admin meninjau angka terbaru, mengalokasikan ACR virtual dari faucet tersedia ke treasury melalui panel, mengisi alasan audit dan checkbox persetujuan. Angka snapshot dapat berubah; jangan otomatis menyalin jumlah laporan. Supply tidak bertambah, saldo pemain tidak berubah, Admin Test Pool tetap terpisah. Jika faucet tidak cukup, hentikan penerimaan taruhan dan lakukan review; jangan menghapus bonus, menurunkan hadiah atau mengubah RNG.

## Rollback & recovery

```bat
ROLLBACK.bat "C:\Program Files X\WORLD-Arcade-Engine-MVP"
```

Rollback memeriksa checksum file hasil upgrade dan backup; perubahan source setelah upgrade menghentikan rollback. Kode/bundle dipulihkan, file baru patch dihapus hanya bila hash masih cocok. Database tidak diputar mundur. Kolom/tabel additive tetap ada. Rollback diblokir setelah aktivitas ledger baru atau reserve ronde RC baru; gunakan forward fix. Reserve migrasi untuk sesi v0.14 tidak dianggap transaksi baru. Jangan memakai kode lama untuk melanjutkan operasi yang bergantung jaminan reserve RC.

Jika crash di tengah APPLY: jangan start server. Baca `journal.json` dengan status RECOVERY_REQUIRED/PREPARING, jalankan ROLLBACK setelah memeriksa log. Jika `upgrade.lock` tersisa akibat proses mati paksa, pastikan PID di lock sudah mati dan tidak ada upgrader lain sebelum menghapus lock secara manual. Tidak ada force otomatis.

Database backup `database-before.sqlite` adalah snapshot konsisten. Restore database hanya untuk recovery insiden pada salinan terisolasi; pastikan tidak ada transaksi baru yang akan hilang. Test restore menggunakan salinan, bukan mengganti DB pengguna. Setelah aktivitas pemain, utamakan forward repair/audit dan jangan restore otomatis.

## Linux

```sh
node scripts/setup.mjs
node --experimental-sqlite scripts/migrate.mjs
npm ci --prefix web --no-audit --no-fund
npm run build:web
npm test
npm start
# Patch: node --experimental-sqlite upgrade.mjs CHECK /path/to/project
```

## Pengujian ulang

`npm test` menjalankan suite Node. `npm run check` memeriksa source dan versi bundle. `npm run test:browser` membutuhkan Playwright dan Chromium: `npm install --no-save playwright`, `npx playwright install chromium`. Browser test memakai DB memory dan identitas test, bukan DB produksi. Runtime khusus dapat ditentukan melalui PLAYWRIGHT_MODULE dan WAE_BROWSER_CONFIG (JSON executablePath/args). Kredensial browser test tidak dipakai aplikasi nyata.

## Operasional & keterbatasan

- Scheduler server tiap 1 detik; jangan menggantungkan hasil pada tab browser. Setelah restart, deadline terlewat diproses lagi secara idempotent.
- Notifikasi SSE memakai outbox tersimpan. WA menyediakan `.wae notifications CURSOR` secara pull; tidak ada broadcast otomatis ke seluruh kontak. Ini menghindari pengiriman tanpa opt-in.
- Satu instance WAE per database, disk lokal yang andal; jangan menjalankan SQLite pada folder sync OneDrive yang aktif, share network, atau beberapa node server.
- Secret service/admin dan seed hanya berada di server; jaga permission file database/backup. Bukan sistem tahan operator DB jahat.
- Semua file docs v0.x bersifat historis; docs/rc1 adalah acuan perubahan ini.

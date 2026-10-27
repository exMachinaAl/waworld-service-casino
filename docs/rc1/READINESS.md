# Kesiapan rilis — WAE 1.0.0-rc.1

Keputusan: kandidat untuk uji penerimaan lokal/private. Bukan pernyataan production-ready. Perubahan source, React bundle, migrasi additive, patch upgrade, patch WA opsional dan bukti pengujian disertakan. Source v0.14 serta database asli lampiran tidak diubah.

## Hasil yang tersedia

| Bagian | Hasil |
| --- | --- |
| Lottery Exclusive | Ronde bersama, tiket ACR, jadwal, seed commitment/reveal, rules immutable, hasil/payout, early release dengan audit, cancel/refund sesuai rules |
| Custom stake | Policy server integer 1–3.000 ACR default, admin/game scope, snapshot untuk sesi aktif; semua game memakai validasi server |
| Blackjack | 1–4 pemain melawan dealer, READY/START, host transfer, Leave/Cancel, forfeit, timeout, settlement idempotent |
| Roulette | Multi-nomor/multi-item slip, payout gabungan, ronde bersama, reserve, hasil tersimpan, animasi bola/roda existing, auto-next tanpa auto-charge |
| Kompatibilitas | React, Dual Mode, ACR Wallet dan game lama dipertahankan; histori L1 tetap dibaca, endpoint permainan L1 instan dinonaktifkan dengan 410 |
| Upgrade | CHECK/DRYRUN/APPLY/ROLLBACK, checksum, backup SQLite konsisten, journal, source conflict berhenti, .env dan README kustom dipertahankan |
| WA-WORLD | Adapter dan patch opsional untuk baseline 3.4.0, trusted sender, command ID, allowlist/private/fromMe gates; notifikasi melalui pull |

## Bukti verifikasi

- Baseline: 78/78 tes lulus sebelum perubahan.
- Source RC: 100/100 tes Node lulus, tanpa skip; build React dan pemeriksaan source/bundle lulus.
- Browser Chromium: delapan kelompok alur lulus pada desktop/mobile dan dua identitas. Tidak ada console/page error dalam skenario tersebut.
- Upgrade/recovery: sepuluh pemeriksaan lulus memakai engine Node di Linux, termasuk path dengan spasi, konflik source, README kustom, retry, restore backup dan penolakan rollback sesudah transaksi baru.
- Instalasi bersih: empat pemeriksaan lulus pada folder ber-spasi, meliputi setup token/flag, migrasi ulang dengan backup, pemeriksaan bundle tanpa node_modules, serta startup HTTP dan login demo.
- Salinan database lampiran: saldo pemain, histori transaksi dan sesi tetap; integrity_check=ok. Setelah alokasi treasury eksplisit hanya pada salinan uji, enam sesi lama selesai dalam 83 aksi, ledger seimbang dan reserve sesi tersebut habis.
- Audit npm terhadap dependency terkunci: nol kerentanan yang dilaporkan saat pengujian. Ini bukan hasil penetration test atau jaminan bebas kerentanan.

Log ada di `evidence/`; rincian cakupan ada di TEST-MATRIX.md. BUILD-MANIFEST.json pada root mengikat hash source dan bundle yang didistribusikan. Tidak ada database, .env nyata, token, session bot, atau node_modules pengguna dalam paket.

## Temuan yang perlu ditangani saat menjalankan database lama

Snapshot lampiran memiliki treasury 805.505 ACR dan maksimum reserve konservatif sesi aktif 2.530.575 ACR: defisit 1.725.070 ACR. Ini estimasi kewajiban maksimum, bukan kerugian yang sudah terjadi atau hadiah pasti. Migrasi tidak menghapus progres dan tidak mengubah saldo untuk menutupi defisit.

Admin harus memeriksa panel treasury dan memutuskan alokasi dari faucet yang sudah tersedia. Alokasi dicatat sebagai transfer zero-sum dengan alasan audit dan idempotency; tidak memakai Admin Test Pool. Pengujian alokasi/resume dilakukan hanya pada salinan. Database asli tetap membutuhkan keputusan operator. Bila cadangan kurang, beberapa taruhan/aksi akan ditolak sebelum RNG atau debit.

## Batas penerimaan yang belum terverifikasi

| Pemeriksaan | Status dan dampak |
| --- | --- |
| INSTALL/START dan seluruh .bat di Windows native | NOT RUN. Tidak tersedia host Windows. Engine patch, path ber-spasi, build dan startup diuji di Linux; operator masih harus melakukan smoke test Windows. |
| Baileys dengan dua akun WhatsApp nyata | NOT RUN. Dua identitas adapter/HTTP disimulasikan, patch handler diuji. QR/login, pengiriman jaringan dan kebijakan platform belum dibuktikan. |
| Notifikasi WA push otomatis | Tidak diimplementasikan. `.wae notifications CURSOR` membaca outbox; tidak ada broadcast otomatis. |
| Review hukum/kebijakan platform | NOT RUN. Lottery default OFF. ACR tetap virtual; tidak ada konversi VCUR, jual-beli kredit, deposit/cash-out atau hadiah bernilai uang nyata. |
| Multi-instance/multi-tenant/PostgreSQL | Tidak didukung RC ini. SQLite satu instance, tenant baseline. DATABASE.md berisi rencana PostgreSQL, bukan backend yang telah diuji. |
| Admin melalui proxy publik | Tidak didukung. Admin lokal dengan autentikasi; header proxy ditolak. |
| Chaos/power-loss, load berkepanjangan, pen-test independen | NOT RUN. Ada restart/backup/duplicate-request test, bukan sertifikasi seluruh kemungkinan kegagalan. |

Sebelum rollout luas: selesaikan smoke test Windows dan WA nyata, tangani reserve database yang akan dipakai, verifikasi backup operasional, serta selesaikan review keamanan dan kebijakan sesuai lingkungan deployment.

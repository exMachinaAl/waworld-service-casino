# WAE RC2 Bulk Update — daftar perubahan

1. **Help Center React** — menu Panduan & Bantuan berisi petunjuk pemain, Lottery, admin, ekonomi dan troubleshooting.
2. **Lottery Empty State** — menjelaskan DRAFT → OPEN, jadwal, tabs OPEN/UPCOMING/RESULTS, dengan tautan internal panduan dan admin.
3. **Admin Navigation** — modul Lottery, Roulette, Kebijakan Taruhan, Treasury dan Wallet Test pada satu panel.
4. **Admin Lottery Form** — biaya tiket awal mengikuti minimum L1 dari server, bukan hardcode 10; tombol segarkan waktu, pesan jadwal invalid lebih jelas.
5. **Stake Policy Migration** — migrasi idempoten opsional (script `npm run migrate:rc2`) menurunkan global maksimum lama >3000 menjadi 3000; audit, backup konsisten, tidak mengubah ronde aktif atau saldo. Admin dapat mengelola perubahan selanjutnya.
6. **Distribusi aman** — ZIP bersih tidak berisi `.env`, data, SQLite/WAL/SHM, `.git`, node_modules atau secret.
7. **Regression Tests** — tes Help, normalisasi policy, ledger dan source checks.
8. **Rollback/Upgrade** — patch tetap memeriksa file program, membolehkan README kustom, dan menyimpan backup source serta bundle React lama di `data/_wae-upgrades`.

## Tidak termasuk
Tidak menambah game / mengubah RNG, tidak mengaktifkan ACR↔VCUR, belum mengeksekusi tes browser sungguhan atau WA nyata. Tetap release candidate.

## Status pengujian RC2
- Pengujian Node.js: 103 PASS.
- Parser JSX: 14 file PASS (build Vite penuh tidak tersedia pada Linux yang hanya memiliki binary Rollup Windows).
- PATCH CHECK/APPLY/ROLLBACK pada salinan RC1: PASS; policy migrasi teruji dari maksimum 10000 ke 3000, ledger konsisten.
- Test Web Browser end-to-end, WhatsApp real-device dan deployment publik: **BELUM**.
- BUILD-MANIFEST.json lama milik RC1 tidak berlaku untuk RC2; paket full bersih tidak menyertakannya. Pemasangan patch tidak mengubah manifest RC1 itu, jangan memakainya untuk audit checksum versi RC2.

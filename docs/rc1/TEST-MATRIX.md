# Matriks pengujian RC1

Hasil di bawah berasal dari eksekusi, bukan checklist rencana. Runtime utama Linux, Node 24.22.1, SQLite bawaan Node; browser Chromium melalui Playwright. Log mentah disertakan di evidence/. Tidak menggunakan akun WhatsApp nyata.

| Area | Cakupan yang dieksekusi | Hasil / bukti |
| --- | --- | --- |
| Baseline v0.14 | Suite awal, dependency install dan build React | 78/78 PASS; baseline-tests.log, baseline-build.log |
| Regresi RC | Seluruh suite Node termasuk slot, pot, Guci, bonus, wallet, handoff, admin, multiplayer, WA adapter, wheel geometry | 100/100 PASS; final-node-tests.log |
| Stake | 1, 3.000, 3.001, invalid integer/NaN/overflow, policy scope/snapshot, semua game create/custom stake | PASS; tests/rc.test.mjs |
| Lottery | Leading zero, prefix min4, rational BigInt, round half-up/cap, commitment, hadiah bersama, quota, duplicate/retry, private tickets, cancel/refund, legacy read/410, restart | PASS; tests/rc.test.mjs |
| Jadwal/admin race | Dua admin dengan versi sama hanya satu CLOSE sukses; deadline diproses saat flag OFF; settle sekali | PASS; tests/rc-release.test.mjs |
| Roulette | Overlapping wins dijumlah, zero kalah di outside bets, aggregate cap, hasil bersama, lock/refund, reserve/exposure | PASS; tests/rc.test.mjs |
| Restart Roulette | SPINNING tersimpan, restart hasil sama, backup/restore, settlement, auto-next satu ronde baru tanpa charge ulang | PASS; tests/rc-release.test.mjs |
| Blackjack | 1–4 pemain, host transfer, guest leave, cancel, active forfeit, timeout, natural/dealer/odd stake dan settlement | PASS; tests/blackjack-multiplayer.test.mjs dan suite RC |
| Ledger/cadangan | Reserve lintas game, funding zero-sum/idempotent, transaksi audit, bonus lama tetap, treasury kurang menolak sebelum aksi | PASS; tests/rc.test.mjs, tests/rc-release.test.mjs |
| Race HTTP | 200 request duplikat konkuren serta dua identitas WA simulasi; tidak double-debit | PASS; tests/rc.test.mjs; bukan benchmark 200 pemain unik |
| Auth/privasi | CSRF/origin, admin flag/loopback, private views, trusted WA sender, forwarded demo/diagnostics ditolak | PASS; suite HTTP/RC; lihat SECURITY.md untuk batas |
| Browser 1–2 | Tiket Lottery leading-zero/double-click; shared result desktop/mobile, tanpa overflow horizontal | PASS; final-browser-tests.log |
| Browser 3–4 | BJ satu pemain 1 ACR; Roulette dua identitas empat item dan physical landing cocok hasil server | PASS; final-browser-tests.log |
| Browser 5–7 | Admin policy/audit, alokasi treasury double-click sekali, create→OPEN→early CLOSE→PUBLISH/SETTLE Lottery | PASS; final-browser-tests.log |
| Browser 8 | Tidak ada console/page errors pada skenario; ledger akhir seimbang | PASS; final-browser-tests.log |
| Database asli (salinan) | Saldo/history/sesi sama sesudah migrasi; resume enam sesi lama 83 aksi setelah funding pada salinan | PASS; final-real-migration-tests.log; source asli tidak dimodifikasi |
| Patch 1–4 | CHECK/DRYRUN tanpa writes/backup, source conflict/diff, APPLY preserve data/docs/env, retry no-op | PASS; final-upgrade-tests.log |
| Patch 5–9 | Backup restore seluruh baris lima tabel inti baseline (players/accounts/transfers/entries/game_sessions) + integrity, rollback local conflict, rollback code/bundle, reapply archive, tolak ledger baru | PASS; final-upgrade-tests.log |
| Patch 10 | Optional WA apply/rollback, syntax, trusted sender/allowlist/fromMe | PASS; final-upgrade-tests.log |
| Build/dependency | Vite build, source/bundle version check, npm audit | PASS; final-build.log, final-check.log, final-npm-audit.json |
| Instalasi bersih | Setup idempotent/token acak, migrate/repeat+backup, shipped bundle tanpa node_modules, startup HTTP+demo | 4 pemeriksaan PASS; final-fresh-install-tests.log; bukan eksekusi native .bat |

Jumlah 100 adalah test case Node; delapan adalah kelompok browser; sepuluh adalah pemeriksaan integrasi patch. Ketiganya tidak dijumlah menjadi jumlah test case unik karena skenario saling tumpang tindih. Empat ekspektasi baseline diperbarui untuk perubahan kontrak yang disengaja; lihat CHANGELOG.md. Test visual memeriksa alur dan keselarasan hasil, bukan snapshot seluruh variasi animasi/browser/GPU.

## Mengulang

Jalankan `npm test`, `npm run check`, `npm run build:web` dan `npm run test:browser` dari root. Browser memerlukan Playwright/Chromium; RUNBOOK.md menjelaskan runtime khusus. Pengujian memakai database memory atau direktori sementara. Jangan arahkan test suite ke database aktif.

Paket QA menyertakan release-tools untuk audit/reproduksi tambahan. prepare-release.py dan test-upgrade.py mengharapkan layout workspace dengan WAE-1.0.0-rc.1/, release-tools/, release-stage/ dan upload/ berisi dua ZIP baseline pengguna. ZIP baseline pribadi tidak didistribusikan. test-real-migration.mjs menerima path salinan input dan output uji; jangan memasukkan database aktif sebagai output.

## Belum dieksekusi

Windows native CMD/PowerShell, koneksi dua akun Baileys nyata, full browser matrix Firefox/Safari, power-loss OS, soak test jangka panjang, beban pemain unik berskala besar, audit hukum dan penetration test independen. Bukti yang tersedia tidak menggantikan pemeriksaan ini.

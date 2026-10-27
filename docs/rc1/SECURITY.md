# Pemeriksaan keamanan RC1

Pemeriksaan dilakukan melalui pembacaan source, test negatif otomatis, audit dependency dan pemeriksaan paket. Ini review implementasi terbatas, bukan penetration test independen.

| Kontrol | Bukti / batas |
| --- | --- |
| Otoritas taruhan | Integer dan batas stake divalidasi server; harga/rules/policy aktif disimpan; browser tidak menentukan payout atau hasil. |
| Idempotency/race | Command fingerprint, unique constraints, optimistic version dan transaksi SQLite; duplicate-request test membuktikan tidak ada debit/payout ganda dalam skenario uji. |
| Wallet | Transfer zero-sum dan ledger check; cadangan lintas game; transaksi payout/release/outbox atomik. Tidak ada pertukaran VCUR atau nilai uang nyata. |
| Autentikasi | Handoff existing, service token untuk internal API; admin terpisah dengan localhost restriction. Origin/CSRF diperiksa pada mutasi browser. |
| Proxy | Admin, demo-login dan diagnostik menolak forwarded headers. Deployment publik tetap wajib menonaktifkan DEMO dan memakai HTTPS/cookie Secure. |
| Data pemain | Views milik pemain; seed Lottery disembunyikan sampai publish. SSE mengulang validasi autentikasi ketika mengirim event dan heartbeat. |
| RNG/audit | crypto seed, commitment/reveal Lottery, deterministic verifier. Admin tidak diberi endpoint reroll; early close/publish memakai version dan audit. Host/database administrator tetap dipercaya. |
| Treasury admin | Alokasi faucet memerlukan admin, alasan dan command ID; supply tidak bertambah; test pool tetap terpisah. |
| WA | Handler mengambil identitas dari message key tepercaya; allowlist/private/fromMe guard; tidak memercayai nomor pengguna dalam teks command. |
| Upgrade | Path traversal/symlink dan protected paths ditolak, checksum payload/source/backup, no force overwrite, database backup konsisten, rollback diblokir setelah ledger baru. |
| Distribusi | Tidak menyertakan .env nyata, DB, auth state WA atau node_modules; setup menghasilkan token acak baru, contoh token kosong. |
| Dependency | npm audit: 0 vulnerabilities yang dilaporkan pada dependency terkunci saat eksekusi. |

## Risiko dan batas tersisa

- WAE adalah layanan satu instance dengan SQLite lokal. Reverse proxy yang dikonfigurasi salah, host kompromi, akses langsung file database atau pencurian token berada di luar jaminan test ini.
- Bukti race test adalah duplicate-command dan beberapa identitas, bukan bukti kapasitas layanan publik. Belum ada DDoS/load/soak test atau chaos power-loss penuh.
- Log audit di database yang sama bukan penyimpanan WORM atau perlindungan terhadap DBA jahat. Backup mengandung data sensitif; operator harus membatasi akses.
- Patch berhenti pada source conflict. Konflik membutuhkan review/merge; tidak disediakan force. Proses lain yang menulis langsung ke proyek/database harus dihentikan selama upgrade.
- Rollback kode bukan rollback saldo. Setelah transaksi baru gunakan perbaikan ke depan, bukan restore database lama yang menghilangkan aktivitas pemain.
- Lottery default OFF, demo lokal default ON untuk instalasi baru. Jangan mempublikasikan konfigurasi default sebagai layanan produksi.

Referensi bukti: final-node-tests.log, final-browser-tests.log, final-upgrade-tests.log dan final-npm-audit.json di evidence/; READINESS.md mencatat gate yang belum diuji.

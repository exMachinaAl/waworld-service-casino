# Baseline nyata dan keputusan implementasi

Source yang diperiksa: lampiran `WORLD-Arcade-Engine-MVP.zip`, package `0.14.0-category-draw-treasury`; namanya MVP tetapi isinya v0.14.0. WA-WORLD pembanding: `WA-WORLD-Starter(1).zip`, package 3.4.0. Kontrak: WAE-v1.0-ChatGPT-Work-Implementation-Prompt.md.

Baseline di folder terpisah, 78/78 tes lulus. `npm ci` dan build Vite baseline juga berhasil. Tidak ada AGENTS.md di kedua ZIP. `.env`, data login WA, backup lama, `.git`, node_modules dan database pribadi tidak disertakan dalam distribusi baru.

Temuan sebelum modifikasi: L1 langsung menghasilkan nomor per entri tanpa taruhan; Blackjack START membutuhkan dua pemain; LEAVE/CANCEL hanya OPEN; stake otoritatif memakai preset; B1 memilih satu pilihan; ledger transfer maksimum 100.000 akan menolak payout 36×3.000; belum ada reservasi lintas game. Admin lama hanya mode test loopback.

Keputusan aturan:
- Lottery: hadiah dasar tetap, tidak proporsional terhadap harga tiket; numerator/denominator BigInt; min prefix 4; pengali tetap 3/2 pada rules v1; half-up sekali lalu cap. Harga, digit, cap, kuota, jadwal, izin cancel dan early release immutable. Tidak ada edit atau reroll admin.
- Seed 32 byte dari crypto; commitment SHA256 atas string seed hex. Hasil HMAC-SHA256 dengan counter dan rejection sampling byte <250. Seed baru dibuka bersama hasil. Admin DB/host tetap trusted; API bukan perlindungan terhadap operator yang mengubah file database secara langsung.
- DRAFT dibuat admin, OPEN eksplisit mengikat budget; OPEN boleh future-dated, pembelian baru setelah opens_ms. Scheduler melanjutkan OPEN/CLOSED/DRAWING/PUBLISHED. Seluruh PUBLISHED→SETTLED dan wallet/outbox satu transaksi: keadaan parsial tidak dapat dilihat browser, jejak transisi ada di audit.
- Reserve budget penuh per Lottery/Roulette sebelum menerima peserta. Per tiket liability max(hadiah cap, harga), per slip max(max payout semua 37 kemungkinan, total stake). Total maksimum peserta tidak boleh melebihi budget.
- BJ belum memotong/hold saldo pada READY. Debet atomik saat START; CANCEL/LEAVE prastart tidak memerlukan refund. Host leave mengalihkan host ke kursi tersisa, atau cancel bila sendiri. Active LEAVE wajib confirm_forfeit=true, kalah tanpa refund; timeout auto-stand. Natural gross return floor(5×bet/2).
- Slot mempertahankan paytable; reserve konservatif hingga akhir bonus/guci, bukan mengubah RNG atau memotong payout. Max multiplier per spin yang dipakai untuk reservasi: Classic 24, Scatter 262, Guci 121, Blast 132, Fusion 292; bonus max 50. Max stake 3.000 adalah batas policy, bukan jaminan treasury cukup untuk seluruh kemungkinan bonus. Jika reserve tidak cukup, taruhan ditolak sebelum RNG/debit.
- SQLite satu instance, BEGIN IMMEDIATE + WAL + FULL synchronous. Semua endpoint menerima hanya tenant baseline wa-world; tenant asing ditolak, belum menawarkan provisioning multi-tenant.
- Admin ronde/policy terpisah dari flag grant test. Tetap hanya host/IP 127.0.0.1 dan tanpa header proxy. Panel admin publik sengaja belum tersedia.
- Alokasi treasury opsional memindahkan ACR dari faucet yang sudah ada dengan admin, alasan, idempotency dan ledger; tidak mencetak supply, tidak mengambil Admin Test Pool, tidak otomatis mengubah database pengguna.

Temuan database lampiran: 1 pemain, 33 sesi, 701 transfer, 1.402 entries. Migrasi mempertahankan semuanya dan seluruh saldo, integrity_check=ok. Maksimum kewajiban konservatif sesi lama 2.530.575 ACR > treasury 805.505 ACR. Defisit 1.725.070 ACR. Migrasi menandai/mencadangkan kewajiban lama tanpa mengubah saldo; admin harus mengevaluasi pendanaan sebelum permainan baru. Faucet yang tersedia pada snapshot: 1.999.500 ACR. Jangan menganggap hadiah pasti sebesar reserve, dan jangan membatalkan sesi lama untuk menghilangkan defisit.

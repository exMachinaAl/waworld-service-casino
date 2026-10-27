# WAE v0.12.0 — B2 Multiplayer Blackjack

## Tujuan
Meja virtual Blackjack dengan 2–4 pemain, satu dealer, satu deck 52 kartu, dan ACR ledger server-authoritative. Dijalankan dari Web GUI atau dari native connector WA-WORLD (DM), bukan dari grup. **Tidak ada perpindahan ACR ke VCUR** dan tidak ada uang nyata.

## Aturan meja v0.12
- Host membuat meja dengan stake 10, 20, atau 50 ACR per pemain. Undangan memakai kode 7 karakter. Kode bukan kredensial autentikasi.
- Dua sampai empat pemain harus `READY` sebelum host boleh `START`. Setelah START, semua stake didebit satu kali dalam satu transaksi lokal.
- Kartu pemain dibagikan bergiliran dari satu deck yang dikocok menggunakan CSPRNG; dealer memiliki satu kartu tertutup.
- Aksi MVP: **HIT** atau **STAND**. Split, surrender, insurance, double, side bets belum tersedia.
- Akses kartu: seorang pemain melihat kartunya sendiri; kartu lawan hanya ditampilkan sebagai jumlah kartu sampai ronde selesai; satu kartu dealer tetap tertutup hingga akhir.
- Total Aces dihitung 11 atau 1. Natural Blackjack (dua kartu berjumlah 21) dibayar 3:2, kecuali dealer juga natural (push). Dealer berdiri pada semua 17 termasuk soft 17.
- Payout total: bust/lose 0, push 1× stake, ordinary win 2× stake, natural win 2.5× stake. Reward berasal dari ACR treasury, bukan VCUR. Bet hanya angka genap tertentu agar jumlah payout integral.
- Pemain yang tidak beraksi selama **90 detik** otomatis dianggap STAND. Engine melakukan sweep setiap 15 detik. Setelah server restart, deadline tersimpan dan sweep dilanjutkan.
- Saat dealer telah selesai, hasil dan pembayaran seluruh pemain dicatat secara atomik. Tidak ada settlement parsial. Tidak ada pembatalan atau leave saat PLAYING agar tidak muncul refund ganda.
- Room OPEN kedaluwarsa setelah 2 jam tanpa permainan dan tidak memotong saldo pemain.

## HTTP API (requires authenticated browser cookie)
- `GET /api/v1/blackjack-tables`: meja publik terbuka dan meja saya
- `POST /api/v1/blackjack-tables` body `{ "bet": 10, "command_id": "UUID" }`
- `GET /api/v1/blackjack-tables/preview/CODE`
- `POST /api/v1/blackjack-tables/join` body `{ "code":"XXXXXXX", "expected_version":1, "command_id":"UUID" }`
- `GET /api/v1/blackjack-tables/:id`: state privat yang diproyeksikan menurut pemain
- `POST /api/v1/blackjack-tables/:id/actions` body `{ "action":"READY|START|HIT|STAND|LEAVE|CANCEL", "expected_version":1, "command_id":"UUID" }`
- `GET /api/v1/blackjack-tables/:id/events` SSE event `table`, memverifikasi keanggotaan dan sesi web ulang
- Aksi internal `TIMEOUT` dapat digunakan setelah deadline oleh anggota atau server sweep; belum bisa dipakai sebelum waktu berakhir.

## API khusus konektor WhatsApp
Endpoint `/internal/v1/blackjack-tables/*` menggunakan `X-WAE-Service-Key`, mempercayai identitas pengirim **hanya** dari adapter WA-WORLD dan tidak dapat diakses langsung oleh pemain. Adapter mendukung:

```text
.wae bjroom create 10
.wae bjroom list
.wae bjroom join KODE
.wae bjroom status KODE
.wae bjroom ready KODE
.wae bjroom start KODE
.wae bjroom hit KODE
.wae bjroom stand KODE
.wae bjroom leave KODE
.wae bjroom cancel KODE
```

Pembaruan WhatsApp belum dikirim proaktif pada setiap giliran: user mengambil status lewat command `status`. Konektor di ZIP ini **tidak otomatis memodifikasi WA-WORLD asli**. WA-WORLD perlu mengarahkan command `.wae` ke adapter terbaru dengan konfigurasi service key yang benar.

## Keamanan dan penyimpanan
- Semua operasi menulis dilindungi transaksi SQLite `BEGIN IMMEDIATE`, deduplication command id dan version checking.
- `bj_tables`, `bj_members`, dan `bj_commands` dibuat via `CREATE TABLE IF NOT EXISTS`. Tidak memigrasikan atau menghapus tabel lama.
- Data deck dan dealer hole card disimpan di `state_json` hanya pada server; API Web dan WA menggunakan `view()` yang disaring per anggota.
- Wallet ACR tetap memakai existing double-entry ledger. Sumber payout adalah akun treasury ACR.
- Jika request timeout, jangan ulangi command baru tanpa menyegarkan status; gunakan command id identik untuk replay aman.
- `GET /events` ditolak bagi nonanggota meskipun mengetahui kode meja.
- Pastikan WhatsApp group handler menolak game control dan rahasia pemain tidak dibagikan ke grup.

## Pengujian sebelum digunakan teman
1. Jalankan `npm test` dan `node scripts/verify-jsx.mjs` (source checking).
2. Build React via `INSTALL.bat`, karena Vite membutuhkan dependency npm yang harus diunduh.
3. Buat dua identitas **berbeda**. `demo-login` lokal hanya satu identitas bersama, tidak cukup untuk menguji dua pemain.
4. Uji membuat dan join meja melalui kombinasi Web dan WhatsApp, READY lalu START, HIT dan STAND secara bergantian.
5. Uji aksi bersamaan, refresh browser, restart Node, kehilangan jaringan, timeout giliran, dan akurasi ledger.
6. Uji dengan empat pemain, termasuk satu keluar sebelum START.
7. Uji konversi wallet WA-WORLD tidak tersedia dan tidak ada perubahan saldo VCUR.

## Batas kesiapan
Status **beta/pre-production**. Build Vite belum lulus di lingkungan pembuatan ZIP karena npm registry tidak dapat diakses. Uji end-to-end di dua perangkat WhatsApp/Web dan audit keamanan sebelum penggunaan publik.

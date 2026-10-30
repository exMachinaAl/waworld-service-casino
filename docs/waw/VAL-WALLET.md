# VAL Wallet — panduan membangun dompet virtual

Status: spesifikasi usulan, belum diimplementasikan. Indeks: [WAW & VAL](README.md).

## 1. Pengertian dan batas MVP

**VAL (Virtual AL)** adalah kredit simulasi, bukan rupiah, token investasi, aset kripto, atau simpanan yang dapat dicairkan. `1 VAL` merupakan satu unit bulat pada MVP; tidak ada sen atau kurs IDR. Jika presisi berubah kelak, lakukan versi skema dan migrasi eksplisit.

Dompet adalah tampilan atas akun dan catatan transaksi. Ledger adalah sumber kebenaran; angka saldo hanya ringkasan yang dapat dibuktikan dari catatan. Memindahkan VAL tidak menciptakan VAL baru. QR hanya mengidentifikasi permintaan transaksi, bukan bukti pembayaran.

Pengalaman yang dipelajari dari dompet seperti DANA: saldo, scan, konfirmasi penerima/nominal, status transaksi, receipt, dan riwayat. Desain VAL memakai merek sendiri. Pada MVP tombol “Isi saldo demo” memakai faucet virtual; tidak ada rekening bank, deposit, cash-out, pinjaman, atau pembelian saldo.

| Istilah | Arti dalam VAL |
|---|---|
| Account | Tempat mencatat kepemilikan saldo suatu pocket |
| Journal + entries | Satu transaksi beserta perubahan bertanda positif/negatif; totalnya nol |
| Available | Saldo tercatat dikurangi hold aktif |
| Hold/reserve | Pembatasan penggunaan saldo untuk kewajiban yang belum selesai; bukan penerbitan saldo |
| Idempotency | Pengulangan perintah yang sama menghasilkan transaksi yang sama |
| Settlement | Pencatatan perpindahan saldo yang sudah final |
| Reversal/refund | Transaksi baru yang mengoreksi transaksi sebelumnya; histori lama tidak dihapus |
| Outbox/inbox | Catatan event dan penerimaan agar retry lintas layanan dapat ditangani |

## 2. Integrasi ekosistem melalui pocket

Identitas `waw_user_id` memetakan identitas Web/WA yang telah diverifikasi. Nomor WA tidak menjadi primary key publik. Pengaitan akun memerlukan bukti kendali kedua sisi; kesamaan nama tampilan tidak cukup. Jangan otomatis menggabungkan akun lama hanya karena teks nomor terlihat sama.

| Pocket | Sumber/penggunaan | Perpindahan |
|---|---|---|
| `arcade` | Saldo ACR lama yang dimigrasi, faucet tetap, hasil simulasi | Hanya pemain ↔ treasury Arcade; tanpa P2P |
| `world` | Fitur WAW baru yang kelak memakai VAL | Hanya operasi aplikasi yang disetujui, tanpa dana dari Arcade |
| `lab` | Akun sintetis dan penerbitan fixture | Transfer demo, QR, refund; database terisolasi |
| V/VCUR legacy | Ekonomi WA-WORLD saat ini | Ditampilkan sebagai unit terpisah; tanpa konversi ke VAL |

Saldo tidak dijumlahkan sebagai “saldo dapat dibelanjakan” lintas pocket. UI menampilkan `VAL Arcade` dan `VAL World` secara terpisah. Nama currency yang sama tidak berarti ada kurs atau transfer otomatis. Seri WAW baru mendapat `app_id`, scope, dan aturan pocket eksplisit.

Mulai sebagai **modul dalam proses Arcade yang sama**: game state, ledger, reserve, dan outbox tetap satu commit SQLite. Adapter menggunakan kontrak modul, bukan SQL langsung. Setelah benar-benar diperlukan, pindahkan ke VAL Core terpisah; jangan memindahkan debit via HTTP sambil menganggap rollback database game juga membatalkan debit wallet.

## 3. Kontrak data target

Nama tabel berikut rancangan baru; bukan instruksi menjalankan DDL terhadap database aktif.

| Entitas | Field/constraint minimum |
|---|---|
| `val_accounts` | `id`, `tenant_id`, `owner_id`, `pocket`, `currency=VAL`, `kind`, `balance`, `version`; unique identitas akun sesuai jenis |
| `val_journals` | `id`, tenant, pocket, currency, `kind`, `reference_id`, `created_at`, `actor_id`; unique referensi operasi bisnis |
| `val_entries` | `journal_id`, `account_id`, `delta`; FK dan domain tenant/pocket/currency tervalidasi |
| `val_commands` | tenant, actor, operation, idempotency key, canonical payload hash, status, response; unique gabungan scope tersebut |
| `val_holds` | account, amount, purpose, reference, status; unique active hold per kewajiban |
| `val_payment_intents` | aplikasi, merchant demo, pocket, amount, status, expiry, payer bila terikat, `journal_id` |
| `val_refunds` | original journal, amount, status, unique command; jumlah refund tidak melebihi pembayaran |
| `val_outbox` / `val_inbox` | event ID unik, payload minimum, status delivery/processed |
| `waw_identity_links` | tenant, provider, subject hash/identifier terlindungi, user ID, waktu verifikasi; unique identitas provider |
| `play_limits` / `play_usage` | identitas, batas, waktu efektif, kuota/waktu terpakai dan self-exclusion |

Semua nominal JSON berupa string integer, misalnya `"100"`, untuk konsistensi bila kelak memakai BIGINT. Adapter SQLite sekarang hanya menerima nilai dalam `Number.isSafeInteger`; periksa batas setiap nominal, delta, jumlah hold, agregasi, dan penambahan saldo. Jangan mengubah string besar ke `Number` sebelum validasi. Backend PostgreSQL kelak memakai integer/BigInt, bukan floating point.

Untuk genesis lab, jurnal `ISSUANCE` dapat mengkredit akun faucet dan mendebit akun khusus `ISSUANCE_OFFSET` bertanda negatif. Hanya akun offset tersebut boleh negatif, tidak dapat dibelanjakan dan hanya dimutasi operasi issuance terotorisasi. Ini **model target baru**, bukan perubahan diam-diam pada `accounts.balance>=0` yang ada. Saldo akun pemain, treasury, dan faucet selalu nonnegatif. Penerbitan memerlukan batas total, alasan, audit, dan command unik.

## 4. Invariant ledger

1. `SUM(delta)=0` per jurnal, tenant, currency, dan pocket; tidak boleh menyeimbangkan VAL Arcade dengan VAL World.
2. `balance = opening_balance + SUM(posted delta)` untuk setiap akun. Opening balance hanya untuk impor legacy yang disertai manifest; akun baru dimulai dari nol dan jurnal genesis.
3. `available = balance - SUM(active holds)` dan tidak boleh negatif pada akun yang dapat dibelanjakan.
4. Satu perintah bisnis hanya menghasilkan satu settlement. Key sama dengan body berbeda menghasilkan `409 IDEMPOTENCY_CONFLICT`.
5. Game tidak dapat menentukan penerima arbitrer, mint supply, merilis reserve game lain, atau mengakses pocket yang tidak diizinkan.
6. Refund memiliki referensi jurnal asli dan tidak menghapus transaksi. Total refund sukses tidak melebihi nilai asli; refund bersamaan diperiksa dalam transaksi yang sama.

Contoh akun sintetis setelah faucet diisi melalui genesis:

| Operasi | Entry sumber | Entry tujuan | Hasil |
|---|---|---|---|
| Grant awal | Faucet -500 | Pemain A +500 | Saldo A 500 |
| Bayar demo | Pemain A -100 | Merchant demo +100 | Saldo A 400 |
| Refund penuh | Merchant demo -100 | Pemain A +100 | Saldo A 500 |

Hold 80 pada saldo 500 berarti available 420. Capture 80 harus melepaskan hold dan memposting debit dalam satu commit; jangan menghitung debit serta hold yang sama dua kali. Hold kewajiban game tidak boleh dilepas hanya karena TTL tercapai: periksa penyelesaian game dan aturan pemulihannya dahulu.

Pada source sekarang, `checkLedger()` memeriksa jurnal seimbang dan saldo PLAYER, sedangkan faucet/treasury awal diisi langsung saat database dibuat. Karena itu rekonsiliasi seluruh akun memerlukan opening balance yang terdokumentasi; jangan menganggap jumlah entries historis otomatis sama dengan semua saldo akun.

## 5. Alur transaksi dan API usulan

Prefix `/api/val/v1` berikut **belum tersedia**. Pemanggil mengambil identitas, tenant, dan scope dari sesi/service credential terverifikasi, bukan dari `payer_id` yang bebas dikirim klien.

| Method/path | Fungsi dan izin |
|---|---|
| `GET /wallets` | Pocket milik pengguna, posted/held/available |
| `GET /transactions?cursor=...` | Histori terotorisasi dengan pagination stabil |
| `GET /transactions/{id}` | Receipt hanya untuk pihak yang berhak |
| `POST /lab/grants` | Kuota fixture di lab; tidak tersedia di runtime Arcade publik |
| `POST /lab/transfers` | P2P sintetis di lab, pocket sama |
| `POST /payment-intents` | Aplikasi terdaftar membuat permintaan pembayaran internal |
| `GET /payment-intents/{id}` | Preview minimum; metadata pribadi perlu otorisasi |
| `POST /payment-intents/{id}/confirm` | Pengguna mengonfirmasi nominal, penerima dan versi intent |
| `POST /payments/{id}/refunds` | Merchant demo/operator dengan scope dan alasan |
| `GET /commands/{key}` | Hasil retry/timeout milik actor dan operation yang sama |
| `PUT /me/play-limits` | Batas bermain dengan aturan waktu efektif |
| `POST /me/self-exclusion` | Blokir langsung; endpoint pencabutan tidak menjadi bypass |

Contoh kontrak konfirmasi (data sintetis):

```http
POST /api/val/v1/payment-intents/pi_demo_001/confirm
Idempotency-Key: demo-confirm-000001
Content-Type: application/json

{"expected_version":1,"amount":"100","currency":"VAL","pocket":"lab"}
```

```json
{"status":"SETTLED","payment_id":"pay_demo_001","journal_id":"j_demo_001","amount":"100","currency":"VAL","pocket":"lab","available":"400"}
```

Nominal/pocket dari body digunakan untuk mendeteksi perubahan terhadap preview; nilai otoritatif tetap di intent server. Respons gagal memakai kode seperti `INSUFFICIENT_VAL`, `INTENT_EXPIRED`, `POCKET_FORBIDDEN`, `PLAY_LIMIT_REACHED`, dan `SELF_EXCLUDED`.

Urutan transaksi lokal: autentikasi → mulai transaksi → cari command → cocokkan fingerprint → kembalikan receipt lama jika sudah committed → validasi intent, ownership, izin, limit dan available → tulis journal + entries + saldo + state + usage + receipt + outbox → commit. Retry transaksi yang sudah sukses boleh membaca receipt walau pengguna kemudian diblokir; ia tidak membuat taruhan baru. Kegagalan tidak boleh meninggalkan debit parsial.

SQLite MVP menggunakan satu writer dan `BEGIN IMMEDIATE`, mengikuti pola repo. Jika pindah PostgreSQL, kunci akun dalam urutan konsisten dan intent/command terkait; uji race pada backend itu. Jangan menjanjikan HA hanya dengan membuka beberapa proses SQLite.

## 6. Pemisahan layanan kelak

Game membuat `operation_id` permanen dan merekam state pending serta outbox sebelum permintaan remote. Wallet melakukan hold/capture/settle idempoten; game menyimpan ACK memakai inbox unik. Pada timeout, tanyakan status operation yang sama; jangan membuat operation baru atau menganggap transaksi gagal. Hasil RNG yang sudah dipersistenkan tidak diundi ulang.

Gunakan protokol eksplisit `PREPARED → RESERVED → RESULT_RECORDED → SETTLED` dengan worker pemulihan. Pemulihan melanjutkan settlement hak yang sudah tercatat; pembatalan hanya untuk operasi yang menurut aturan belum mengikat. Tiap transisi memiliki ownership dan referensi game yang cocok. Untuk game dengan exposure payout, reserve treasury maksimum juga wajib tercatat sebelum taruhan diterima. Uji crash pada setiap celah commit sebelum ekstraksi layanan disetujui.

Event minimal: `event_id`, versi schema, tenant, app, operation, journal, status, timestamp; jangan menyertakan token atau nomor WA penuh. Delivery bersifat at-least-once. Consumer menyimpan inbox unik dan hanya menampilkan receipt setelah verifikasi status wallet. Request service yang sah belum tentu berhak mendebit pengguna: perlu otorisasi pengguna untuk intent/operasi terkait.

## 7. Migrasi ACR ke VAL Arcade

1. Inventaris seluruh akun, opening balances, transfers, entries, game_actions, sessions, reserve dan outbox. Ukur ulang kewajiban; angka snapshot RC1 tidak dipakai sebagai saldo saat ini.
2. Buat backup SQLite konsisten dan uji restore pada direktori staging. Catat hash manifest, versi schema/source dan timestamp cutoff.
3. Tahap pertama tambahkan metadata dan label **VAL Arcade (sebelumnya ACR)**; angka saldo, histori ID, paytable, serta error API legacy tetap kompatibel. Migrasi ini adalah pergantian nama unit 1:1, bukan fasilitas penukaran.
4. Saat ledger baru diperlukan, impor akun/pemetaan dan sejarah dengan ID legacy unik. Opening balance diturunkan dari snapshot yang diaudit. Reserve dan sesi aktif harus ikut direkonsiliasi, bukan hanya saldo.
5. Lakukan shadow-read dan perbandingan; hanya satu ledger yang menerima write. Jangan menjalankan dual-write tanpa protokol pemulihan.
6. Hentikan penulisan, proses/drain pekerjaan sesuai runbook, ambil snapshot akhir, impor delta bila ada, verifikasi ulang, lalu alihkan writer. Tolak startup writer lama setelah cutoff melalui migration fence/schema guard.
7. Bukti penerimaan: jumlah akun/jurnal cocok, mapping unik, available dan reserved cocok, semua sesi memiliki pemilik/kewajiban, tidak ada grant otomatis tambahan.
8. Sebelum write baru, rollback dapat memakai snapshot sesuai runbook. Sesudah write baru, rollback kode hanya ke versi kompatibel; lakukan forward repair atau rekonsiliasi seluruh delta. Restore snapshot lama yang menghapus transaksi bukan rollback yang sah.

V/VCUR WA-WORLD tidak diubah oleh migrasi ACR. Verifikasi skema, aturan issuance, binding identitas dan aset WA-WORLD menjadi pekerjaan terpisah sebelum mendesain migrasi V.

## 8. Kontrol implementasi

Server menyimpan secret; frontend tidak memegang service token. Mutasi browser perlu sesi, perlindungan CSRF/origin, rate limit dan konfirmasi yang jelas. Konfirmasi sensitif dapat memakai autentikasi ulang; jangan meminta PIN DANA atau OTP provider ke form VAL. Jika kelak membuat PIN VAL, gunakan hash password yang sesuai, batas percobaan, dan proses recovery terverifikasi, bukan hash cepat biasa.

Service credential dibedakan per aplikasi, scope dan environment. Cabut akses perangkat, rotasi key, redact log, batasi akses backup, dan audit penyesuaian admin. Jalur service bot tidak memberi hak operator. Akun lab/demo tidak boleh muncul pada environment pemain. Integrasi WA menggunakan identitas message key tepercaya, hanya DM, dan perintah duplikat memakai operation ID stabil.

Audit database bukan bukti tahan perubahan oleh administrator host. Simpan ekspor audit/manifest terpisah bila kebutuhan assurance meningkat. Periksa [backlog uji](BUILD-BACKLOG.md) sebelum mengaktifkan transaksi baru.

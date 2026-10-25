# Admin ACR Toolkit — WAE v0.5.0

## Tujuan
Panel Admin untuk **pengujian lokal**. Admin boleh menambah dan mengurangi **ACR** pemain yang sudah terdaftar. **Tidak menyentuh VCUR WA-WORLD**, tidak mengaktifkan konversi atau transfer, dan bukan fasilitas uang nyata.

## Setup pertama (Windows)
1. Pastikan WAE v0.4.0 sudah ditingkatkan ke v0.5.0, dan hentikan `START.bat`.
2. Di folder proyek WAE utama, jalankan `ADMIN-SETUP.bat`. Buat username + password admin **minimal 12 karakter**. Input password disembunyikan. Jangan mengirim password ke orang lain.
3. Edit `.env` yang berada di root proyek WAE, tambahkan **satu baris**: `WAE_ADMIN_TEST_GRANTS=1`.
4. Pastikan `.env` memakai `WAE_HOST=127.0.0.1` dan `WAE_DEMO_MODE=1`. Ini fitur pengujian lokal saja.
5. Jalankan `INSTALL.bat` (build React), lalu `START.bat`.
6. Buka `http://127.0.0.1:8787`, masuk mode demo, klik **Admin ACR**, lalu masukkan username dan password admin tadi.

**Tidak ada default password dan demo player tidak otomatis menjadi admin.** Password hanya disimpan dalam hash scrypt+salt di database lokal. Sesi admin menggunakan cookie berbeda dari sesi pemain, HttpOnly dan SameSite; POST memeriksa Origin. Logout admin mencabut sesi admin.

## Operasi
- Cari pemain lewat ID atau identity `demo:local-demo` / `wa:...` (identitas WA nyata dapat muncul dalam tampilan admin, jaga privasi).
- Pilih pemain; pilih `Tambah ACR` atau `Kurangi ACR`.
- Isi jumlah 1–50.000 ACR dan alasan minimal 8 karakter.
- Konfirmasi dan tekan proses, lalu lihat saldo serta transaksi pada panel.
- Setiap permintaan memiliki `request_id` untuk idempotency dan dicatat pada `admin_adjustments`, `transfers`, `entries` dan audit.
- Batas hadiah administrasi 200.000 ACR / UTC day untuk seluruh pemain, bersumber dari **pool TEST** 5.000.000 ACR yang terpisah dari treasury game. Pengurangan mengembalikan ACR ke pool test. Tidak ada penerbitan ACR baru tiap klik.

Jika pool habis, operasi ADD ditolak. Tidak ada API publik untuk menambah pool. Untuk menguji lebih dari kuota yang ditentukan, gunakan database demo yang baru dan terisolasi, bukan memodifikasi treasury game produksi.

## API admin (hanya mode testing localhost)
- `POST /api/v1/admin/login` body `{username,password}`
- `GET /api/v1/admin/me`
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/players?q=...`
- `GET /api/v1/admin/adjustments`
- `POST /api/v1/admin/wallet/adjust` body `{player_id,operation:"ADD"|"DEDUCT",amount,reason,request_id}`
- `POST /api/v1/admin/logout`

Semua kecuali login memerlukan cookie admin. Jangan gunakan `x-wae-service-key` atau kredensial BAILEYS sebagai login admin. Selalu gunakan HTTPS jika dipublikasikan, tetapi fitur test ini sendiri **harus dimatikan** (`WAE_ADMIN_TEST_GRANTS=0`) sebelum menjalankan WAE secara publik.

## Keamanan dan rollback
- Backup patch berada di `data/_wae-upgrades/` dan tidak disimpan di luar proyek.
- Rollback source **tidak** menghapus data/ atau tabel admin; nilai saldo/ledger yang sudah berubah tetap dipertahankan, karena menghapus ledger berisiko merusak keuangan virtual. Jika database harus dipulihkan, gunakan prosedur backup database terpisah, bukan rollback kode.
- Berikan izin akses file `data/arcade.sqlite` hanya kepada user sistem yang menjalankan server.

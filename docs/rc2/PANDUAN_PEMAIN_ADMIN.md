# PANDUAN PENGGUNAAN WAE 1.0.0-rc.2

## Pemain
1. Login demo di `http://127.0.0.1:8787` atau tautkan via `.wae web` dari WA-WORLD.
2. Buka menu **Panduan & Bantuan** untuk petunjuk interaktif di React.
3. Lottery: buka Lottery Exclusive → OPEN, pilih ronde, baca syarat, isi nomor dengan digit tepat, konfirmasi tiket. Hadiah diumumkan sesuai jadwal, tidak instan.
4. Jika OPEN kosong, buka UPCOMING, RESULTS, atau hubungi admin; Lottery tidak membuat ronde otomatis.
5. Game tidak dapat mengirim ACR ke VCUR. ACR hanya untuk simulasi hiburan tanpa nilai nyata.

## Admin: membuat Lottery
1. Gunakan server di localhost. Atur `.env` dengan `LOTTERY_ENABLED=true`, `WAE_ADMIN_ENABLED=1`; siapkan akun via `ADMIN-SETUP.bat`.
2. Buka **Admin → Lottery**. Nilai tiket bawaan kini diisi dari minimum policy L1. Jika mengalami `BET_TOO_LOW`, buka **Admin → Kebijakan Taruhan**.
3. Tekan **Segarkan waktu contoh**, lalu periksa buka/tutup/publish. Buat DRAFT; DRAFT belum dapat dibeli pemain.
4. Klik ronde di bawah panel, tekan OPEN. Pemain bisa membeli tiket setelah `opens_ms` tercapai.
5. Setelah tutup, server dapat mengumumkan otomatis saat waktu publish; admin hanya bisa mempercepat dengan `early_release=true` yang ditetapkan sebelum pembukaan. Admin tidak dapat mengubah angka hasil.
6. Treasury harus punya cadangan bebas untuk membayar hadiah. Jika tidak, atur alokasi dengan audit di menu Treasury.

## Kebijakan taruhan
- RC2 migrasi opsional `npm run migrate:rc2` akan menurunkan batas global lama >3000 ACR menjadi 3000 ACR dengan audit tanpa mengubah sesi dan taruhan aktif. Nilai yang sudah lebih kecil tidak dinaikkan.
- Minimum efektif adalah maksimum antara global dan kebijakan game, sehingga tiket bawaan 10 ACR tidak lagi dipaksakan ke akun yang minimumnya 100 ACR.
- Admin dapat mengubah batas untuk transaksi baru setelahnya, sesuai safeguard aplikasi.

## Instalasi / upgrade
1. Lakukan backup mandiri jika ini sistem berisi data penting.
2. Extract patch sejajar proyek dan gunakan CHECK.bat → UPGRADE.bat.
3. Migrasi RC2 dijalankan oleh updater setelah code backup; backup SQLite yang konsisten disimpan dalam `data/_wae-upgrades`.
4. Jalankan INSTALL.bat agar Vite React baru dibangun, lalu START.bat. Jika build gagal, aplikasi mencegah bundle RC1 ditampilkan sebagai RC2.
5. Untuk rollback gunakan ROLLBACK.bat dari patch. Rollback memulihkan kode dan bundle React sebelumnya, bukan ledger/transaksi pemain; perubahan policy diaudit dan tidak otomatis dinaikkan kembali.

## Keamanan distribusi
ZIP full RC2 tidak menyertakan .env, database, .git, node_modules atau kredensial. Jika file WAE Main pernah dibagikan ke orang lain, rotasi service token dan password admin.

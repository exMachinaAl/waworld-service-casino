# WAE RC3 Bulk UX — Panduan pemasangan sibling

## Struktur folder WAJIB

```text
D:\WORLD\
  WORLD-Arcade-Engine-Main\
    package.json
    .env                (tidak diubah)
    data\               (tidak diubah)
  WAE-RC3-BULK-UX-PATCH-016\
    CHECK.bat
    UPGRADE.bat
    ROLLBACK.bat
    payload\
```

Folder proyek harus bernama **WORLD-Arcade-Engine-Main**. Upgrader HANYA mencari `../WORLD-Arcade-Engine-Main`. Folder lain tidak akan dipilih secara otomatis.

1. Hentikan START.bat/server Node.
2. Ekstrak ZIP patch sehingga folder patch sejajar dengan folder proyek.
3. Jalankan CHECK.bat, pastikan menampilkan target yang benar dan RC2 cocok.
4. Jalankan UPGRADE.bat dan ketik LANJUT.
5. Masuk ke `WORLD-Arcade-Engine-Main`, jalankan INSTALL.bat untuk membangun React RC3.
6. Jalankan CHECK.bat proyek, lalu START.bat dan refresh browser tanpa cache bila diperlukan.

**Backup source dan bundle React disimpan di folder patch** `_backups/`. Jangan hapus patch sebelum rollout dinyatakan sukses. ROLLBACK.bat dapat mengembalikan file program dan web-dist sebelum upgrade selama belum ada perubahan lokal setelahnya. RC3 tidak melakukan migrasi schema atau transaksi ACR. Perubahan README/CHANGELOG tidak menjadi konflik dan tidak ditimpa. Jika satu file program tidak cocok checksum, upgrade dibatalkan sebelum ada file ditulis.

Syarat: Node.js >=22.16.0 dan dependency React/Vite tersedia untuk INSTALL.bat. Tidak memakai laragon/php. Tidak memodifikasi aplikasi WA-WORLD.

## Daftar bulk perubahan
1. Welcome guide beranda dengan state hide/show.
2. Panduan game dari katalog.
3. Direktori panduan dengan search dan filter.
4. Bantuan kontekstual dari game aktif.
5. Pencarian katalog dan empty-state.
6. Navigasi cepat khusus mobile.
7. Lottery/Roulette manual refresh.
8. Peningkatan terjemahan error Lottery, taruhan, treasury.
9. Versi bundle RC3 wajib; bundle RC2 ditolak.
10. Upgrader sibling target eksplisit dengan checksum + backup + rollback.

## Tidak dilakukan
Tidak mengubah odds/RNG, policy taruhan, data pengguna, ledger ACR, migrasi database, konversi VCUR, ataupun konektor WA-WORLD.

## Pengujian minimum di Windows
- Install dan START tanpa error, lalu buka `http://127.0.0.1:8787`.
- Beranda menampilkan Mulai dari sini; tombol sembunyikan dan tampilkan ulang berfungsi.
- Katalog mencari game, tombol Cara main membuka topik yang benar.
- Menu Bantuan menampilkan kategori dan pencarian.
- Di HP, bottom tab tidak menutupi tombol konfirmasi transaksi.
- Lottery empty-state dan tombol refresh jelas; game lama tetap bisa dimainkan.
- ACR dan Lottery histories tidak berubah setelah upgrade.

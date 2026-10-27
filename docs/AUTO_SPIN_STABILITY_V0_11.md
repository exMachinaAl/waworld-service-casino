# WORLD Arcade Engine v0.11 — Auto Spin, Paylines & Click Stability

## Perubahan utama

- Auto Spin khusus Slot A1-01..A1-05: 10, 30, 50, 100 putaran; atau `∞ → BONUS` untuk game yang mempunyai bonus.
- Mode `∞ → BONUS` berhenti saat Scatter retrigger, Guci unlock, atau Column Blast aktif, dan memiliki batas keamanan **500** putaran per aktivasi. Bukan benar-benar infinite tanpa kontrol.
- Setiap aksi dikirim **berurutan**. Ada satu permintaan yang boleh berlangsung dalam satu waktu; tombol Stop membatalkan putaran berikutnya (tidak membatalkan transaksi yang sudah diterima server).
- Auto Spin berhenti bila guci meminta pilihan manual, ada gangguan koneksi, penolakan batas API, atau saldo tidak mencukupi.
- Untuk mode kuota, putaran bonus yang terjadi ikut dihitung sebagai putaran, tetapi tidak memotong ACR sesuai aturan game.
- Animasi reel mematuhi reduced motion; tidak boleh mengubah hasil server.
- Penanda kemenangan menunjukkan garis **horizontal dari kiri** sesuai `last.lines`/`last.matches` server, bukan kolom vertikal. `✨ SCATTER` diberi penanda pada simbol dan kolom yang memilikinya; free spins tetap diputuskan server berdasarkan **kolom berbeda**.
- API aksi game memiliki batas yang terpisah dari POST umum: 90 aksi/pemain/menit, burst 7 aksi/3 detik, limit IP 120/menit, HTTP 429 dan `Retry-After: 3`. Backend tidak reboot akibat penolakan rate limit.
- Client mengunci request sebelum render berikutnya dan menghindari replay pada timeout. Saat HTTP 409/429/503 atau koneksi tidak pasti, client mengunduh state serta saldo otoritatif kembali dari server.

## Batasan penting

Auto Spin bekerja hanya selama tab Web aktif dan pengguna terhubung. Ini **bukan** antrean backend; penutupan tab menghentikan aksi lanjutan. SPIN yang sudah diproses tidak bisa dibatalkan.

ACR adalah kredit simulasi tanpa nilai uang. Tidak ada jalur pembelian, cash-out, atau konversi VCUR. Perubahan ini tidak memodifikasi game rules, database, WA-WORLD, reward atau probabilitas.

## Uji manual yang dianjurkan

1. A1-01: Auto 10, periksa 10 perubahan versi; hentikan di tengah, periksa tidak ada request lanjut.
2. A1-02: `∞ → BONUS`, tunggu bonus lalu pastikan berhenti pada trigger dan simbol Scatter disorot di kolom benar.
3. A1-03: pilih auto 30; begitu guci siap, auto berhenti hingga pilihan dibuka manual.
4. A1-04: cocokkan garis highlight dengan daftar `last.lines` dan hasil ACR server, khususnya sesudah BLAST.
5. A1-05: pastikan garis dan Scatter menggunakan hasil grid server; bila muncul guci, stop dan pilih manual.
6. Klik SPIN cepat berkali-kali dan tekan Auto berulang. Engine tidak reboot; pada batas permintaan muncul pesan rate limited dan sinkronisasi saldo.
7. Simulasikan putus jaringan setelah SPIN. Refresh halaman: versi state & saldo harus sesuai server tanpa debit kedua.
8. Uji layar mobile, landscape, dan opsi reduced motion untuk melihat penanda garis tetap sejajar.
9. Uji browser sesungguhnya dan build Vite: bagian ini tidak bisa dianggap lulus hanya dari unit test.

## Menjalankan setelah upgrade

1. Matikan WAE.
2. Jalankan `CHECK.bat` dan `UPGRADE.bat` dari PATCH 011 **sejajar dengan proyek WAE**, tidak di dalam folder WAE.
3. Jalankan `INSTALL.bat` dari proyek WAE agar React bundle versi 0.11.0 dibuat; jalankan `CHECK.bat` dan `START.bat`.
4. Buka `/`, pilih game A1 dan gunakan kontrol Auto Spin pada sidebar permainan.

README/CHANGELOG yang berubah tetap dipertahankan; seluruh file program menggunakan pemeriksaan SHA-256. Backup ada di `data/_wae-upgrades/` dalam proyek. `ROLLBACK.bat` memulihkan file program dan bundle web sebelumnya, **tidak membatalkan transaksi yang sudah terjadi**.

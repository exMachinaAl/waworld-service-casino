# Roadmap upgrade WAW Arcade

Status: rancangan 29 Oktober 2026. Indeks: [WAW & VAL](README.md).

## Sasaran pengalaman

Pertahankan kesenangan dari visual yang rapi, aturan yang mudah dipahami, permainan sosial, latihan strategi, dan akses yang cepat. Ukuran sukses utama adalah pemain memahami hasil dan dapat berhenti sesuai niatnya. Jangan memakai jumlah spin, kerugian, atau durasi terpanjang sebagai sasaran optimasi.

Untuk orang yang merasa permainan memicu dorongan berjudi, sediakan pilihan menyembunyikan seluruh kasino, membuka game tanpa taruhan, atau memblokir akses permainan. Jangan menjanjikan bahwa bermain kasino virtual akan menyembuhkan atau mengurangi kecanduan.

## Gap dari source saat ini

| Area | Kondisi yang ditemukan | Upgrade |
|---|---|---|
| Auto-spin | Preset berulang, termasuk mencari bonus sampai 500 putaran | Hapus dari pengalaman publik; setiap taruhan baru perlu aksi manual |
| Batas bermain | Ada stake policy dan rate limit, tetapi keduanya bukan anggaran sesi pribadi | Tambah batas waktu, jumlah ronde, dan total stake lintas Web/WA |
| Saldo | ACR dilabel langsung dalam UI; tabel akun belum punya currency/pocket | Tambah metadata dan kontrak wallet; migrasi terencana |
| Ledger | Dua entry per transfer, transaksi atomik, reservasi treasury | Pertahankan; perluas rekonsiliasi semua akun dan opening balance |
| Idempotensi | `transfer()` memakai event key; jalur RC memiliki fingerprint | Wajibkan fingerprint payload di seluruh perintah VAL; jangan mengandalkan event key saja |
| Integrasi | Konektor WA bersifat opsional, VCUR terpisah | Identitas bersama dan scope layanan; tidak berbagi kredensial admin |
| Kesiapan publik | Dokumen RC mencatat batas uji load/live WA | Rilis beta setelah verifikasi baru; hasil historis bukan bukti rilis baru |

## Kebijakan bermain aman yang diusulkan

Angka berikut adalah **default desain untuk diuji**, bukan ambang klinis yang menjamin keamanan atau angka yang diwajibkan regulator.

| Kontrol | Default awal | Perilaku server |
|---|---|---|
| Sesi bermain | 15 menit; pengingat pada menit 10 | Tolak taruhan baru setelah batas; lanjutkan penyelesaian kewajiban yang sudah sah |
| Batas harian | 30 menit aktivitas kasino per identitas | Gabungkan Web, WA, dan beberapa perangkat |
| Jeda | 15 menit setelah sesi | Pergantian kanal atau login ulang tidak mereset jeda |
| Kecepatan | Minimum 5 detik antar taruhan baru | Dicek backend, termasuk saat animasi dimatikan |
| Jumlah ronde | Maksimum 50 ronde berbayar kredit per hari | Bonus tidak menjadi alasan membuka rangkaian taruhan baru |
| Anggaran stake | Pemain menetapkan batas sebelum sesi; default 100 unit untuk beta baru | Hitung total debit taruhan bruto; kemenangan atau grant tidak mengisi ulang anggaran |
| Perubahan batas | Penurunan langsung; kenaikan menunggu 24 jam, tetap dalam plafon produk | Simpan waktu efektif dan audit; admin tidak dapat melewati blokir aktif |
| Blokir mandiri | 24 jam, 7 hari, 30 hari, atau tanpa batas waktu | Aktif segera lintas kanal; tidak ada bonus untuk kembali |
| Notifikasi | Tidak ada ajakan kasino otomatis | Receipt hanya sesuai transaksi/opt-in; tidak ada pesan “balik modal” |

Plafon stake harus disesuaikan pada beta dengan stake minimum tiap game. Bila minimum melampaui sisa anggaran, game tidak menerima taruhan baru. Jangan mengubah nilai saldo lama demi mencocokkan default.

Waktu server menjadi sumber kebenaran. Simpan timestamp UTC, gunakan tanggal `Asia/Jakarta` untuk kuota harian, dan jangan mengikuti jam perangkat. Sesi dimulai saat taruhan pertama; jendela sesi tetap berjalan walau tab ditutup. Waktu harian dihitung sebagai gabungan interval sesi agar banyak tab tidak menggandakan atau mereset kuota. Mencapai batas harian membuat sesi baru ditolak sampai hari berikutnya, dengan jeda aktif tetap dihormati.

Self-exclusion menolak taruhan baru, pembelian entri, auto-play, dan aktivasi bonus interaktif. Payout/refund yang sudah menjadi hak tetap diselesaikan. Sesi blackjack atau bonus tertunda memerlukan kebijakan timeout/penyelesaian deterministik yang dipublikasikan sebelum rilis; jangan menghapus hak pemain atau membuka blokir hanya agar sesi selesai. Penyelesaian ini tidak boleh menjadi jalur taruhan tambahan. Jika penyelesaian noninteraktif belum tersedia, fitur terkait belum boleh masuk beta.

## Desain yang menarik dengan batas yang jelas

- Lobby mengutamakan mode latihan tanpa taruhan, aturan singkat, dan tombol berhenti yang terlihat.
- Tampilkan durasi sesi, total stake, total payout, dan hasil bersih. Contoh stake 10 dan payout 4 ditulis “hasil bersih -6 VAL”; jangan merayakannya sebagai menang.
- Animasi mengikuti hasil server, dapat dikurangi, dan tidak merekayasa tampilan “hampir menang”. Hasil, peluang, dan RTP tidak dipersonalisasi berdasarkan riwayat kalah.
- Progress berupa tutorial dan pencapaian keterampilan; tidak ada streak harian yang hangus, hadiah mengejar kekalahan, VIP berdasarkan volume taruhan, atau leaderboard kerugian.
- Kosmetik dapat gratis dan terikat akun. Hadiah kasino tidak membuka item yang dapat dijual, ditransfer, ditukar uang, atau menggantikan pembelian barang/jasa nyata.
- Faucet memiliki kuota tetap, tanpa syarat menonton iklan, bermain terus, mengajak teman, atau membayar. Saldo habis mengarah ke istirahat atau latihan tanpa taruhan.
- Profil “sembunyikan kasino” menghapus tautan promosi kasino di seluruh seri WAW, termasuk bot. Tidak perlu memberi label “pecandu” pada profil pengguna.

## Tahapan implementasi

Estimasi untuk satu pengembang yang sudah memahami repo, bukan janji jadwal. Utamakan syarat lulus; fase dapat memanjang setelah temuan migrasi atau uji pengguna.

| Fase | Perkiraan | Hasil konkret | Syarat lulus |
|---|---|---|---|
| 0 — Baseline | 2–3 hari | Inventaris route/game/identity, backup konsisten, hasil test aktual, konfigurasi beta | Restore latihan berhasil; saldo dan kewajiban cocok; tidak membuka database pengguna untuk eksperimen |
| 1 — Perlindungan | 1–2 minggu | Guard backend bersama, batas sesi, blokir mandiri, hapus UI auto-spin, ringkasan hasil bersih | Bypass via WA, tab baru, retry dan restart gagal; kewajiban lama tetap selesai |
| 2 — Fondasi VAL | 1–2 minggu | Metadata currency/pocket, service ledger internal, receipt, riwayat, rekonsiliasi | Tidak ada overdraft/debit ganda; setiap akun cocok opening + entries |
| 3 — Lab dompet/QR | 1–2 minggu | Faucet lab, transfer sintetis, QR dinamis, refund, outbox | Dua scan bersamaan hanya satu settlement; token kedaluwarsa ditolak |
| 4 — Integrasi WAW | 2–3 minggu | Mapping identitas, adapter WA, katalog aplikasi dan pocket | Hak akses per aplikasi; VCUR tidak berubah; pengujian dua akun WA nyata |
| 5 — Beta terbatas | 1–2 minggu | Pemantauan, tes beban, pemulihan, evaluasi pemahaman pemain dewasa | Semua gate P0/P1 lulus; tidak ada koneksi uang nyata; penghentian akses dapat dibuktikan |
| 6 — Ekstraksi layanan | Sesuai kebutuhan | VAL Core terpisah, outbox/inbox, protokol settlement tahan retry | Crash/timeout lintas layanan tidak menimbulkan saldo atau payout ganda |

Fase 0–5 sekitar 6–11 minggu termasuk buffer, tergantung pengalaman dan scope. Pemula dapat menyelesaikan lab ledger kecil lebih dahulu sambil mempelajari fase lain. Fase 6 tidak dibutuhkan untuk prototipe lokal.

## Metrik dan syarat rilis

Pantau tingkat keberhasilan berhenti saat batas tercapai, pemahaman saldo virtual dan hasil bersih, kesalahan ledger, duplicate settlement, kegagalan restore, dan keluhan akses. Target integritas: nol ledger tidak seimbang, nol transaksi melewati blokir, nol payout ganda pada suite pengujian.

Uji pemahaman dengan skenario: peserta dapat menjelaskan bahwa VAL tidak dapat diuangkan, menemukan tombol jeda, dan membedakan payout dari hasil bersih. Pakai laporan agregat dan persetujuan riset; jangan mengklasifikasikan diagnosis kecanduan dari telemetri atau menargetkan promosi berdasarkan kerentanan. Beta menggunakan peserta dewasa sukarela, bukan kampanye akuisisi orang yang sedang berjuang dengan kecanduan.

Slot, lottery, dan fitur bonus yang belum lulus kalibrasi peluang, cadangan maksimum, atau penyelesaian tertunda tetap nonaktif pada beta. Publikasi memerlukan penilaian kebijakan/hukum sesuai lokasi; label simulasi tidak dengan sendirinya membuktikan izin publikasi.

## Rujukan desain

Evaluasi Gambling Commission melaporkan penurunan intensitas setelah perubahan desain game, tanpa dampak negatif signifikan pada kesenangan yang dilaporkan; laporan juga menyebut keterbatasan atribusi dan pengukuran. Ini menjadi inspirasi desain, bukan bukti bahwa simulasi WAW aman bagi setiap orang atau aturan Indonesia. [Evaluasi resmi desain game](https://www.gamblingcommission.gov.uk/report/assessment-of-online-games-design-changes/assessment-of-online-games-design-changes-executive-summary).

Penghapusan autoplay sejalan dengan arah pembatasan fitur berulang yang dibahas regulator tersebut. [Pembahasan resmi autoplay](https://www.gamblingcommission.gov.uk/consultation-response/online-games-design-and-reverse-withdrawals/summary-of-responses-prohibiting-auto-play-functionality-for-online-slots). Rujukan diperiksa 29 Oktober 2026.

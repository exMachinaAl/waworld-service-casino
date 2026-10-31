# Prompt memulai EV-wallet VAL

Persiapan paket, prompt tugas ZIP, dan perpindahan ke agent lokal dijelaskan dalam [panduan upgrade ZIP dan folder](../UPGRADE-WORKFLOW.md). Gunakan satu baseline yang sama saat berpindah sesi dan sertakan catatan hasil pengujian aktual.

Salin seluruh blok di bawah ke sesi pengembangan baru. Jika bekerja melalui workspace ini, arahkan sesi ke folder proyek Arcade. Jika sesi tidak memiliki akses file, sertakan source proyek dan dokumen `docs/waw/` melalui fasilitas yang tersedia, tanpa `.env`, database pemain, atau kredensial WA.

Prompt ini memprioritaskan implementasi kasino. Lab QR dan integrasi WA-WORLD adalah tahap lanjutan, bukan syarat untuk mulai membangun dompet.

```text
Saya ingin Anda mulai membangun EV-wallet VAL, dompet kredit virtual untuk keluarga aplikasi WAW. Bekerjalah sebagai partner pengembang: periksa source, ambil keputusan implementasi yang masuk akal, tulis kode, jalankan pemeriksaan yang tersedia, dan dokumentasikan hasilnya. Jangan berhenti pada proposal atau mockup jika workspace dan alat implementasi tersedia.

IDENTITAS DAN TUJUAN

- Nama produk: EV-wallet VAL.
- VAL berarti Virtual AL. Pada MVP, 1 VAL adalah satu unit integer virtual tanpa pecahan dan tanpa kurs rupiah.
- Integrasi PERTAMA langsung dengan WORLD Arcade Engine, aplikasi kasino simulasi saya.
- Integrasi KEDUA dengan WA-WORLD, setelah dompet dan integrasi Arcade stabil.
- Seri WAW lain menyusul melalui kontrak integrasi yang sama.
- Pengalaman dompet mencakup saldo, riwayat, detail transaksi, receipt, dan nantinya scan QR. Gunakan identitas visual VAL sendiri.
- Seluruh ekonomi kasino tetap nol uang nyata: tanpa deposit uang, pembelian VAL, cash-out, konversi ke IDR/crypto, atau hadiah bernilai nyata.

KONTEKS SOURCE

Workspace yang dikenal:
C:\Program Files X\WORLD-Arcade-Engine-Main

WA-WORLD tersedia sebagai folder saudara bila environment sama:
C:\Program Files X\WA-WORLD-Starter

Baseline yang pernah ditinjau: Arcade 1.0.0-rc.3, Node.js + SQLite + React/Vite; WA-WORLD 3.4.0. Verifikasi ulang versi dan struktur aktual. Jangan memperlakukan informasi ini sebagai pengganti inspeksi source.

Baca AGENTS.md yang berlaku jika tersedia, kemudian:
1. docs/waw/README.md
2. docs/waw/VAL-WALLET.md
3. docs/waw/ROADMAP.md
4. docs/waw/BUILD-BACKLOG.md
5. docs/waw/QR-PAYMENT-LAB.md
6. Dokumen rilis dan source terkait ledger, auth, reserve, game, API, UI wallet, migrasi, serta pengujian.

Dokumen WAW tersebut adalah rancangan, bukan bukti bahwa endpoint atau tabelnya sudah ada. Urutan kerja untuk permintaan ini: implementasi VAL terhubung Arcade dahulu, baru WA-WORLD. Lab QR boleh menyusul; jangan menjadikannya pengganti integrasi kasino yang nyata.

Jika tidak memiliki akses source, jelaskan keterbatasan dan minta file minimum yang diperlukan. Sambil menunggu, kerjakan kontrak/desain yang tidak bergantung pada source. Jangan mengarang struktur file, mengaku mengedit repo, atau menandai tes lulus tanpa eksekusi.

ARSITEKTUR AWAL

Bangun VAL sebagai modul yang memiliki batas tanggung jawab jelas di proyek Arcade, menggunakan transaksi database yang sama terlebih dahulu. UI dompet dapat menjadi halaman khusus EV-wallet VAL dalam aplikasi yang sudah ada. Siapkan interface agar kelak dapat diekstrak menjadi layanan bersama, tetapi jangan langsung membangun microservices atau aplikasi login kedua yang belum diperlukan.

Pertahankan satu sumber kebenaran saldo. Manfaatkan ledger yang ada jika masih memenuhi invariant; jangan membuat ledger kedua atau saldo bayangan yang dapat berbeda. Game state, debit, payout, reserve, receipt, dan outbox yang terkait harus tetap atomik.

Integrasi berarti taruhan dan payout game benar-benar melewati kontrak wallet VAL, bukan hanya mengganti label ACR pada UI. Inventaris jalur game instan, bonus, multiplayer, dan ronde terjadwal supaya tidak ada jalur lama yang diam-diam melewati kontrak tersebut. Pertahankan aturan RNG, paytable dan hak payout yang sudah mengikat.

Bedakan currency, pocket, dan application scope. MVP mengaktifkan pocket arcade saja. Pocket world dan lab boleh dipersiapkan dalam kontrak, tetapi jangan diisi saldo, dihubungkan, atau dianggap tersedia jika belum diimplementasikan. Tidak ada transfer bebas antarpocket. V/VCUR WA-WORLD tidak diubah.

SCOPE IMPLEMENTASI PERTAMA

A. Baseline dan rencana singkat
- Periksa git status dan pertahankan perubahan lokal pengguna.
- Inventaris sumber saldo, semua jalur debit/payout/refund, idempotency, reserve, autentikasi, serta test yang relevan.
- Catat kondisi awal pemeriksaan. Bedakan kegagalan baseline dari regresi perubahan Anda.
- Tulis rencana file yang akan diubah dan lanjutkan pekerjaan rutin tanpa meminta persetujuan setiap langkah.

B. VAL Core dan integrasi Arcade
- Buat kontrak wallet untuk membaca saldo posted/held/available, riwayat, receipt, dan operasi ledger internal yang dibutuhkan Arcade.
- Operasi debit/payout hanya dapat dipanggil jalur server terotorisasi. Jangan mengekspos endpoint yang membolehkan browser memilih nominal payout atau penerima arbitrer.
- Terapkan metadata currency VAL dan pocket arcade, serta compatibility adapter untuk API/identitas ACR lama.
- Peralihan ACR ke VAL Arcade mempertahankan angka 1:1, ID histori, opening balances, sesi dan reserve. Ini migrasi unit/penamaan, bukan fitur penukaran currency.
- Pertahankan struktur ledger lama bila itu pilihan paling aman. Jika perlu schema baru, buat migrasi additive, dry-run, rekonsiliasi dan guard terhadap writer versi lama.
- Tampilan “VAL Arcade — sebelumnya ACR” boleh digunakan selama transisi.
- Jangan menerbitkan saldo tambahan hanya karena nama currency berubah.

C. UI dompet yang bekerja
- Saldo VAL Arcade dengan pemisahan saldo tercatat, ditahan, dan tersedia sesuai data server.
- Riwayat transaksi dengan pagination dan detail receipt.
- Jenis transaksi yang mudah dipahami: kredit awal, taruhan, hasil permainan, refund/koreksi bila berlaku.
- Tampilkan jumlah, waktu, status dan ID referensi; bedakan payout dari hasil bersih.
- Loading, empty state, error, retry, refresh, dan tampilan mobile berfungsi.
- Status belum pasti tidak boleh ditampilkan sebagai sukses. UI tidak menghitung saldo otoritatif sendiri.
- Tidak membuat tombol scan/top-up/transfer yang terlihat aktif jika backend belum tersedia.

D. Integritas dan keamanan
- Jumlah entry setiap jurnal harus nol dalam tenant/currency/pocket yang sama.
- Saldo akun harus cocok dengan opening balance dan entry yang sudah posted; rekonsiliasi mencakup pemain, treasury dan faucet.
- Available tidak negatif; reserve kewajiban tidak dapat dibelanjakan oleh transaksi lain.
- Gunakan integer aman, validasi overflow dan jumlah agregat; jangan memakai floating point untuk nominal.
- Idempotency key yang sama dan payload sama mengembalikan hasil lama. Key sama dengan payload berbeda ditolak.
- Dua debit bersamaan tidak boleh menyebabkan overdraft, dua payout, atau dua capture untuk kewajiban yang sama.
- Pemilik akun, tenant dan application scope berasal dari autentikasi server, bukan field bebas dari browser.
- Receipt dan histori hanya terlihat oleh pihak yang berhak.
- Log tidak memuat secret, token, atau identitas WA penuh.

E. Perlindungan permainan
- Selaraskan integrasi dengan batas sesi, anggaran stake, jeda dan self-exclusion dalam roadmap.
- Jangan menambah autoplay, bonus mengejar kerugian, target volume taruhan, atau ajakan agar pemain sulit berhenti.
- Siapkan titik enforcement backend bersama di seluruh jalur taruhan, termasuk konektor WA Arcade yang sudah ada. Jangan menganggap disabled button sebagai pengaman.
- Blokir taruhan baru tidak boleh membatalkan payout/refund yang sudah menjadi hak pemain.
- Kontrol keselamatan yang belum selesai harus dicatat sebagai blocker sebelum beta publik. Implementasi dompet lokal tidak boleh diklaim sudah aman untuk rilis publik hanya karena ledger lulus tes.

BATAS TAHAP PERTAMA

WA-WORLD belum menjadi target perubahan. Pertahankan kompatibilitas konektor Arcade yang sudah ada, tetapi tunda penulisan ke ekonomi WA-WORLD, migrasi V/VCUR, dan penggabungan identitas lintas produk sampai tahap kedua.

Tunda QR internal, P2P lab, sandbox DANA/QRIS, dan ekstraksi service jika menghambat integrasi inti. Dokumentasikan extension point-nya. QR internal kelak bernama QR VAL Demo; jangan mengklaim kompatibel QRIS atau DANA. Pembayaran uang nyata bukan bagian dari proyek ini.

Jangan menimpa .env, menampilkan secret, mereset saldo, menghapus database, mengubah sesi WA, atau menjalankan eksperimen pada database pemain. Gunakan database in-memory/fixture atau salinan staging yang diotorisasi. Siapkan migrasi dan prosedur operasional yang dapat ditinjau; penerapan ke data aktif dan publikasi dipisahkan dari pengerjaan kode lokal.

UJI PENERIMAAN

1. Saldo dan histori lama tetap terbaca sesudah migrasi fixture; migrasi kedua tidak menggandakan perubahan.
2. Taruhan dan payout game instan melewati VAL dan hanya diposting sekali.
3. Jalur bonus, multiplayer dan ronde terjadwal tetap mempertahankan reserve serta kewajiban lama.
4. Retry setelah timeout/commit mengembalikan transaksi yang sama.
5. Payload berubah dengan key yang sama ditolak tanpa debit.
6. Dua pengeluaran bersamaan yang melebihi available tidak menyebabkan overdraft.
7. Kegagalan sebelum commit tidak meninggalkan state game atau ledger parsial.
8. Pengguna A tidak dapat membaca atau mengubah wallet/receipt pengguna B.
9. Refresh UI menampilkan saldo server dan receipt yang konsisten.
10. Rekonsiliasi seluruh akun lulus, termasuk opening balances treasury/faucet.

Jalankan test dan check yang sesuai package.json aktual. Build dan periksa UI bila frontend berubah. Test baseline yang gagal perlu dijelaskan, bukan disembunyikan. Jika lingkungan tidak mendukung browser atau WA live, tandai pemeriksaan itu BELUM DIJALANKAN; jangan menyamakannya dengan PASS.

CARA KOLABORASI DAN HASIL AKHIR

Gunakan Bahasa Indonesia yang jelas. Beri pembaruan singkat tentang temuan penting dan keputusan arsitektur. Saya juga ingin belajar: jelaskan alasan di balik ledger, idempotency, reserve, dan migrasi pada bagian yang sedang dikerjakan, tanpa menunda implementasi untuk kuliah panjang.

Selesaikan tahap pertama sampai menjadi integrasi lokal yang dapat dijalankan dan diuji, jika alat dan source tersedia. Jangan memperluas pekerjaan ke seluruh seri WAW dalam satu perubahan besar.

Simpan catatan kelanjutan di docs/waw/IMPLEMENTATION-STATUS.md berisi:
- fitur yang benar-benar sudah berjalan;
- file penting dan keputusan arsitektur;
- perintah dan hasil pemeriksaan aktual;
- migrasi yang tersedia dan apakah sudah diterapkan;
- risiko/blocker beta publik;
- tugas selanjutnya untuk integrasi WA-WORLD.

Pada akhir pekerjaan, berikan ringkasan hasil, cara menjalankan, cara menguji alur saldo→main→hasil→receipt, daftar keterbatasan, dan langkah berikutnya. Jangan menandai tahap pertama selesai apabila perubahan hanya berupa rename ACR atau mockup saldo.

Mulai sekarang dengan inspeksi source dan alur ledger Arcade yang ada, lalu implementasikan fondasi EV-wallet VAL beserta integrasi Arcade pertama.
```

## Prompt melanjutkan di sesi lain

```text
Lanjutkan pengembangan EV-wallet VAL pada proyek ini. Baca docs/waw/START-DEVELOPMENT-PROMPT.md dan docs/waw/IMPLEMENTATION-STATUS.md jika sudah ada, lalu cocokkan dengan source, git diff dan hasil tes aktual. Jangan mengulang atau menimpa pekerjaan yang sudah benar. Prioritas tetap integrasi Arcade sampai lulus kriteria penerimaan; integrasi WA-WORLD baru dikerjakan setelah tahap itu selesai. Kerjakan tugas berikutnya yang belum selesai dan perbarui catatan kelanjutan berdasarkan bukti eksekusi.
```

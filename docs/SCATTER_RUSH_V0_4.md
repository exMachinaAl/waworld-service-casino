# WAE v0.4.0 — A1-02 Scatter Rush

## Kontrak game

Gamecode: `A1-02`. Grid 6 kolom × 4 baris. Simbol: 🍒, 🍋, 🔔, ⭐, 7️⃣, Scatter ✨. Semua hasil dibentuk di server menggunakan `node:crypto.randomInt` (bukan RNG browser). Seluruh kemenangan memakai ACR, **tidak mengubah VCUR**.

- 4 paylines horizontal, masing-masing dibaca dari kiri; 3, 4, 5, atau 6 simbol identik dihitung sebagai satu pembayaran per baris.
- Scatter ✨ **tidak dihitung sebagai simbol payline**; hanya jumlah **kolom berbeda** dengan paling sedikit 1 Scatter yang berlaku.
- 3 Scatter kolom: 10 free spins; 4: 15; 5: 20; 6: 25 (hanya pada putaran dibayar).
- Saat bonus aktif, 3+ kolom Scatter menambahkan **+5 free spins** setiap trigger; total **pemberian putaran** maksimum 50 untuk satu bonus. Tidak ada putaran yang dibeli atau ACR yang dipotong selama free spins.
- Bonus tetap ada dalam `game_sessions.state_json` ketika bot/server restart; bet terkunci sampai bonus berakhir. `game_actions` menggunakan `command_id` unik untuk mencegah dobel settlement.
- Setiap putaran dievaluasi sekali, payout dihitung server dan dikredit melalui ledger atomik. Tidak ada transfer ACR ke VCUR.

## Paytable prototipe

| Simbol | 3 | 4 | 5 | 6 |
|---|---:|---:|---:|---:|
| 🍒 | 2× | 4× | 8× | 16× |
| 🍋 | 3× | 6× | 12× | 24× |
| 🔔 | 4× | 8× | 16× | 32× |
| ⭐ | 5× | 10× | 20× | 40× |
| 7️⃣ | 8× | 16× | 32× | 64× |

Nilai pengali berlaku terhadap besaran satu putaran virtual untuk **setiap** dari 4 baris. Angka di atas khusus prototipe dan belum merupakan hasil tuning RTP. Jangan dipakai sebagai permainan uang nyata.

## API

- `GET /api/v1/games` mencantumkan `A1-02`.
- `POST /api/v1/sessions` dengan body `{"game_code":"A1-02","bet":10}`.
- `POST /api/v1/sessions/{id}/actions` dengan `command_id`, `expected_version`, `action:"SPIN"`, `bet`.
- `GET /api/v1/sessions/{id}` mengembalikan `phase`, `bonus.awarded`, `bonus.played`, `bonus.remaining`, `last.grid`, `last.scatter_columns`, `last.free_spins_added`, `last.lines`, `last.payout`, dan `last.stake_charged`.
- Adapter WA-WORLD yang memanggil endpoint game universal dapat memakai `A1-02` tanpa mengubah kode konektor; tampilan menu/bot khusus Scatter Rush masih merupakan pekerjaan terpisah.

## Pemeriksaan manual di browser

1. Jalankan `INSTALL.bat` agar React v0.4 dibuild, lalu `START.bat`.
2. Masuk dalam mode demo lokal, pilih **Scatter Rush**; pastikan grid 6×4 tampil dan putaran beranimasi.
3. Jika muncul 3+ kolom Scatter, perhatikan penghitung bonus; bila bonus aktif, bet terkunci dan ACR tidak didebit.
4. Refresh halaman / pindah dari WhatsApp; state dan bonus tidak boleh hilang.
5. Coba mode Reduced Motion; hasil resmi tetap sama, hanya animasi lebih singkat.

## Batasan

- Tidak ada autoplay, pilihan multiplier baru, bonus guci, atau Column Blast pada patch ini.
- React production bundle harus dibangun di komputer yang memiliki akses npm; pemeriksaan source bukan substitusi pengujian visual browser.
- Core masih menggunakan `node:sqlite`, tidak disarankan dipublikasikan sebagai kasino online atau perjudian uang nyata.

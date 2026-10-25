# WORLD Arcade Engine v0.2.0 — React Edition

**Sesi**: `GPT-830193-20261025-51D603CA11`  
**Tujuan**: UI game Web lebih serius, tanpa mengubah logika engine, database, integrasi WA-WORLD, atau VCUR.

## Status aktual build

- ✅ **React + Vite SOURCE CODE**: lobby, katalog, game live, roulette wheel, slot reel, blackjack cards, wallet ACR, sesi, security, handoff.
- ✅ **Backend API v0.1** tetap digunakan, SQLite dan session data lama tetap kompatibel.
- ✅ **7+ backend automated tests**; pemeriksaan JSX sintaks bisa dilakukan dengan TypeScript parser.
- ⚠️ **Bundle React production `web-dist/` BELUM ada dalam ZIP ini** karena registry npm tidak dapat diakses saat penyusunan. `INSTALL.bat` mengunduh React, Vite, dan lucide-react via npm dan membangunnya secara lokal. **Internet dibutuhkan saat instalasi pertama.** Jangan klaim React sudah di-build bila langkah ini belum sukses.
- ⚠️ UI React belum lulus browser end-to-end dalam lingkungan penyusun. Uji dengan browser setelah install di PC.

## Install bersih: Windows

1. Ekstrak ZIP proyek baru ke folder sendiri. Jangan ditimpa langsung ke proyek v0.1 yang berisi database.
2. Pastikan Node.js >= 22.16.0, npm, dan internet untuk pemasangan package React.
3. Jalankan `INSTALL.bat`: buat `.env` jika belum ada, jalankan `npm install` di `web/`, build React menjadi `web-dist/`.
4. Jalankan `CHECK.bat` (tes backend dan konfigurasi).
5. Jalankan `START.bat`, buka **http://127.0.0.1:8787**.
6. Untuk pengujian lokal, pilih **Masuk mode demo lokal**. Ini hanya valid di loopback dan `WAE_DEMO_MODE=1`.

### Pindah dari v0.1 tanpa kehilangan data

**Metode paling aman**: gunakan ZIP `WAE-REACT-UPGRADE-PATCH-002.zip` terpisah, yang mengecek hash baseline lalu membuat backup source di dalam `data/_wae-upgrades/`, tidak menyentuh `.env`, `data/arcade.sqlite`, dan integrasi WA-WORLD.

Jika ingin menggunakan full ZIP, jangan meng-copy folder data yang sedang dipakai saat server berjalan. Matikan server lama, lakukan backup manual *di dalam direktori proyek*, lalu pindahkan hanya `.env` dan `data/arcade.sqlite` ke folder v0.2 yang baru. Hindari menjalankan dua server terhadap database SQLite yang sama.

## Linux / Debian

```bash
node scripts/setup.mjs
npm run build:web    # membutuhkan internet pertama kali
npm run check
npm test
npm start
```

Dev React (dua terminal):

```bash
npm start
npm run dev:web
```

- WAE Backend / React production: `http://127.0.0.1:8787`
- Vite development: `http://127.0.0.1:5173` dengan proxy ke backend localhost. Jalankan hanya untuk pengembangan.

## Komponen baru

```text
web/
  index.html
  package.json
  vite.config.js
  src/
    App.jsx         React views + interactions
    api.js          Typed API error semantics
    main.jsx        React entrypoint
    styles.css      Responsive visual system
web-dist/           hasil npm run build:web (generated)
legacy-ui/          vanilla v0.1 archive (not served)
src/                backend WAE (unchanged contract)
```

**Komponen React**: `Lobby`, `GamesView`, `GamePanel`, `WalletView`, `SessionsView`, `SecurityView`, `DeviceLink`, `Login`, `Sidebar`, `Header`.

## Game status

- A1-01 Classic Match 3x3: server generated grid; React reel visualization (current rules unchanged).
- B1 European Roulette 0–36: server generated result; React roulette stage and selection.
- B2 Blackjack Solo: real game sessions with HIT / STAND / NEW_ROUND and hidden dealer card.
- A1-02 Scatter, A1-03 Guci, A1-04 Column Blast, A1-05 Ultimate Fusion: **belum dibuat**.

## Alur Dual Mode

- Dari WhatsApp: `.wae web` di DM → buka link pribadi → claim → bandingkan kode → `.wae approve REF CODE` → finalize → Web membuat cookie sendiri.
- Web ke WhatsApp: Security Center → Aktifkan WhatsApp → kirim `.wae link KODE`, `.wae confirm KODE` di DM → klik Selesaikan pada browser.
- Game state: Web memakai SSE `/api/v1/sessions/:id/events`; WA mengambil state dari API. Update otomatis bot WhatsApp masih belum dibuat.
- Client hanya menerima game projections; wallet selalu berasal dari server, action menggunakan `expected_version` dan `command_id`.

## Keamanan dan deployment

- ACR non-transferable, tanpa deposit / penukaran uang / konversi ke VCUR; ledger authoritative, WAE terpisah dari wallet utama WA-WORLD.
- `WAE_DEMO_MODE=1` khusus lokal; jangan digunakan pada URL publik.
- Publikasi butuh HTTPS, secure cookies, pengetesan sesi, audit keamanan, rate-limit persisten, database produksi, backup dan observability, serta evaluasi kebijakan WhatsApp dan hukum. Source ini belum siap produksi.
- Vite dev server tidak boleh dibuka ke publik. Token service WA hanya disimpan pada `.env` server dan bot asli, tidak di React.
- UI CSS dirancang offline setelah npm build (tidak mengambil gambar atau font eksternal).

## Checklist manual setelah install

- [ ] Browser menunjukkan UI React, bukan halaman 503 “React belum dibangun”.
- [ ] Demo login lokal berhasil; kredit ACR muncul.
- [ ] Ketiga game bisa dibuat; hasil server tampil pada Web.
- [ ] Setelah aksi game, reload browser tetap menunjukkan riwayat sesi.
- [ ] Klik pengaktifan koneksi WA dari Security Center; pastikan kode verifikasi muncul.
- [ ] Handoff WA->Web membutuhkan persetujuan WA dan tidak login hanya dari link.
- [ ] Dengan dua browser, aksi stale ditolak dan ditampilkan status terbaru.
- [ ] VCUR WA-WORLD asli tidak berubah setelah bermain Arcade.
# waworld-service-casino

# Changelog

## 0.2.0 — React Edition

- Menambahkan frontend React 19 + Vite 7 sebagai SPA, responsif untuk desktop dan mobile.
- Mengganti served vanilla HTML dengan hasil production build `web-dist` pada server Node yang sama.
- Meningkatkan halaman game: Slot reels, European Roulette wheel, Blackjack cards, status dan animasi kosmetik.
- Menambahkan dashboard lobby, game library, resume game, ACR Wallet / ledger, device security / WA link, handoff WhatsApp ke browser, SSE live state dan error feedback.
- Menambahkan installer otomatis `npm install` / build React, dev React proxy dan scripts/check-web.mjs.
- Memindahkan UI vanilla lama ke `legacy-ui/` hanya sebagai referensi rollback; tidak diekspos server.
- Tidak mengubah model ekonomi, schema database, command WhatsApp, atau saldo VCUR.
- Build belum dieksekusi di lingkungan pembuat karena npm registry tidak dapat dijangkau. Source React JSX telah diperiksa sintaks dan backend dites.

## 0.1.0 — Initial MVP

- Standalone Node.js engine, SQLite ACR wallet, three games, WA/Web link and SSE API.

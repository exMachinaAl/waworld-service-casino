# Changelog

## 0.3.0 — React Animation Update

- Slot A1-01: cinematic cabinet, staggered animated reels, anticipation effect, winner highlight, confetti for server-confirmed winning rounds.
- Roulette B1: dedicated 37-pocket visual wheel, ball track, easing spin, deferred number reveal; **result is always from the server**.
- Blackjack B2: animated card dealing, table lighting, dealer hole-card privacy retained, action feedback.
- Presentation timeline: while pending, UI keeps the previous result hidden; server-returned state is revealed after visual animation, and buttons are locked until reveal.
- Accessibility: respects OS reduced-motion preference by default, user toggle can choose an explicit preference, and result/status is announced via aria-live.
- Original backend, RNG, game rules, ACR ledger, SQLite database, handoff endpoints, and WA-WORLD connector unchanged.
- START.bat and `npm start` block stale compiled UI; run INSTALL.bat to generate web-dist v0.3.0 after upgrade.
- Three new unit tests for motion/timing logic, on top of seven original backend tests.
- Dependencies unchanged (React 19, Vite 7, lucide-react); no animation libraries added.

## 0.2.0 — React Edition

- React UI with lobby, slot/roulette/blackjack stages, ACR wallet, sessions, device security, and WA handoff.

## 0.1.0 — Initial MVP

- Standalone Node.js engine, SQLite ACR wallet, three games, WA/Web link and SSE API.

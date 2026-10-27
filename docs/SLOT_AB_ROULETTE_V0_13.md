# v0.13.0 — Bidirectional A1 and Physical-Style European Roulette

## Game rule changes

- All A1 payline games (Classic, Scatter Rush, Mystery Guci, Column Blast, Fusion): matching runs of 3+ identical ordinary symbols count starting at either the LEFT or RIGHT boundary of a row. Non-contiguous groups do not count. A full-width matching row counts ONCE (avoid duplicate left/right payouts). Separate runs at both row ends may each win if they do not overlap. B-assisted overlapping wins pay only the higher of two candidate lines.
- A (`⚡`) is a trigger that counts **only in the top row**. A Column Blast activates when **at least 4 distinct columns** have `⚡` in their first row. For those columns, all lower cells are transformed into `⚡`, from top to bottom.
- B (`🔷`) complements ordinary winning runs as a wild/helper, but never itself triggers A Blast, never substitutes for `✨` Scatter, `🏺` Pot or A (`⚡`). A string of only B does not win.
- For Scatter Rush / Ultimate Fusion, Scatter detection is done from the untouched original grid before A transformations. B cannot become Scatter.
- Payline result now reports `row`, `start`, `end`, `direction`, `count`, `symbol`, and `payout`. React draws the line at the correct horizontal coordinate for wins starting from right.

## Shared math and source

- `src/slot-rules.mjs`: `evaluateBidirectionalLines`, `evaluateTopRowBlast`.
- `src/column-blast.mjs`, `src/scatter-rush.mjs`, `src/ultimate-fusion.mjs`, `src/mystery-guci.mjs`, `src/games.mjs`: integrated shared game rules.
- New A top-row draw distribution is a configured 21% per top-row cell; actual bonus frequency must be calibrated from Monte Carlo tests before public release. This version remains beta and is not certified for any money/prize-bearing game.

## Roulette Web

- `web/src/roulette-motion.mjs`: verified European wheel order: `0 32 15 19 4 21 2 25 17 34 6 27 13 36 11 30 8 23 10 5 24 16 33 1 20 14 31 9 22 18 29 7 28 12 35 3 26`.
- `PhysicalRoulette.jsx` and `physical-roulette.css`: SVG 37 individually colored pockets; rotor slows and ball spins in reverse, drops inward and bounces before settling at the **server-chosen** pocket; 4.8-second synchronized timeline. CSS reduced-motion supported.
- This is a **physics-inspired animation**, not a physically simulated RNG. The winning outcome is computed on the server, never from a click position or animation.

## Upgrade and compatibility

PATCH 013 requires unmodified application **source** baseline from v0.12.0. User-modified README and CHANGELOG are not blockers and are not overwritten. No database migrations and no bridge to VCUR. Use CHECK.bat before UPGRADE.bat, then INSTALL.bat (build React), CHECK.bat, START.bat. Rollback restores code/web-dist snapshot but never reverses ledger transactions.

## Acceptance testing

`npm test` must pass including right/left, full-row deduplication, A strictly top row, B complement, Scatter before blast, wheel orientation/unique pockets, wallet integrity and all existing tests. JSX parsed separately. Visual browser/Web GUI testing still required on Windows after a successful Vite build.

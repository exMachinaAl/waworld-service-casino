# WORLD Arcade Engine — A1-05 Ultimate Fusion v0.10.0

## Game rules (prototype virtual-only ACR)

- Grid: 6 reels × 4 rows; cryptographic draws only on the Node server (`node:crypto.randomInt`).
- A1-05 is a **new** game. Existing A1-01 through A1-04, roulette, blackjack and Dice Duel continue unchanged.
- Supported stakes: 5 / 10 / 20 / 50 ACR. There is **no VCUR conversion** and no transfer API.
- Symbol set: 🍒, 🍋, 🔔, ⭐, 7️⃣, ✨ Scatter, ⚡ Blast, 🏺 Guci.
- Horizontal win evaluation: exactly one reward for each row that has 3 or more consecutive identical payable symbols **starting in column 1**. Base multipliers: cherry 2x, lemon 3x, bell 4x, star 5x, seven 8x, lightning 6x; consecutive symbols 4+/5+/6+ double each time. Scatter and Guci do not pay lines.
- Scatter count is the number of **distinct columns** containing ✨ in the ORIGINAL grid, before Blast. 3 columns award 10 free spins, 4 award 15, 5 award 20, 6 award 25 on a paid spin. During an active bonus, 3+ columns award +5 (retrigger). Maximum 50 cumulatively **awarded**, not 50 remaining, in each bonus. Each free spin consumes exactly one awarded spin without debiting ACR.
- Blast count is the number of distinct columns containing ⚡ in the ORIGINAL grid. 3+ columns activate expansion of all cells in those columns to ⚡. Lines are evaluated on the transformed grid. A separate, clearly itemized activation reward equals 2x stake for 3 columns, 4x for 4, 6x for 5, and 8x for 6. The server calculates and settles both exactly once.
- Guci counters persist: paid-spin activity 8; 🏺 symbol occurrences 6; positive line-pay rounds 3. Each threshold creates a sealed ticket with three shuffled rewards 2x, 3x and 5x stake; `sha256` commitment and nonce, options not exposed before choice. Selecting a ticket settles the reward once. Pending guci choices **suspend** free-spin progress; after the queue is emptied, free-spin mode resumes with the previous remaining counter.
- One command ID → one ledger settlement. Version mismatch returns STATE_STALE (HTTP 409). The wallet and game state update inside one SQL transaction. All ACR payouts use the engine's own virtual treasury.
- UI: React `UltimateFusionStage`; 6-column precise reel strips; outcome animation cannot decide RNG or payout. Support reduced motion and calibration guide.

## Exact action order

1. Verify session + version + player identity, reject duplicate or stale command.
2. Require `SPIN`; when pending pot, require `OPEN_POT` instead; lock stake while free spins active.
3. Debit virtual ACR only if the round is paid, not free.
4. Generate original 6x4 grid on the server.
5. Read Scatter columns, Blast columns, Guci symbols from original grid.
6. Transform Blast columns (if at least 3 distinct), then evaluate each horizontal payline once. Compute fixed Blast activation payout separately.
7. Allocate initial/retrigger free spins subject to 50 cumulative max.
8. Update guci progress and create sealed prize tickets before exposing a choice.
9. Credit the combined spin outcome in a balanced ledger transaction, persist session and outbox; publish player-specific projection without unopened ticket contents.
10. For `OPEN_POT`, verify ticket commitment, pay only selected ticket through idempotent ledger entry, and resume remaining bonus after all pots are opened.

## WA Connector

- `.wae fusion 10` creates a session.
- `.wae spin fusion` runs next paid/bonus spin (unless a pot is waiting).
- `.wae open fusion 1` picks one of 3 sealed pots. Old `.wae open 1` continues to refer to Mystery Guci A1-03.
- `.wae web` requests handoff to React. Connector must be installed on WA-WORLD separately; this WAE patch does **not** modify the WhatsApp bot.

## Testing and limitations

Run `npm test` (Node >=22.16). Core tests cover payout, unique-column counting, free spins, 50-spin cap, guci secrecy/reveal, wallet idempotency, HTTP and WA adapter. Run `INSTALL.bat` to build React on Windows, then manually verify mobile and desktop browsers; check calibrated reel positions and game results.

**Beta / pre-production only.** The prototype's probability distribution and rewards require long-run Monte Carlo simulation, virtual-economy stress checks, browser E2E and real WA-WORLD tests before public exposure. The system is virtual-only and neither accepts deposits nor redeems credits for things of value.

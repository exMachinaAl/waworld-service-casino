# WORLD Arcade Engine — A1-04 Column Blast v0.7.0

## Exact rules (first version)
- Virtual **ACR only**, no VCUR transfer or wallet bridge, no external prizes.
- 5 columns × 4 rows, stake must be 5 / 10 / 20 / 50 ACR.
- Symbol **⚡** is the Column Blast trigger. A round draws all 20 original symbols using `crypto.randomInt` on the WAE server.
- Count **distinct columns** with at least one ⚡; multiple triggers in one column count only once.
- If ≥3 columns contain ⚡, every cell in each triggering column becomes ⚡. Other columns remain unchanged. The raw grid and transformed grid are both saved for audit/replay. The source grid is never modified in-place.
- After transformation, each of four horizontal rows pays **once** if its first three or more adjacent symbols from column 1 are identical. Scatter is **not** part of A1-04; combination with Scatter Rush is reserved for A1-05.
- Row multiplier = symbol base × 2^(adjacent_count−3). Bases: 🍒 2×, 🍋 3×, 🔔 4×, ⭐ 5×, 7️⃣ 8×, ⚡ 6×. Payout = bet × multiplier.
- If activated, a separate **transparent feature reward** applies even if the triggering columns are non-adjacent: bet × (2 + 2 × (triggeringColumnCount−3)). Minimum: 2× for three columns; 4× for four; 6× for five. This reward is **separate from** line payouts; line payouts are not counted twice.
- Stake is charged once on SPIN. Both payout components are credited in the same SQLite transaction through the existing double-entry ledger. The response stores `line_payout`, `blast_payout`, `payout`, `net`, and a list of one result per qualifying row.
- All payouts are illustrative, and **not yet economically calibrated**. Simulation/balance review required before public release.

## API / WA commands
- Create: `POST /api/v1/sessions` body `{"game_code":"A1-04","bet":10}`.
- Spin: `POST /api/v1/sessions/{id}/actions` body `{"command_id":"unique-uuid","expected_version":1,"action":"SPIN","bet":10}`.
- WhatsApp private DM: `.wae blast 10` followed by `.wae spin blast`.
- React stage: `/web/src/components/GameStages.jsx` (`ColumnBlastStage`); the animation never decides the outcome.

## State and backward compatibility
- Existing `game_sessions.state_json` stores the new `last` payload. No DB migration; old sessions and game A1-01 / A1-02 / A1-03 / B1 / B2 remain readable.
- Connector commands are supported by WAE's `integrations/wa-world/adapter.mjs`. **The WA-WORLD bot source is not changed by patch 007.** To expose these commands in the bot, the existing WA connector must actually be installed/enabled.
- Do not replace `.env`, `data/`, database, original WA-WORLD files or local README edits.

## Acceptance checks
1. 2+ ⚡ in one column does not activate.
2. 3 ⚡ in 3 columns causes exactly those columns to transform, all 4 rows.
3. Nonadjacent triggers still grant the documented feature reward; row payouts are calculated separately.
4. Same command ID yields identical response without debiting twice.
5. Stale version and invalid action are rejected atomically.
6. Reopen Web or WhatsApp view gets the same persisted grid, net and balance.
7. React reduced-motion mode does not alter game outcome.

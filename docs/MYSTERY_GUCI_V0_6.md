# A1-03 Mystery Guci — v0.6.0

## Game logic
- Grid server-authoritative: 5 columns × 3 rows, random symbols via `node:crypto.randomInt`.
- Eligible horizontal wins: 3+ identical non-guci symbols from the left, multiplier per symbol. Only one payout per eligible row.
- Three independent gauges **per game session** (not across unrelated sessions):
  - Activity: 1 point per paid spin; at 8 unlock a choice.
  - Symbols: number of 🏺 on the resulting grid; at 6 unlock a choice.
  - Victory: 1 point for a spin containing any winning line; at 3 unlock a choice.
- Counters cycle modulo threshold, allowing progress without runaway credit issuance. Gauges do not depend on a player's accumulated wallet balance. All winning rules are examples for the virtual-only arcade.
- When one or more gauges unlock, game enters `POT_CHOICE`. **SPIN is prohibited** until all bonus choices have been processed. Pending choices survive process restart and WA↔Web handoff.

## Cryptographic pre-commit
- For each unlocked bonus, server shuffles the *illustrative reward set* [2×,3×,5×] using CSPRNG and stores the hidden ordering + 128-bit nonce in persisted session state.
- Server computes SHA-256 of JSON `{source,bet,options,nonce}` and exposes only the commitment hash and source. Pending options/nonce are *never* returned to browser or WhatsApp adapter.
- Player chooses pot 1, 2, or 3 via `OPEN_POT` (`choice:0|1|2`). Server credits `ticket.bet × multiplier` to ACR Wallet from WAE treasury atomically. No additional ACR stake is charged for opening a bonus.
- Server reveals the full ordering, nonce, and hash after selection so result can be independently checked. This mechanism provides after-the-fact verification of commitment; it is not proof of any published probability distribution.
- When a ticket is revealed, another queued ticket (if any) remains sealed. Full source of sealed bonuses must stay on the server.

## Transactional and security guarantees
- All action changes run in a SQLite immediate transaction through existing `act` handler. `command_id` repeats return the saved result; stale `expected_version` rejects duplicates and races.
- `.env`, database files in `data/`, and WA-WORLD original VCUR are untouched by this feature. No transfer/conversion from ACR to VCUR.
- Backend uses treasury transfers. Insufficient treasury balance aborts the whole action, including counter changes and stake deduction.
- Risk: sample rule economics (expected issuance of ACR) are **not** balanced for broad/public release. This is a friends-test, non-redeemable virtual-credit game. Run balance simulations and rate limits before publishing.

## API examples
`POST /api/v1/sessions` JSON: `{ "game_code":"A1-03", "bet":10 }`

`POST /api/v1/sessions/:id/actions` JSON (paid spin):
`{ "command_id":"random-uuid", "expected_version":1, "action":"SPIN", "bet":10 }`

`POST /api/v1/sessions/:id/actions` JSON (open choice):
`{ "command_id":"random-uuid", "expected_version":2, "action":"OPEN_POT", "choice":1 }`

A1-03 `session.pot_pending` gives the number of sealed rewards still waiting. The client must use `session.phase==='POT_CHOICE'` to show the choice panel. The UI may not generate/modify outcomes itself.

## Tests
`npm test` and `node scripts/check-web.mjs`; `INSTALL.bat` builds React/Vite from npm once dependencies are available. Code and backend tests were run; visual click/browser QA should be performed locally.

## WhatsApp connector commands

- `.wae guci 10` creates A1-03 session.
- `.wae spin guci` runs the next paid spin if no sealed choices are pending.
- `.wae open 1` or `2` or `3` reveals one sealed bonus.
- `.wae scatter 10` + `.wae spin scatter` continue the existing A1-02 game.

The connector processes only DM commands and never directly adjusts WA-WORLD VCUR. Game response previews expose no sealed reward list.

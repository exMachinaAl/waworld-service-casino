# WAE 0.14 — Game Categories, Number Draw & Treasury Safety

## Game menus
- **Slot A1**: A1-01 through A1-05; no gameplay changes.
- **Arcade**: European Roulette B1, Blackjack Solo B2.
- **Multiplayer Arcade**: Dice Duel and Blackjack tables (existing separate lobby).
- **Number Draw**: L1 free-to-play 4–12 digit number guessing.

## Number Draw mechanics (temporary testing rules, version 1)
- Entirely free, non-redeemable ACR rewards only. No paid ticket or real-world prize.
- Guess a string of 4 through 12 ASCII digits; leading zeros are preserved.
- Draw comes from cryptographic `randomInt(10)`, independent per position.
- Count exact consecutive matching digits **from the leftmost position only**, not any four positions.
- Fewer than 4 consecutive matches: 0 ACR. Four: 10 ACR. Each additional consecutive digit: previous base multiplied by `1.5`; full reward is `round(10 * (1.5 ** (matched - 4)))`, max 500 ACR. Rounding is applied to the final value.
- Three free entries per player per UTC day, 200 total entries per UTC day per WA-WORLD tenant. New entries are rejected once quota is exhausted, **before drawing the result**. No outcomes are rerolled to protect treasury.
- Before accepting each play, at least 500 ACR must exist in the source treasury. Results and payouts are committed to game session and double-entry ledger in one SQLite transaction.
- Idempotency key and optimistic state version prevent double payout. Browser refresh/WhatsApp retries do not create additional results.
- Expected event P(4 matching prefix)=0.0001 (1/10000). The longer the prefix, the rarer the reward. This free demo is NOT a prize-money lottery.

## Economy ledger
- Existing WAE starter credit and admin test pool are preserved: this upgrade does **not** reset balances or change their initial amounts.
- Player losses in existing paid-ACR arcade games transfer to the **internal treasury** under existing ledger rules. Payouts from the same treasury transfer ACR back to players. Redistribution does not mint new credits.
- Read-only admin endpoint `/api/v1/admin/economy` displays total account balances, players, treasury, and daily Number Draw rewards. It is only available in the existing loopback admin demo mode.
- ACR inflation should be measured using newly issued supply, burn events, aggregate balances, faucet flows, outstanding liabilities, and game-level net flows. This version does **not** yet add a mint/burn policy or AI engine.
- An AI economy advisor, if implemented later, should consume aggregate snapshots only and create **proposals**, never directly change an active game's RNG, promised prize, wallet ledger, or limit.

## Conversion ACR ↔ VCUR
- **DISABLED**. ACR-to-VCUR and VCUR-to-ACR are NOT implemented and must not be added without explicit regulatory review, transfer treasury constraints, daily caps, idempotency, auditing, and verification that no coin can be monetized.
- The current WA-WORLD source remains untouched. No external casinos or real-money exchanges are connected.

## Production gate
Pre-production: browser build and device integration still require real testing; independent security audit, rate/load tests, migrations to a production storage platform, authoritative account linking, backup/restore and legal review remain unresolved.

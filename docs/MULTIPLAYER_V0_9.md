# WORLD Arcade v0.9: Multiplayer Contract

## Scope
Two-player Dice Duel (T0) and room lifecycle. No multiplayer Blackjack or Roulette yet. All ACR and game state remain server-side.

## Flow
1. `POST /api/v1/rooms` with `bet` 5,10,20,50 and idempotent `command_id`.
2. `GET /api/v1/rooms` returns open rooms and the user's rooms.
3. `GET /api/v1/rooms/preview/{code}` returns a public sanitized room preview to authenticated players.
4. `POST /api/v1/rooms/join` requires room code, `expected_version`, and command id.
5. `POST /api/v1/rooms/{id}/actions` with READY by each user, then START by host. CANCEL is host-only; LEAVE is guest-only.
6. `GET /api/v1/rooms/{id}/events` streams authorized updates. Web UI receives server version updates; WA adapter can poll status.

## Security properties
- Authenticated player identity from HTTP cookie or authenticated internal service sender, not body-supplied player ID.
- Room preview never reveals real player IDs, credentials, or wallet data; room details require membership.
- Invites expire after 2h; max 2 users; host can have at most 3 active rooms.
- SHA/ID dedup via multiplayer_commands; atomic SQLite transactions; server RNG via crypto.randomInt.
- Stake deducted for both only at START in same transaction as dice result and winner payout. No partial debit, no double settlement.
- ACR ledger is zero-sum between players + treasury for a completed match. VCUR bridge remains disabled.
- All READY and START mutations use optimistic version checks; stale actions return 409.

## Outstanding before public production
Load/concurrency tests on multiple hosts, PostgreSQL migration, persistent websocket/distributed real-time, WA DM integration tests, fraud/moderation audit, accessibility and screen reader tests, recovery/backup drills, monitoring/alerts and deployment TLS review.

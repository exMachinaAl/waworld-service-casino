# WORLD Arcade Engine: New Goals 2026 (post v0.13)

## Core intent
WAE is a standalone game platform, with deep WA-WORLD integration and a separate, non-redeemable ACR credit ledger. The original WA-WORLD VCUR cannot be changed by games or an AI model. ACR is not purchased, withdrawn, sold, traded for cash, or exchanged for goods.

## Game navigation
1. SLOT: Classic Match, Scatter Rush, Mystery Guci, Column Blast, Ultimate Fusion; preserve existing mechanics and animation.
2. ARCADE: European Roulette, Blackjack Solo, future strategy/skill games.
3. MULTIPLAYER ARCADE: Dice Duel + Blackjack Tables, future Roulette rooms and tournaments.
4. NUMBER DRAW: 4–12 digits in test release; prefix matches, 1.5x for additional correct digits, daily free entry quota, cryptographic RNG, no real-world prizes.

## Future Economy Treasury
- Produce audited projections of available pool, outstanding liability, payouts, player balances, existing faucet inflows and any explicit new issuance.
- Split funds conceptually into operating treasury, game pools, reserve/insurance and testing pool; no individual stake pool should be silently changed.
- Bankroll planning (example only): 1,000,000 ACR newly issued on approved genesis could be allocated to 500,000 protected reserves, 300,000 game budget, 150,000 rewards and 50,000 operator buffer. This DOES NOT overwrite v0.13-era initial supply, existing treasury or ledgers.
- Collect player-used ACR through atomic transfers into internal treasury, and allocate between game pools only through logged policy decisions. Moving existing funds is redistribution, not minting. The module must not ever forward losses to external real-money casino operators.
- Alert thresholds should be based on exposure to possible payouts and available resources. Disable NEW rounds at capacity, rather than reducing a promised payout after game acceptance.
- Introduce explicit mint/burn policy, with audit trails, dual authorization for total supply changes, and published change notices for rules of NEW sessions only.

## AI Economy Advisor
- Inputs: anonymized / aggregate wallet metrics, game payout distribution, daily spend, total issuance, reserves and current quotas.
- Outputs: written recommendations and a simulated effect on inflation, player experience and reward obligations.
- Never has signing authority to alter a player's wallet, RNG, active game rules, or settled prize.
- Requires a deterministic policy validator, human approval, versioned configurations, and an appeals/audit record before applying decisions for future games.

## ACR/VCUR bridge future gate
- Currently disabled. Before any reciprocal conversion: legal/regulatory clearance, no cash or real-value redemption, explicit two-ledger conservation and funding rules, per-user/global limits, anti-arbitrage, cross-service idempotency, configurable rate publication, and strict tenant isolation.
- If approved, use allocation from pre-existing WA-WORLD VCUR treasury, not automatic VCUR minting. Run dry-run shadow reconciliation before enabling any movement.

## Production acceptance gate
- React build + UI automation passes on desktop/mobile, real Web/WhatsApp dual-session tested, concurrency/load tests, restore from actual backup, durable migrations, controlled external hosting with HTTPS, admin 2FA/role review, security and local legal review, monitoring and incident response drills, no exposure of local demo admin.
- Current grade: BETA/PRE-PRODUCTION, not public production.

## Suggested releases
- v0.14: Menus + free number draw + read-only economy monitor.
- v0.15: Real treasury allocation pools, ledgers, obligations, alerting, simulations (no AI auto execution).
- v0.16: AI Economy Advisor read-only proposals and model-independent policy validator.
- v0.17: Web–WA integration & multiplayer hardening / analytics.
- v0.18: Production hardening, security audit and legal compliance review.
- Conversion module remains a gated design; no planned active release until all gates pass.

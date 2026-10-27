# WORLD Arcade Engine v0.8.0 — Production Readiness Report

Date: 2026-10-26 · Assessment: **Functional Beta / Pre-production** · Recommendation: closed, local testing ONLY.

## Evidence from source inspection

- ✅ Standalone Node engine, persistent local SQLite storage, game session versioning, ACR ledger, REST endpoints, Web SSE, optional WA connector, admin TEST grants.
- ✅ New renderer lands on server symbols using the actual pixel height of each row. No browser RNG or wallet adjustment.
- ✅ Automated engine + reel math tests executed in this build environment.
- ⚠️ React production build and rendered animation E2E not established unless `npm run build:web` completes on user machine.
- ⚠️ React/Web and WhatsApp real-session dual control not field tested for the user's bot/account/device.
- ⚠️ SQLite database uses Node's `--experimental-sqlite`; PostgreSQL and durable queuing not yet implemented.
- ⚠️ Rate limiting is in-process; multi-instance coordination, centralized audit/metrics and DoS review incomplete.
- ⚠️ Admin ACR grants intentionally require localhost + demo; cannot be used as secure public admin features without a new production permission design.
- ⚠️ No independent security assessment, disaster recovery restore drill, 48h soak test, or concurrent-player load test on intended infrastructure.
- ⚠️ Unofficial Baileys/WhatsApp integration may break with provider changes or be subject to platform restrictions.

## Go / No-Go

**LOCAL BETA / FRIENDS TEST**: Go only on localhost or isolated staging with fake/test accounts, closed non-redeemable ACR, backups, and no real-value rewards.

**PUBLIC PRODUCTION**: No-Go until items below pass and are evidenced.

## Required validation before production

- [ ] Real Vite build from pinned dependency lockfile and supported Node LTS, no critical dependency audit findings
- [ ] Browser Playwright/Cypress tests: desktop, Android/iOS, slow 3G, resize, refresh while spinning, reduced motion, all A1 variants
- [ ] Pixel stop validation in browser (within 0.5 CSS pixel), reel final grid == signed/authenticated session state, no double spin
- [ ] Run SSE reconnect and concurrent WA/Web action conflict tests with real bot connections
- [ ] Wallet integration and stress test: retries, transaction rollback, duplicate commands, crash after settlement
- [ ] Production authentication, hardened CSRF/origin checks, trusted proxy/TLS configuration, rate limits, signed webhooks
- [ ] Separate production database/queue/storage with backup restore rehearsal and monitoring alerts
- [ ] Gameplay math probability audit, economy budgets, user opt-out and abuse protection
- [ ] Operational logs, uptime/latency dashboards, incident and rollback procedure, deployment controls
- [ ] Compliance review for games, platform rules and local law (virtual credits do not automatically guarantee compliance)

## v0.8.0 exclusions

No A1-05 Fusion, no change in slot payouts, no conversion ACR↔VCUR, no public admin mint endpoint. This release is limited to frontend renderer precision, QA guidance and safe source compatibility.

# 1.0.0-rc.1

- Lottery Exclusive bersama menggantikan Number Draw instan, seed commitment/reveal, prefix rational 3/2, rules immutable, harga ACR, kuota, budget reserve, cancel/refund terkontrol, early close+publish audited, scheduler recovery, histori legacy.
- Central stake policy 1–3.000 default, ceiling 10.000, game scope, preset server, custom integer input. Preserve active policy and bet. Rejection sebelum RNG ketika treasury tidak cukup.
- Blackjack multiplayer 1–4 pemain, host transfer/cancel, guest leave, active forfeit, timeout/restart, natural odd-stake rounding. Dealer natural tidak disamakan dengan 21 non-natural.
- Roulette European multi-item slip, semua payout dijumlah, shared round/multiuser, reserve, auto-next tanpa auto-charge, animasi roda/bola existing dipakai kembali.
- Admin policy/round/calendar/audit/export, treasury deficit dan explicit faucet allocation, terpisah dari test grants. SSE notifications dan WA text commands.
- Additive SQLite migration, active legacy reserves, backup + checksum patch CHECK/DRYRUN/APPLY/ROLLBACK, optional WA-WORLD connector patch, privacy-safe full source.

Breaking changes disengaja: L1 instant create/action dan number-draw/policy -> 410 dengan pengganti /lottery; natural payout menggunakan floor(5×bet/2); custom stakes menggantikan whitelist lama. Empat tes baseline diperbarui hanya untuk kontrak ini: versi HTTP, 1 ACR valid, START setelah selesai error spesifik, serta L1 tidak lagi gratis instan. Tes matematis dan histori Number Draw lama tetap dipertahankan.

Distribusi ini RC untuk pengujian lokal/private, belum production-ready. Baca READINESS.md untuk bukti dan blocker.

# API RC.1

Browser: cookie HttpOnly SameSite=Strict; mutasi POST wajib Origin sama dengan WAE_PUBLIC_ORIGIN atau origin server. Endpoint admin membutuhkan login admin terpisah, IP/hostname loopback, tanpa proxy. Service WA: X-WAE-Service-Key, subject dari pengirim tervalidasi, bukan teks pesan. Service credential tidak memiliki hak admin. Max body 20KB; rate limit baseline tetap berlaku.

Semua command RC mutasi memerlukan `command_id` 12–100 karakter `[A-Za-z0-9:_-]`. Retry memakai ID dan payload yang sama. Isi berbeda pada ID sama -> COMMAND_PAYLOAD_MISMATCH. `expected_version` untuk transisi admin; stale -> ROUND_STATE_STALE. Tiket/slip menggunakan transaksi dan kuota otoritatif, tidak mengandalkan versi browser untuk penerimaan serentak. API mengembalikan saldo server; client tidak menghitung perkiraan saldo sesudah timeout.

| Method | Endpoint browser | Isi / hasil |
|---|---|---|
| GET | /api/v1/policies?game_code=B1 | policy efektif, preset, min/max, versi |
| GET | /api/v1/lottery | enabled, rounds, legacy milik pemain |
| GET | /api/v1/lottery/:id | round, rules, tiket sendiri, hasil, seed bila published |
| POST | /api/v1/lottery/:id/tickets | `{guess:"000012",command_id}` |
| POST | /api/v1/lottery/:id/cancel-ticket | `{ticket_id,command_id}` |
| GET | /api/v1/roulette-rounds | daftar round dan slip milik pemain |
| GET | /api/v1/roulette-rounds/:id | round version/state/result/slip |
| POST | /api/v1/roulette-rounds/:id/slips | `{bets:[{choice:"7",stake:100},{choice:"red",stake:200}],command_id}` |
| GET | /api/v1/commands/:command_id | `{found,response}` khusus command RC milik actor |
| GET | /api/v1/notifications?after=0 | outbox milik pemain, max100, cursor id |
| GET | /api/v1/notifications/events | SSE event notification; Last-Event-ID reconnect |
| POST | /api/v1/admin/login | `{username,password}` |
| GET/POST | /api/v1/admin/policies | list atau `{game_code,min,max,maxDigits,command_id}` |
| GET | /api/v1/admin/treasury | balance/reserved/available/deficit/faucet_available |
| POST | /api/v1/admin/treasury/fund | `{amount,reason,command_id}` alokasi faucet; ledger balanced |
| GET/POST | /api/v1/admin/lottery | list atau create DRAFT |
| GET | /api/v1/admin/lottery/:id/export | view hasil/aturan/audit JSON, seed hanya setelah publish |
| POST | /api/v1/admin/lottery/:id/actions | `{action:"OPEN|CLOSE|PUBLISH|CANCEL",expected_version,command_id}` |
| GET/POST | /api/v1/admin/roulette-rounds | list atau create OPEN_BETS |
| GET | /api/v1/admin/roulette-rounds/:id/export | view hasil/audit JSON |
| POST | /api/v1/admin/roulette-rounds/:id/actions | `{action:"LOCK|SPIN|SETTLE|CANCEL",expected_version,command_id}` |

Create Lottery: `title`, `digits` (4–12 default max configurable ≤32), `price`, `base_prize`, `max_prize`, `budget`, `per_player` ≤100, `capacity` ≤10000, `opens_ms`, `closes_ms`, `publishes_ms` Unix epoch milliseconds, `early_release`, `cancel_tickets`, `command_id`. Tenant selain wa-world ditolak. Waktu buka<tutup≤publish. OPEN eksplisit menjamin budget. Perubahan aturan setelah DRAFT tidak tersedia; cancel lalu buat round baru sebelum menjual tiket bila perlu koreksi.

Create Roulette: `closes_ms`, `budget`, `interval_ms` 10s–24h, `auto_next`, `command_id`. Max 1000 slip/round, 64 item/slip, satu slip final/player/round. Pilihan sah string angka 0–36 atau red/black/odd/even/low/high. Return incl stake. Split/street/dozen/column belum diimplementasikan dan ditolak.

Jalur WA memakai `/internal/v1` menggantikan `/api/v1`, subject di query GET/body POST. Semua endpoint player RC tersedia; admin tidak. `/internal/v1/notifications` adalah pull yang terotorisasi; caller menyimpan cursor setelah delivery sukses.

Blackjack existing endpoint dipertahankan: GET/POST /api/v1/blackjack-tables; POST /join; GET /:id; POST /:id/actions; GET /:id/events. Create `{bet,command_id}`; actions `{action,expected_version,command_id}`. Active LEAVE tambah `confirm_forfeit:true`. READY, START, HIT, STAND, TIMEOUT, CANCEL. NOT_READY, TABLE_EXPIRED, ALREADY_STARTED, CANNOT_CANCEL_ACTIVE dan CONFIRM_FORFEIT_REQUIRED membedakan alasan penolakan.

Existing /sessions dan /rooms tetap berlaku. B1 solo mendukung `bets` pada SPIN selain `choice` legacy. L1 create/action dan /number-draw/policy menjadi 410 LOTTERY_USE_ROUNDS_API; GET sesi lama dan histori dipertahankan, tidak dibayar ulang.

Verifikasi hasil:

```sh
node scripts/verify-lottery.mjs ROUND_ID REVEALED_SEED DIGITS COMMITMENT RESULT
```

Audit seluruh transisi dapat diekspor admin; secret seed tidak pernah muncul sebelum publication pada API/WA/browser. Snapshot policy per round dan unique settlement/command constraints mencegah pembayaran ulang.

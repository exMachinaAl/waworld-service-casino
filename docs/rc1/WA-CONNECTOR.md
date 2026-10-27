# Konektor WA-WORLD opsional

Source WA-WORLD lampiran hanya dibaca; tidak ditimpa. Paket `integrations/wa-world/optional-patch` berisi patch checksum untuk handler WA-WORLD 3.4.0 yang dilampirkan, plus adapter tanpa akses database WA/VCUR. Jalankan CHECK/DRYRUN/APPLY/ROLLBACK dengan argumen folder WA-WORLD dan bot harus berhenti. Jika handler Anda berubah, patch menolak; merge manual dari payload, tanpa force.

Tambahkan pada .env WA-WORLD secara manual:

```ini
WAE_ENABLED=1
WAE_API_URL=http://127.0.0.1:8787
WAE_PUBLIC_URL=http://127.0.0.1:8787
WAE_SERVICE_TOKEN=<token dari .env WAE, jangan kirim ke browser>
```

Handler mempertahankan allowlist, menolak fromMe/status/broadcast, memakai sender dari message key, mengubah message eventKey menjadi digest idempotency. Game hanya DM; grup mendapat penjelasan privat tanpa mutasi. WAE_ENABLED default OFF ketika tidak disetel. Konektor tidak menyentuh VCUR; token service tidak bisa mengakses admin.

- `.wae policy [GAME]` batas ACR terbaru.
- `.wae lottery list`, `.wae lottery status ROUND_ID`.
- `.wae lottery buy ROUND_ID 000012` menampilkan aturan; tambahkan `confirm` untuk pembelian final.
- `.wae rtable list`, `.wae rtable status ROUND_ID`.
- `.wae rtable slip ROUND_ID 7:100,12:50,22:100,red:200,even:100` menampilkan ringkasan; tambahkan `confirm` untuk submit.
- `.wae notifications [CURSOR]` hasil terotorisasi dari outbox; gunakan ID event terakhir untuk tidak mengulang daftar.
- `.wae bjroom create 1`, `ready KODE`, `start KODE`: satu pemain boleh start.
- `.wae bjroom leave KODE confirm` untuk forfeit aktif tanpa refund; cancel hanya prastart.
- Semua perintah slot/guci/fusion/spin, handoff/web/link dan rooms lama dipertahankan. Preset teks diganti ACR custom; server tetap otoritatif.

Tidak ada broadcast WA otomatis. Pull hasil tersedia dan adapter siap dipanggil bot; pengiriman push terjadwal memerlukan opt-in, delivery ACK dan pengujian dua akun WA nyata. Dua identitas WA disimulasikan melalui HTTP/adapter pada suite; sesi Baileys nyata belum dijalankan.

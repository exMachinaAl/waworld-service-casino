# WORLD Arcade Engine — 1.0.0-rc.3

Implementasi Node.js + SQLite + React/Vite, ACR virtual tertutup. Windows: INSTALL.bat lalu START.bat. Source ini tidak membawa database atau secret pengguna; instalasi lama harus memakai patch aman.

- [Mulai di sini: upgrade ZIP → ChatGPT → agent di folder](docs/UPGRADE-WORKFLOW.md) — kebutuhan, tahapan, prompt, validasi dan serah-terima.
- [Pemasangan patch RC2 → RC3](docs/rc3/UPGRADE_RC3.md)
- [Runbook historis RC1: instalasi, upgrade, rollback dan pemulihan](docs/rc1/RUNBOOK.md)
- [Kesiapan rilis dan batas pengujian](docs/rc1/READINESS.md)
- [Perubahan versi](docs/rc1/CHANGELOG.md)
- [Kontrak API](docs/rc1/API.md)
- [Database/ERD/migrasi](docs/rc1/DATABASE.md)
- [Baseline, aturan, dan temuan cadangan DB](docs/rc1/BASELINE-AND-DECISIONS.md)
- [Patch konektor WA-WORLD opsional](docs/rc1/WA-CONNECTOR.md)
- [Matriks pengujian](docs/rc1/TEST-MATRIX.md)
- [Pemeriksaan keamanan](docs/rc1/SECURITY.md)
- [Roadmap WAW, desain simulasi aman, dan panduan dompet VAL (Virtual AL)](docs/waw/README.md) — rancangan pengembangan, belum fitur aktif.

Lottery default OFF. Admin lokal: WAE_ADMIN_ENABLED=1 + ADMIN-SETUP.bat. Grant test tetap OFF. Tidak ada konversi ACR–VCUR, deposit/cash-out, perdagangan kredit, atau hadiah bernilai nyata.

Database lampiran memiliki kewajiban bonus lama melebihi treasury pada estimasi maksimum konservatif. Migrasi mempertahankan saldo dan sesi; periksa panel cadangan dan runbook sebelum menerima taruhan baru. Tidak ada alokasi saldo otomatis oleh upgrader.

Semua dokumentasi v0.x lainnya adalah arsip historis. Manifest RC1 bukan bukti checksum RC3 atau snapshot baru; paket full source dan patch harus diverifikasi terhadap baseline dan manifest rilis masing-masing.

export class ApiError extends Error {
  constructor(code, status) {
    super(code === 'STATE_STALE' ? 'Sesi berubah di perangkat lain. Tampilan diperbarui.' : prettyError(code));
    this.name = 'ApiError'; this.code = code; this.status = status;
  }
}

const messages = {
  LOGIN_REQUIRED:'Silakan hubungkan akun WhatsApp atau gunakan demo lokal.',
  INSUFFICIENT_BALANCE:'Saldo ACR tidak mencukupi.',
  NOT_YET_APPROVED:'Persetujuan WhatsApp belum diterima.',
  HANDOFF_EXPIRED:'Tautan telah kedaluwarsa. Buat link baru dari WA-WORLD.',
  BAD_CLAIM:'Permintaan ini bukan milik browser Anda.',
  ALREADY_WA_LINKED:'Akun ini sudah tertaut dengan WhatsApp.',
  LINK_NOT_CONFIRMED:'Selesaikan konfirmasi lewat WA-WORLD terlebih dahulu.',
  WA_IDENTITY_ALREADY_LINKED:'Akun WA telah ditautkan ke profil arcade lain.',
  RATE_LIMITED:'Terlalu banyak permintaan. Coba lagi nanti.',
  ADMIN_TEST_DISABLED:'Panel admin test hanya tersedia saat pengujian lokal diaktifkan.',
  ADMIN_LOGIN_REQUIRED:'Silakan masuk menggunakan kredensial admin terlebih dahulu.',
  ADMIN_LOGIN_FAILED:'Username atau password admin salah.',
  DAILY_ADMIN_LIMIT:'Batas pemberian ACR harian telah tercapai.',
  REASON_REQUIRED:'Isi alasan minimal 8 karakter.',
  INVALID_ADMIN_AMOUNT:'Jumlah ACR harus 1 sampai 50.000.',
  INSUFFICIENT_ACR:'Saldo tidak cukup untuk dikurangi.',
  DEMO_DISABLED:'Mode demo hanya tersedia di localhost.',
  NOT_PLAYER_TURN:'Giliran Anda sudah berakhir.',
  STATE_STALE:'Sesi berubah. Menyegarkan status…',
};
export const prettyError = (code) => messages[code] ?? String(code || 'Terjadi gangguan. Coba ulangi.').replaceAll('_', ' ');

export async function api(method, route, body) {
  const res = await fetch(route, {
    method,
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body),
    cache:'no-store',
  });
  let value = {};
  try {value = await res.json();} catch {throw new ApiError('INVALID_SERVER_RESPONSE',res.status);}
  if (!res.ok) throw new ApiError(value.error ?? 'REQUEST_FAILED',res.status);
  return value;
}

export const money = (value) => new Intl.NumberFormat('id-ID', {maximumFractionDigits:0}).format(Number(value ?? 0));
export const clock = (value) => new Date(Number(value ?? 0)).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'});
export const shortId = (id) => id ? String(id).slice(0,8).toUpperCase() : '—';

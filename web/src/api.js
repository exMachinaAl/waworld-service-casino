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
  RATE_LIMITED:'Terlalu banyak permintaan. Auto Spin dijeda; saldo akan disinkronkan.',
  REQUEST_TIMEOUT:'Permintaan terlalu lama. Memeriksa saldo dan status terbaru; jangan langsung mengulang.',
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
  ROOM_STATE_STALE:'Room berubah; segarkan lobby dan coba lagi.',
  ROOM_NOT_FOUND:'Room tidak ditemukan.',
  ROOM_FULL:'Room sudah penuh.',
  ROOM_EXPIRED:'Room sudah kedaluwarsa.',
  ROOM_ACCESS_DENIED:'Anda bukan peserta room.',
  PLAYERS_NOT_READY:'Kedua pemain harus menekan Siap.',
  HOST_ONLY:'Hanya pembuat room yang boleh memulai.',
  ROOM_LIMIT:'Anda sudah memiliki tiga room aktif.',
  INVALID_SCHEDULE:'Jadwal tidak valid. Pastikan waktu buka < waktu tutup < waktu pengumuman.',
  BET_TOO_LOW:'Nominal ACR kurang dari batas minimum. Periksa kebijakan taruhan pada halaman Admin.',
  BET_TOO_HIGH:'Nominal ACR melebihi batas maksimum permainan.',
  LOTTERY_DISABLED:'Lottery sedang dinonaktifkan oleh pengelola.',
  TREASURY_RESERVE_INSUFFICIENT:'Cadangan treasury tidak mencukupi untuk menjamin hadiah ronde ini.',
  LOTTERY_ROUND_NOT_OPEN:'Ronde belum dibuka atau waktu pembelian tiket sudah ditutup.',
  LOTTERY_CAPACITY_REACHED:'Kuota tiket ronde sudah penuh.',
  INVALID_TICKET:'Nomor tiket harus sesuai jumlah digit ronde dan hanya berisi angka.',
  INVALID_STAKE:'Nominal harus bilangan bulat sesuai batas permainan.',
  INVALID_SERVER_RESPONSE:'Server mengirim respons tidak valid. Periksa log dan jangan mengulangi taruhan sampai status diperiksa.',
  POT_CHOICE_REQUIRED:'Buka guci bonus sebelum memutar lagi.',
  NO_POT_BONUS:'Belum ada guci bonus yang dapat dibuka.',
  INVALID_POT_CHOICE:'Pilihan guci tidak valid.',
};
export const prettyError = (code) => messages[code] ?? String(code || 'Terjadi gangguan. Coba ulangi.').replaceAll('_', ' ');

export async function api(method, route, body) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  let res;
  try {res=await fetch(route, {
    method,
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body),
    cache:'no-store',
    signal:controller.signal,
  });}catch(e){if(e?.name==='AbortError')throw new ApiError('REQUEST_TIMEOUT',0);throw e;}finally{clearTimeout(timer);}
  let value = {};
  try {value = await res.json();} catch {throw new ApiError('INVALID_SERVER_RESPONSE',res.status);}
  if (!res.ok) throw new ApiError(value.error ?? 'REQUEST_FAILED',res.status);
  return value;
}

export const money = (value) => new Intl.NumberFormat('id-ID', {maximumFractionDigits:0}).format(Number(value ?? 0));
export const clock = (value) => new Date(Number(value ?? 0)).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'});
export const shortId = (id) => id ? String(id).slice(0,8).toUpperCase() : '—';

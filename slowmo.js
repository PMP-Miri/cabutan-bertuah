/* slowmo.js — Lengkung masa GERAK PERLAHAN untuk larian (fungsi tulen, tiada import).
 *
 *   s = pecahan masa SEBENAR larian (0..1)
 *   u = pecahan KEMAJUAN koreografi (0..1)
 *
 * Laju v(s) = 1 hingga SLOW.MULA, kemudian turun lancar ke SLOW.LAJU.
 * u(s) = ∫v / ∫v, dinormalkan supaya u(1) = 1 — pemenang tetap melepasi
 * garisan penamat TEPAT pada saat `dedah` (mula + tempoh larian). Peraturan,
 * masa pendedahan dan kod tuntutan langsung tidak berubah; ini hanya cara
 * animasi diedarkan dalam tempoh itu.
 *
 * Hasil dengan nilai lalai: 60% masa pertama membawa ~85% kemajuan,
 * 40% masa terakhir hanya ~15% kemajuan → kira-kira 5× lebih perlahan.
 * Sama di projektor dan telefon kerana dikira daripada masa sahaja.
 */
export const SLOW = { MULA: 0.52, LEBAR: 0.1, LAJU: 0.2 };

const klip = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lancar = (x) => { x = klip(x); return x * x * (3 - 2 * x); };

/** Laju relatif pada masa s. */
function laju(s) { return 1 - (1 - SLOW.LAJU) * lancar((s - SLOW.MULA) / SLOW.LEBAR); }

const N = 400;
const KUMUL = [0];
for (let i = 1; i <= N; i++) KUMUL.push(KUMUL[i - 1] + (laju((i - 1) / N) + laju(i / N)) / 2);
/** ∫₀¹ v(s) ds — dipakai untuk jam animasi kaki. */
export const JUM = KUMUL[N] / N;
for (let i = 0; i <= N; i++) KUMUL[i] /= KUMUL[N];

/** Kemajuan u bagi masa sebenar s (monoton, u(0)=0, u(1)=1). */
export function lengkung(s) {
  s = klip(s);
  const f = s * N, i = Math.min(N - 1, Math.floor(f));
  return KUMUL[i] + (KUMUL[i + 1] - KUMUL[i]) * (f - i);
}

/** Jam animasi (saat) semasa larian: berdetik perlahan dalam slow-mo
 *  supaya langkah kaki pun perlahan, bukan sekadar pelari bergerak lambat. */
export function jamAnimasi(s, tempohMs) {
  return lengkung(s) * JUM * (tempohMs / 1000);
}

/** Adakah sedang dalam slow-mo (untuk paparan: bar sinema, papan pendahulu). */
export function sedangSlowMo(s) {
  return s >= SLOW.MULA + SLOW.LEBAR * 0.35 && s < 1;
}

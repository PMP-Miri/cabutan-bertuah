/* muzik.js — Muzik latar RANCAK & CERIA, dijana terus dalam pelayar (Web Audio).
 *
 * Kenapa dijana, bukan fail MP3?
 *   - tiada fail besar untuk dihos di GitHub Pages
 *   - tiada isu hak cipta / lesen untuk acara rasmi
 *   - boleh berubah ikut keadaan tanpa potongan audio yang janggal
 *
 * Gaya v2 (lagu pop/dance yang gembira, BUKAN misteri):
 *   - kord diatonik MAJOR yang biasa didengar dalam lagu ceria (I–V–vi–IV dsb.)
 *   - melodi tetap yang berulang (senang melekat), dibina daripada nada kord
 *     jadi tidak pernah sumbang
 *   - bas melantun, kord "stab" pada luar rentak, tepuk tangan pada 2 & 4
 *   - semasa menunggu pun lagu tetap berjalan penuh (cuma lebih perlahan sedikit)
 *
 * API:  Muzik.mula(tema) · Muzik.suasana('lobi'|'kira'|'lari'|'menang')
 *       Muzik.berhenti() · Muzik.hidup(true/false) · Muzik.aktif · Muzik.tukarTema(tema)
 */

// k = kunci (nota MIDI tonik), prog = [semiton dari tonik, minor?]
// melodi: 2 bar × 16 langkah; nombor = indeks nada kord
//   0 akar · 1 ketiga · 2 kelima · 3 akar+8ve · 4 ketiga+8ve · 5 kelima+8ve ; -1 = rehat
// bas: 'disko' (oktaf melantun) | 'koboi' (boom-chick) | 'lompat' | 'lembut'
const GAYA = {
  // 🥕 Buah & Sayur — dance-pop ceria, C major, I–V–vi–IV
  wira: {
    bpm: 128, k: 60, prog: [[0, 0], [7, 0], [9, 1], [5, 0]], bas: 'disko',
    lead: 'square', cerah: 3200, stab: 'sawtooth',
    melodi: [
      [3, -1, 3, -1, 2, -1, 3, -1, 4, -1, 3, -1, 2, -1, 1, -1],
      [4, -1, 4, 3, 2, -1, -1, 3, 5, -1, 4, -1, 3, -1, -1, -1],
    ],
  },
  // 🐴 Lumba Kuda — hoedown/country laju, G major, I–IV–V–I
  kuda: {
    bpm: 148, k: 55, prog: [[0, 0], [5, 0], [7, 0], [0, 0]], bas: 'koboi',
    lead: 'sawtooth', cerah: 2400, stab: 'square',
    melodi: [
      [3, -1, 3, 3, 4, -1, 3, 3, 2, -1, 2, 2, 1, -1, 0, -1],
      [2, 3, 4, -1, 5, -1, 4, 3, 2, -1, 3, -1, 3, -1, -1, -1],
    ],
  },
  // 🦆 Itik Berenang — melantun comel, F major, I–vi–IV–V
  itik: {
    bpm: 120, k: 65, prog: [[0, 0], [9, 1], [5, 0], [7, 0]], bas: 'lompat',
    lead: 'triangle', cerah: 4000, stab: 'triangle',
    melodi: [
      [2, -1, -1, 3, -1, -1, 4, -1, 3, -1, 2, -1, 1, -1, -1, -1],
      [3, -1, 3, -1, 4, -1, 5, -1, 4, -1, -1, 3, 2, -1, -1, -1],
    ],
  },
  // 🐦 Burung Terbang — ringan & riang, D major, I–IV–vi–V
  burung: {
    bpm: 126, k: 62, prog: [[0, 0], [5, 0], [9, 1], [7, 0]], bas: 'lembut',
    lead: 'sine', cerah: 5000, stab: 'triangle',
    melodi: [
      [5, 4, 3, -1, 4, 3, 2, -1, 3, 2, 1, -1, 2, -1, 3, -1],
      [3, -1, 4, -1, 5, -1, 5, 4, 3, -1, 2, -1, 3, -1, -1, -1],
    ],
  },
};

const nota = (m) => 440 * Math.pow(2, (m - 69) / 12);

let AC = null, keluar = null, nadiId = 0;
let gaya = GAYA.wira;
let suasana = 'lobi';
let bar = 0, barSuasana = 0, masaSeterusnya = 0;
let dihidupkan = true;
let berjalan = false;

export const Muzik = {
  get aktif() { return berjalan && dihidupkan; },

  /** Mesti dipanggil daripada klik pengguna (dasar autoplay pelayar). */
  mula(idTema, konteks) {
    gaya = GAYA[idTema] || GAYA.wira;
    if (!dihidupkan) return;
    try {
      AC = konteks || AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
    } catch (e) { return; }
    if (!keluar) {
      keluar = AC.createGain();
      keluar.gain.value = 0;
      const mampat = AC.createDynamicsCompressor();
      mampat.threshold.value = -16; mampat.ratio.value = 4;
      mampat.attack.value = 0.004; mampat.release.value = 0.2;
      keluar.connect(mampat); mampat.connect(AC.destination);
    }
    if (berjalan) return;
    berjalan = true;
    bar = 0;
    masaSeterusnya = AC.currentTime + 0.12;
    naikTurun(ARAS[suasana] ?? 0.5, 1.0);
    nadiId = setInterval(nadi, 60);
  },

  berhenti() {
    berjalan = false;
    clearInterval(nadiId);
    if (keluar && AC) naikTurun(0, 0.6);
  },

  /** Hidup/matikan muzik. */
  hidup(nilai) {
    dihidupkan = !!nilai;
    if (!dihidupkan) this.berhenti();
    return dihidupkan;
  },

  tukarTema(idTema) {
    const baru = GAYA[idTema] || GAYA.wira;
    if (baru === gaya) return;
    gaya = baru;
    bar = 0;
  },

  /** Ubah keamatan mengikut keadaan acara. */
  suasana(s) {
    if (s === suasana) return;
    suasana = s;
    barSuasana = bar;
    if (!keluar || !AC || !berjalan) return;
    naikTurun(ARAS[s] ?? 0.5, s === 'lari' ? 0.2 : 0.8);
  },
};

// kekuatan keseluruhan setiap suasana (menunggu pun tetap bertenaga)
const ARAS = { lobi: 0.5, kira: 0.6, lari: 0.72, menang: 0.7 };

function naikTurun(ke, saat) {
  if (!keluar || !AC) return;
  const t = AC.currentTime;
  keluar.gain.cancelScheduledValues(t);
  keluar.gain.setValueAtTime(Math.max(0.0001, keluar.gain.value), t);
  keluar.gain.linearRampToValueAtTime(ke, t + saat);
}

/* ───────── Alat bunyi ───────── */

/** Nada bertapis (lead / stab). */
function suara(freq, mula, panjang, kuat, jenis, cerah = 2600, sapu = true) {
  const o = AC.createOscillator();
  const g = AC.createGain();
  const f = AC.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 2;
  f.frequency.setValueAtTime(cerah, mula);
  if (sapu) f.frequency.exponentialRampToValueAtTime(Math.max(400, cerah * 0.3), mula + panjang);
  o.type = jenis;
  o.frequency.setValueAtTime(freq, mula);
  g.gain.setValueAtTime(0.0001, mula);
  g.gain.exponentialRampToValueAtTime(kuat, mula + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, mula + panjang);
  o.connect(f); f.connect(g); g.connect(keluar);
  o.start(mula); o.stop(mula + panjang + 0.02);
}

/** Bas: gelombang segi tiga + sub sinus, bunyi "pluck" yang padat. */
function bas(freq, mula, panjang, kuat) {
  [['triangle', kuat], ['sine', kuat * 0.6]].forEach(([jenis, k]) => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = jenis;
    o.frequency.setValueAtTime(freq, mula);
    g.gain.setValueAtTime(0.0001, mula);
    g.gain.exponentialRampToValueAtTime(k, mula + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, mula + panjang);
    o.connect(g); g.connect(keluar);
    o.start(mula); o.stop(mula + panjang + 0.02);
  });
}

function kik(mula, kuat = 0.9) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, mula);
  o.frequency.exponentialRampToValueAtTime(48, mula + 0.1);
  g.gain.setValueAtTime(kuat, mula);
  g.gain.exponentialRampToValueAtTime(0.0001, mula + 0.2);
  o.connect(g); g.connect(keluar);
  o.start(mula); o.stop(mula + 0.22);
}

let bufHingar = null;
function hingar() {
  if (bufHingar) return bufHingar;
  const n = Math.floor(AC.sampleRate * 0.4);
  bufHingar = AC.createBuffer(1, n, AC.sampleRate);
  const d = bufHingar.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return bufHingar;
}

function perkusi(mula, panjang, hz, kuat, jenisTapis = 'highpass', Q = 0.7) {
  const s = AC.createBufferSource();
  s.buffer = hingar();
  const f = AC.createBiquadFilter();
  f.type = jenisTapis; f.frequency.value = hz; f.Q.value = Q;
  const g = AC.createGain();
  g.gain.setValueAtTime(kuat, mula);
  g.gain.exponentialRampToValueAtTime(0.0001, mula + panjang);
  s.connect(f); f.connect(g); g.connect(keluar);
  s.start(mula); s.stop(mula + panjang + 0.02);
}

/** Tepuk tangan: 3 letusan hingar rapat. */
function tepuk(mula, kuat = 0.4) {
  [0, 0.011, 0.023].forEach((d, i) => perkusi(mula + d, i === 2 ? 0.14 : 0.03, 1500, kuat, 'bandpass', 1.2));
}

/* ───────── Penjadual (lookahead 0.25 s) ───────── */

function nadi() {
  if (!berjalan || !AC) return;
  const dt = 60 / gaya.bpm / 4; // satu langkah = 1/16
  while (masaSeterusnya < AC.currentTime + 0.25) {
    mainBar(masaSeterusnya, dt);
    masaSeterusnya += dt * 16;
    bar++;
  }
}

/** Nada kord (semiton dari tonik) untuk indeks 0..5. */
function nadaKord(akar, minor, i) {
  const t = [0, minor ? 3 : 4, 7];
  return akar + t[i % 3] + 12 * Math.floor(i / 3);
}

function mainBar(t0, dt) {
  const G = gaya;
  const lari = suasana === 'lari';
  const menang = suasana === 'menang';
  const kira = suasana === 'kira';
  const lobi = suasana === 'lobi';
  const [kSemi, minor] = G.prog[bar % G.prog.length];
  const akar = G.k + kSemi;            // akar kord (oktaf tengah)
  // Bas kekal dalam SATU oktaf (kira-kira 95-180 Hz). Kalau akar kord naik
  // melebihi separuh oktaf, turunkan satu oktaf — pergerakan bas jadi kecil
  // (voice leading) dan tidak terlalu rendah untuk speaker laptop/projektor.
  const akarBas = G.k - 12 + (kSemi > 6 ? kSemi - 12 : kSemi);
  const swing = (i) => t0 + i * dt;

  /* ── DRUM ── */
  for (let i = 0; i < 16; i += 4) kik(swing(i), lobi ? 0.6 : 0.9);       // empat-ke-lantai
  if (lari || menang) kik(swing(14), 0.45);
  [4, 12].forEach((i) => tepuk(swing(i), lobi ? 0.3 : 0.42));           // tepuk pada 2 & 4
  [2, 6, 10, 14].forEach((i) => perkusi(swing(i), 0.09, 6500, lobi ? 0.1 : 0.14)); // hi-hat terbuka luar rentak
  if (!lobi) for (let i = 1; i < 16; i += 2) perkusi(swing(i), 0.025, 9000, 0.06); // shaker
  if (bar % 4 === 0 && !lobi) perkusi(t0, 0.9, 5000, 0.12);              // simbal setiap 4 bar
  if (kira) {
    // snare naik (build-up) — makin rapat & kuat
    const n = bar - barSuasana;
    const langkah = n < 1 ? 2 : 1;
    for (let i = 0; i < 16; i += langkah) perkusi(swing(i), 0.06, 1800, 0.08 + (i / 16) * 0.16, 'bandpass', 0.8);
  }

  /* ── BAS ── */
  const b = (semi, i, panj, k = 0.42) => bas(nota(akarBas + semi), swing(i), dt * panj, k);
  if (G.bas === 'disko') {
    for (let i = 0; i < 16; i += 2) b(i % 4 ? 12 : 0, i, 1.6);
  } else if (G.bas === 'koboi') {
    [0, 8].forEach((i) => b(0, i, 3));
    [4, 12].forEach((i) => b(7, i, 3));
  } else if (G.bas === 'lompat') {
    b(0, 0, 2.5); b(0, 3, 1.5); b(12, 6, 1.5); b(7, 8, 2.5); b(0, 11, 1.5); b(12, 14, 1.5);
  } else {
    b(0, 0, 6, 0.36); b(7, 8, 4, 0.32); b(12, 12, 3, 0.3);
  }

  /* ── KORD "stab" pada luar rentak (bunyi ceria/bouncy) ── */
  [2, 6, 10, 14].forEach((i) => {
    [0, 1, 2].forEach((j) => suara(nota(nadaKord(akar, minor, j)), swing(i), dt * 1.4, lobi ? 0.04 : 0.05, G.stab, 2200));
  });

  /* ── MELODI (berulang setiap 2 bar — senang melekat) ── */
  if (!kira) {
    const pola = G.melodi[bar % 2];
    const kuat = lobi ? 0.1 : 0.13;
    pola.forEach((x, i) => {
      if (x < 0) return;
      // panjang not = sehingga not seterusnya
      let p = 1; while (i + p < 16 && pola[i + p] < 0 && p < 4) p++;
      const f = nota(nadaKord(akar, minor, x) + 12);
      suara(f, swing(i), dt * (p + 0.3), kuat, G.lead, G.cerah, false);
      if (lari || menang) suara(f * 2, swing(i), dt * (p + 0.2), kuat * 0.35, 'triangle', 5000, false); // lapisan oktaf
    });
  } else {
    // semasa kiraan detik: arpeggio naik 1/16 (rasa teruja, bukan misteri)
    for (let i = 0; i < 16; i++) {
      suara(nota(nadaKord(akar, minor, i % 6) + 12), swing(i), dt * 0.9, 0.07, G.lead, G.cerah);
    }
  }

  /* ── Larian: arpeggio berkilau 1/16 di atas segalanya ── */
  if (lari) {
    for (let i = 0; i < 16; i++) {
      const x = [0, 1, 2, 3, 4, 3, 2, 1][i % 8];
      suara(nota(nadaKord(akar, minor, x) + 24), swing(i), dt * 0.7, 0.035, 'triangle', 6000);
    }
  }

  /* ── Menang: fanfar trompet ── */
  if (menang && bar % 2 === 0) {
    [0, 1, 2, 3].forEach((x, j) =>
      suara(nota(nadaKord(G.k, false, x) + 12), t0 + j * dt * 1.5, dt * (j === 3 ? 8 : 2), 0.16, 'sawtooth', 3500));
  }
}

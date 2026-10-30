/* muzik.js — Muzik latar RANCAK, dijana terus dalam pelayar (Web Audio).
 *
 * Kenapa dijana, bukan fail MP3?
 *   - tiada fail besar untuk dihos di GitHub Pages
 *   - tiada isu hak cipta / lesen untuk acara rasmi
 *   - boleh berubah ikut keadaan: tenang semasa menunggu, rancak semasa
 *     larian, dan fanfar kemenangan — tanpa potongan audio yang janggal.
 *
 * Setiap tema ada kuncinya sendiri supaya bunyinya berbeza.
 * API:  Muzik.mula(tema) · Muzik.suasana('lobi'|'kira'|'lari'|'menang')
 *       Muzik.berhenti() · Muzik.hidup(true/false) · Muzik.aktif
 */

const GAYA = {
  // skala pentatonik/major supaya sentiasa sedap walau rawak
  wira: { bpm: 128, akar: 57, skala: [0, 2, 4, 7, 9], kord: [0, 5, 3, 4], jenis: 'sawtooth' },
  kuda: { bpm: 140, akar: 55, skala: [0, 2, 4, 7, 9], kord: [0, 3, 4, 3], jenis: 'square' },
  itik: { bpm: 112, akar: 60, skala: [0, 2, 4, 7, 9], kord: [0, 5, 3, 4], jenis: 'triangle' },
  burung: { bpm: 120, akar: 62, skala: [0, 2, 4, 7, 11], kord: [0, 4, 5, 3], jenis: 'triangle' },
};

const nota = (m) => 440 * Math.pow(2, (m - 69) / 12);

let AC = null, keluar = null, nadiId = 0;
let gaya = GAYA.wira;
let suasana = 'lobi';
let bar = 0, masaSeterusnya = 0;
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
      mampat.threshold.value = -14; mampat.ratio.value = 4;
      keluar.connect(mampat); mampat.connect(AC.destination);
    }
    if (berjalan) return;
    berjalan = true;
    bar = 0;
    masaSeterusnya = AC.currentTime + 0.12;
    naikTurun(0.5, 1.2);
    nadiId = setInterval(nadi, 60);
  },

  berhenti() {
    berjalan = false;
    clearInterval(nadiId);
    if (keluar && AC) naikTurun(0, 0.6);
  },

  /** Hidup/matikan muzik (butang di skrin pentas). */
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
    if (!keluar || !AC || !berjalan) return;
    const isi = { lobi: 0.34, kira: 0.5, lari: 0.72, menang: 0.6 }[s] ?? 0.4;
    naikTurun(isi, s === 'lari' ? 0.25 : 0.8);
  },
};

function naikTurun(ke, saat) {
  if (!keluar || !AC) return;
  const t = AC.currentTime;
  keluar.gain.cancelScheduledValues(t);
  keluar.gain.setValueAtTime(Math.max(0.0001, keluar.gain.value), t);
  keluar.gain.linearRampToValueAtTime(ke, t + saat);
}

/* ── Alat ── */

function suara(freq, mula, panjang, kuat, jenis, sapuan) {
  const o = AC.createOscillator();
  const g = AC.createGain();
  const f = AC.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(sapuan ? 2600 : 1500, mula);
  if (sapuan) f.frequency.exponentialRampToValueAtTime(700, mula + panjang);
  o.type = jenis || gaya.jenis;
  o.frequency.setValueAtTime(freq, mula);
  g.gain.setValueAtTime(0.0001, mula);
  g.gain.exponentialRampToValueAtTime(kuat, mula + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, mula + panjang);
  o.connect(f); f.connect(g); g.connect(keluar);
  o.start(mula); o.stop(mula + panjang + 0.02);
}

function bas(freq, mula, panjang, kuat) {
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, mula);
  g.gain.setValueAtTime(0.0001, mula);
  g.gain.exponentialRampToValueAtTime(kuat, mula + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, mula + panjang);
  o.connect(g); g.connect(keluar);
  o.start(mula); o.stop(mula + panjang + 0.02);
}

function kik(mula, kuat = 0.9) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, mula);
  o.frequency.exponentialRampToValueAtTime(45, mula + 0.11);
  g.gain.setValueAtTime(kuat, mula);
  g.gain.exponentialRampToValueAtTime(0.0001, mula + 0.19);
  o.connect(g); g.connect(keluar);
  o.start(mula); o.stop(mula + 0.21);
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

function perkusi(mula, panjang, hz, kuat, jenisTapis = 'highpass') {
  const s = AC.createBufferSource();
  s.buffer = hingar();
  const f = AC.createBiquadFilter();
  f.type = jenisTapis; f.frequency.value = hz;
  const g = AC.createGain();
  g.gain.setValueAtTime(kuat, mula);
  g.gain.exponentialRampToValueAtTime(0.0001, mula + panjang);
  s.connect(f); f.connect(g); g.connect(keluar);
  s.start(mula); s.stop(mula + panjang + 0.02);
}

/* ── Penjadual (lookahead 0.25 s) ── */

function nadi() {
  if (!berjalan || !AC) return;
  const sebarak = 60 / gaya.bpm / 4; // satu per-enam-belas
  while (masaSeterusnya < AC.currentTime + 0.25) {
    mainBar(masaSeterusnya, sebarak);
    masaSeterusnya += sebarak * 16;
    bar++;
  }
}

function mainBar(t0, dt) {
  const penuh = suasana === 'lari' || suasana === 'menang';
  const sederhana = suasana === 'kira';
  const kordAkar = gaya.akar + gaya.kord[bar % gaya.kord.length];

  // BAS — setiap not keempat
  for (let i = 0; i < 16; i += 4) {
    bas(nota(kordAkar - 12), t0 + i * dt, dt * 3.4, penuh ? 0.5 : 0.34);
  }

  // KORD (pad) pada denyut 1 dan 3
  [0, 8].forEach((i) => {
    [0, 4, 7].forEach((semi, j) => {
      suara(nota(kordAkar + semi), t0 + i * dt, dt * 7, (penuh ? 0.075 : 0.055) - j * 0.008, 'triangle');
    });
  });

  // DRUM
  if (suasana !== 'lobi') {
    [0, 4, 8, 12].forEach((i) => kik(t0 + i * dt, penuh ? 0.95 : 0.6));
    if (penuh) { kik(t0 + 10 * dt, 0.5); kik(t0 + 14.5 * dt, 0.45); }
    [4, 12].forEach((i) => perkusi(t0 + i * dt, 0.14, 1600, penuh ? 0.5 : 0.3));
    for (let i = 0; i < 16; i += 2) {
      perkusi(t0 + i * dt, 0.035, 7000, penuh ? 0.16 : 0.09);
    }
    if (penuh) for (let i = 1; i < 16; i += 2) perkusi(t0 + i * dt, 0.025, 8000, 0.07);
  } else {
    [0, 8].forEach((i) => kik(t0 + i * dt, 0.45));
    for (let i = 0; i < 16; i += 4) perkusi(t0 + i * dt, 0.03, 7000, 0.07);
  }

  // MELODI arpeggio — hanya bila rancak
  if (penuh || sederhana) {
    const sk = gaya.skala;
    for (let i = 0; i < 16; i += 2) {
      if (!penuh && i % 4) continue;
      const langkah = sk[(bar * 3 + i / 2) % sk.length];
      const oktaf = ((bar + i) % 7 === 0) ? 12 : 0;
      suara(
        nota(kordAkar + 12 + langkah + oktaf),
        t0 + i * dt,
        dt * 1.7,
        penuh ? 0.17 : 0.1,
        gaya.jenis,
        true
      );
    }
  }

  // FANFAR kemenangan pada permulaan setiap bar
  if (suasana === 'menang' && bar % 2 === 0) {
    [0, 4, 7, 12].forEach((semi, j) => {
      suara(nota(kordAkar + 12 + semi), t0 + j * dt * 1.5, dt * 4, 0.2, 'square');
    });
  }
}

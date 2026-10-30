/**
 * buahsayur.js — 20 watak maskot BUAH & SAYUR untuk Wira Pecut.
 *   10 buah  : epal, oren, pisang, tembikai, nanas, strawberi, anggur,
 *              mangga, betik, buah naga
 *   10 sayur : brokoli, lobak merah, tomato, jagung, terung, cili,
 *              bawang, timun, kubis, cendawan
 *
 * Semua dibina daripada bentuk asas Three.js — tiada fail .glb.
 * Rangka dikongsi (badan + 2 lengan + 2 kaki + muka), cuma "badan"
 * sahaja berbeza bagi setiap spesies. Jadi animasi larian yang sama
 * berfungsi untuk kesemua 20 watak.
 *
 * API sama seperti tema lain: { jenis, grup, pose(mod, t, laju) }
 *   mod = 'sedia' | 'lari' | 'jogging' | 'menang'
 */
import * as THREE from 'three';
import { kapsul, bola, std, benih, buatMata } from './watak.js';

const TAU = Math.PI * 2;
const klip = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/* ══════════════════ Senarai spesies ══════════════════
   W/H/D = separuh lebar / tinggi / dalam badan (unit dunia)
   cy    = pusat badan di atas sendi pinggul
   mukaY = muka relatif kepada pusat badan;  mataR = saiz mata
----------------------------------------------------------- */

export const SPESIES = [
  /* ── BUAH ── */
  { id: 'epal', nama: 'Epal', emoji: '🍎', jenis: 'buah',
    W: 0.56, H: 0.54, D: 0.56, cy: 0.62, mukaY: -0.02, mataR: 0.155,
    utama: '#E03A4C', kedua: '#B82B3C', daun: '#4CAF50', bentuk: 'epal' },
  { id: 'oren', nama: 'Oren', emoji: '🍊', jenis: 'buah',
    W: 0.55, H: 0.52, D: 0.55, cy: 0.6, mukaY: -0.02, mataR: 0.155,
    utama: '#FF8A1E', kedua: '#E2700F', daun: '#4CAF50', bentuk: 'oren' },
  { id: 'pisang', nama: 'Pisang', emoji: '🍌', jenis: 'buah',
    W: 0.5, H: 0.62, D: 0.3, cy: 0.66, mukaY: -0.06, mataR: 0.145,
    utama: '#F5CE3E', kedua: '#D9A92A', daun: '#6B4A1F', bentuk: 'pisang' },
  { id: 'tembikai', nama: 'Tembikai', emoji: '🍉', jenis: 'buah',
    W: 0.58, H: 0.52, D: 0.58, cy: 0.6, mukaY: -0.02, mataR: 0.160,
    utama: '#E8455B', kedua: '#4FA24A', daun: '#255F28', bentuk: 'tembikai' },
  { id: 'nanas', nama: 'Nanas', emoji: '🍍', jenis: 'buah',
    W: 0.48, H: 0.62, D: 0.48, cy: 0.68, mukaY: -0.02, mataR: 0.145,
    utama: '#E8B33C', kedua: '#C08F22', daun: '#4F9E46', bentuk: 'nanas' },
  { id: 'strawberi', nama: 'Strawberi', emoji: '🍓', jenis: 'buah',
    W: 0.54, H: 0.56, D: 0.54, cy: 0.62, mukaY: 0.02, mataR: 0.150,
    utama: '#E33B4E', kedua: '#F8E08E', daun: '#4CAF50', bentuk: 'strawberi' },
  { id: 'anggur', nama: 'Anggur', emoji: '🍇', jenis: 'buah',
    W: 0.52, H: 0.58, D: 0.5, cy: 0.64, mukaY: 0.0, mataR: 0.140,
    utama: '#8E52C4', kedua: '#6B3A9B', daun: '#4CAF50', bentuk: 'anggur' },
  { id: 'mangga', nama: 'Mangga', emoji: '🥭', jenis: 'buah',
    W: 0.54, H: 0.5, D: 0.5, cy: 0.6, mukaY: -0.02, mataR: 0.155,
    utama: '#F2A33C', kedua: '#E0552F', daun: '#4CAF50', bentuk: 'mangga' },
  { id: 'betik', nama: 'Betik', emoji: '🫐', jenis: 'buah',
    W: 0.46, H: 0.6, D: 0.46, cy: 0.66, mukaY: 0.0, mataR: 0.150,
    utama: '#E8A33C', kedua: '#F0663C', daun: '#4F9E46', bentuk: 'betik' },
  { id: 'naga', nama: 'Buah Naga', emoji: '🐉', jenis: 'buah',
    W: 0.5, H: 0.58, D: 0.5, cy: 0.64, mukaY: 0.0, mataR: 0.150,
    utama: '#D9426E', kedua: '#B22A55', daun: '#5BAE4F', bentuk: 'naga' },

  /* ── SAYUR ── */
  { id: 'brokoli', nama: 'Brokoli', emoji: '🥦', jenis: 'sayur',
    W: 0.54, H: 0.56, D: 0.54, cy: 0.64, mukaY: -0.1, mataR: 0.145,
    utama: '#3F8F3A', kedua: '#9ACD5E', daun: '#2F6F2C', bentuk: 'brokoli' },
  { id: 'lobak', nama: 'Lobak Merah', emoji: '🥕', jenis: 'sayur',
    W: 0.42, H: 0.62, D: 0.42, cy: 0.66, mukaY: 0.0, mataR: 0.140,
    utama: '#F08030', kedua: '#D4631B', daun: '#4CAF50', bentuk: 'lobak' },
  { id: 'tomato', nama: 'Tomato', emoji: '🍅', jenis: 'sayur',
    W: 0.56, H: 0.48, D: 0.56, cy: 0.58, mukaY: -0.02, mataR: 0.160,
    utama: '#E33B3B', kedua: '#C22B2B', daun: '#4CAF50', bentuk: 'tomato' },
  { id: 'jagung', nama: 'Jagung', emoji: '🌽', jenis: 'sayur',
    W: 0.42, H: 0.62, D: 0.42, cy: 0.66, mukaY: 0.0, mataR: 0.140,
    utama: '#F5D33E', kedua: '#DCB822', daun: '#6FBF4A', bentuk: 'jagung' },
  { id: 'terung', nama: 'Terung', emoji: '🍆', jenis: 'sayur',
    W: 0.46, H: 0.6, D: 0.46, cy: 0.64, mukaY: 0.0, mataR: 0.150,
    utama: '#7B3F98', kedua: '#5E2E76', daun: '#4F9E46', bentuk: 'terung' },
  { id: 'cili', nama: 'Cili', emoji: '🌶️', jenis: 'sayur',
    W: 0.38, H: 0.62, D: 0.38, cy: 0.66, mukaY: 0.0, mataR: 0.135,
    utama: '#D92B2B', kedua: '#AE1E1E', daun: '#4F9E46', bentuk: 'cili' },
  { id: 'bawang', nama: 'Bawang', emoji: '🧅', jenis: 'sayur',
    W: 0.52, H: 0.54, D: 0.52, cy: 0.62, mukaY: -0.02, mataR: 0.150,
    utama: '#C98BB8', kedua: '#A8588F', daun: '#6FBF4A', bentuk: 'bawang' },
  { id: 'timun', nama: 'Timun', emoji: '🥒', jenis: 'sayur',
    W: 0.38, H: 0.64, D: 0.38, cy: 0.68, mukaY: 0.0, mataR: 0.135,
    utama: '#4F9E46', kedua: '#7BC36A', daun: '#3C7A36', bentuk: 'timun' },
  { id: 'kubis', nama: 'Kubis', emoji: '🥬', jenis: 'sayur',
    W: 0.58, H: 0.54, D: 0.58, cy: 0.62, mukaY: -0.02, mataR: 0.155,
    utama: '#9ACD5E', kedua: '#6FA83F', daun: '#86BF4E', bentuk: 'kubis' },
  { id: 'cendawan', nama: 'Cendawan', emoji: '🍄', jenis: 'sayur',
    W: 0.56, H: 0.5, D: 0.56, cy: 0.58, mukaY: -0.06, mataR: 0.150,
    utama: '#F0E6D2', kedua: '#C0604A', daun: '#F7F1E4', bentuk: 'cendawan' },
];

export const BUAH = SPESIES.filter((s) => s.jenis === 'buah');
export const SAYUR = SPESIES.filter((s) => s.jenis === 'sayur');
export const cariSpesies = (id) =>
  SPESIES.find((s) => s.id === id) || SPESIES[0];

/* ══════════════════ Pembantu bentuk ══════════════════ */

const elips = (m, sx, sy, sz, ws = 30) => {
  const b = bola(1, m, ws, Math.max(16, ws * 0.7));
  b.scale.set(sx, sy, sz);
  return b;
};

/** Tangkai melengkung di atas kepala. */
function tangkai(m, panjang = 0.22, tebal = 0.045) {
  const t = kapsul(tebal, panjang, m);
  t.rotation.z = -0.22;
  return t;
}

/** Daun bujur rata. */
function daun(m, panjang = 0.28, lebar = 0.16) {
  const d = elips(m, lebar, 0.035, panjang, 20);
  return d;
}

/** Tekstur jalur menegak (tembikai) — lebih kemas daripada bar timbul. */
function teksturJalur(asas, jalur, bil = 10) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = asas; g.fillRect(0, 0, 512, 64);
  g.fillStyle = jalur;
  for (let i = 0; i < bil; i++) {
    const x = (i / bil) * 512;
    g.beginPath();
    g.moveTo(x, 0);
    g.quadraticCurveTo(x + 14, 32, x, 64);
    g.quadraticCurveTo(x - 14, 32, x, 0);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ══════════════════ Badan setiap spesies ══════════════════
   Setiap fungsi menambah mesh ke `g` (pusat badan = asalan g)
   dan memulangkan kumpulan hiasan atas kepala (untuk digoyang). */

const BADAN = {
  epal(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D);
    b.position.y = -0.02;
    g.add(b);
    // lekuk atas
    const lekuk = elips(B.kedua, S.W * 0.3, 0.1, S.D * 0.3, 18);
    lekuk.position.y = S.H * 0.82;
    g.add(lekuk);
    const h = new THREE.Group();
    h.position.y = S.H * 0.85;
    const t = tangkai(B.batang, 0.2);
    t.position.y = 0.12;
    const d = daun(B.daun, 0.3, 0.17);
    d.position.set(0.17, 0.2, 0);
    d.rotation.set(0, 0, 0.45);
    h.add(t, d);
    g.add(h);
    return h;
  },

  oren(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D);
    g.add(b);
    // tempat tangkai
    const p = elips(B.kedua, 0.12, 0.05, 0.12, 16);
    p.position.y = S.H * 0.95;
    g.add(p);
    const h = new THREE.Group();
    h.position.y = S.H * 0.95;
    const d = daun(B.daun, 0.26, 0.15);
    d.position.set(0.14, 0.08, 0);
    d.rotation.z = 0.5;
    const d2 = daun(B.daun, 0.22, 0.13);
    d2.position.set(-0.11, 0.06, 0.04);
    d2.rotation.set(0, 0.5, -0.55);
    h.add(d, d2);
    g.add(h);
    return h;
  },

  pisang(g, B, S) {
    // lengkok tebal: elipsoid besar mengikut busur
    // pisang MENEGAK dengan lengkok lembut "C" — tegak lebih mudah dikenali
    // 18 sfera BERTINDIH rapat = permukaan licin (bukan bersegmen)
    const n = 18;
    const kedudukan = (u) => {
      const a = (u - 0.5) * 1.2;
      return { x: 0.3 * Math.sin(a) - 0.04, y: (u - 0.5) * 1.12, a };
    };
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const { x, y } = kedudukan(u);
      const tirus = 1 - Math.pow(Math.abs(u - 0.5) * 2, 3) * 0.55;
      const seg = bola(0.2 * tirus, B.utama, 20, 14);
      seg.position.set(x, y, 0);
      g.add(seg);
    }
    // hujung coklat atas & bawah
    [0, 1].forEach((u) => {
      const { x, y } = kedudukan(u);
      const hj = elips(B.daun, 0.07, 0.08, 0.07, 12);
      hj.position.set(x, y + (u ? 0.06 : -0.06), 0);
      g.add(hj);
    });
    const h = new THREE.Group();
    h.position.set(kedudukan(1).x, kedudukan(1).y + 0.06, 0);
    return h;
  },

  tembikai(g, B, S) {
    // tembikai BULAT berjalur — jalur dilukis sebagai tekstur, bukan mesh
    const tek = teksturJalur(S.kedua, S.daun, 9);
    const bahanKulit = tek
      ? new THREE.MeshStandardMaterial({ map: tek, roughness: 0.42 })
      : B.kedua;
    const b = elips(bahanKulit, S.W, S.H, S.D, 40);
    g.add(b);
    const h = new THREE.Group();
    h.position.y = S.H * 0.95;
    const t = tangkai(B.batang, 0.16, 0.045);
    t.position.y = 0.08;
    h.add(t);
    g.add(h);
    return h;
  },

  nanas(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D);
    g.add(b);
    // corak silang
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      for (let j = -1; j <= 1; j++) {
        const sisik = elips(B.kedua, 0.07, 0.07, 0.03, 10);
        sisik.position.set(
          Math.sin(a) * S.W * 0.9,
          j * 0.2,
          Math.cos(a) * S.D * 0.9
        );
        sisik.rotation.y = a;
        g.add(sisik);
      }
    }
    const h = new THREE.Group();
    h.position.y = S.H * 0.92;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      const d = elips(B.daun, 0.06, 0.26, 0.09, 12);
      d.position.set(Math.sin(a) * 0.11, 0.22, Math.cos(a) * 0.11);
      d.rotation.set(Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45);
      h.add(d);
    }
    g.add(h);
    return h;
  },

  strawberi(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 32);
    b.scale.y *= 1.0;
    g.add(b);
    // tirus ke bawah
    const hujung = elips(B.utama, S.W * 0.55, S.H * 0.5, S.D * 0.55, 24);
    hujung.position.y = -S.H * 0.75;
    g.add(hujung);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU * 2.4;
      const y = -0.42 + (i / 14) * 0.75;
      const r = Math.cos((y / S.H) * 1.1) * S.W * 0.95;
      const bj = elips(B.kedua, 0.028, 0.042, 0.02, 8);
      bj.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
      bj.rotation.y = a;
      g.add(bj);
    }
    const h = new THREE.Group();
    h.position.y = S.H * 0.86;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const d = daun(B.daun, 0.2, 0.1);
      d.position.set(Math.sin(a) * 0.14, 0.02, Math.cos(a) * 0.14);
      d.rotation.set(0.25, -a, 0);
      h.add(d);
    }
    const t = tangkai(B.daun, 0.14, 0.035);
    t.position.y = 0.12;
    h.add(t);
    g.add(h);
    return h;
  },

  anggur(g, B, S) {
    // gugusan bulatan
    const letak = [
      [0, 0.34, 0], [-0.26, 0.12, 0.04], [0.26, 0.12, 0.04],
      [0, 0.08, 0.26], [0, 0.06, -0.24],
      [-0.2, -0.16, 0.18], [0.2, -0.16, 0.18], [0, -0.2, -0.1],
      [-0.16, -0.14, -0.2], [0.16, -0.14, -0.2], [0, -0.46, 0.04],
    ];
    letak.forEach((p, i) => {
      const b = bola(0.22, i % 3 === 0 ? B.kedua : B.utama, 20, 14);
      b.position.set(p[0], p[1], p[2]);
      g.add(b);
    });
    const h = new THREE.Group();
    h.position.y = S.H * 0.92;
    const t = tangkai(B.batang, 0.16, 0.04);
    t.position.y = 0.08;
    const d = daun(B.daun, 0.26, 0.2);
    d.position.set(0.16, 0.14, 0);
    d.rotation.z = 0.5;
    h.add(t, d);
    g.add(h);
    return h;
  },

  mangga(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 32);
    b.rotation.z = 0.18;
    g.add(b);
    const merona = elips(B.kedua, S.W * 0.55, S.H * 0.5, S.D * 0.5, 20);
    merona.position.set(-S.W * 0.42, S.H * 0.3, S.D * 0.45);
    g.add(merona);
    const h = new THREE.Group();
    h.position.set(0.1, S.H * 0.9, 0);
    const t = tangkai(B.batang, 0.16, 0.035);
    t.position.y = 0.09;
    const d = daun(B.daun, 0.24, 0.12);
    d.position.set(0.14, 0.14, 0);
    d.rotation.z = 0.6;
    h.add(t, d);
    g.add(h);
    return h;
  },

  betik(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 32);
    g.add(b);
    const bawah = elips(B.utama, S.W * 1.08, S.H * 0.5, S.D * 1.08, 28);
    bawah.position.y = -S.H * 0.3;
    g.add(bawah);
    // belahan isi oren di bahagian BAWAH badan (jangan di muka)
    const isi = elips(B.kedua, S.W * 0.4, S.H * 0.3, 0.08, 22);
    isi.position.set(0, -S.H * 0.52, S.D * 0.9);
    g.add(isi);
    const h = new THREE.Group();
    h.position.y = S.H * 0.95;
    const t = tangkai(B.daun, 0.16, 0.04);
    t.position.y = 0.08;
    h.add(t);
    g.add(h);
    return h;
  },

  naga(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 32);
    g.add(b);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const y = -0.25 + (i % 3) * 0.26;
      const s = elips(B.daun, 0.14, 0.07, 0.1, 12);
      s.position.set(Math.sin(a) * S.W * 0.92, y, Math.cos(a) * S.D * 0.92);
      s.rotation.set(0.3, a, 0.2);
      g.add(s);
    }
    const h = new THREE.Group();
    h.position.y = S.H * 0.9;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU;
      const s = elips(B.daun, 0.1, 0.06, 0.16, 12);
      s.position.set(Math.sin(a) * 0.12, 0.06, Math.cos(a) * 0.12);
      s.rotation.set(-0.5, -a, 0);
      h.add(s);
    }
    g.add(h);
    return h;
  },

  brokoli(g, B, S) {
    // batang
    const batang = kapsul(0.19, 0.3, B.kedua);
    batang.position.y = -S.H * 0.55;
    g.add(batang);
    // kepala berbonjol
    const inti = elips(B.utama, S.W * 0.8, S.H * 0.5, S.D * 0.8, 24);
    inti.position.y = S.H * 0.3;
    g.add(inti);
    const rnd = benih('brokoli');
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + rnd() * 0.4;
      const naik = 0.25 + rnd() * 0.7;
      const r = Math.sqrt(Math.max(0, 1 - naik * naik));
      const bj = bola(0.15 + rnd() * 0.07, B.utama, 14, 10);
      bj.position.set(
        Math.sin(a) * r * S.W * 0.95,
        S.H * 0.3 + naik * S.H * 0.58,
        Math.cos(a) * r * S.D * 0.95
      );
      g.add(bj);
    }
    const h = new THREE.Group();
    h.position.y = S.H * 0.95;
    return h;
  },

  lobak(g, B, S) {
    // kon terbalik (tirus ke bawah)
    const n = 6;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const r = 0.42 * (1 - u * 0.82);
      const seg = elips(B.utama, r, 0.14, r, 20);
      seg.position.y = S.H * 0.85 - u * (S.H * 1.9);
      g.add(seg);
    }
    for (let i = 0; i < 4; i++) {
      const garis = elips(B.kedua, 0.3 - i * 0.05, 0.015, 0.3 - i * 0.05, 16);
      garis.position.y = S.H * 0.5 - i * 0.26;
      g.add(garis);
    }
    const h = new THREE.Group();
    h.position.y = S.H * 0.88;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      const d = elips(B.daun, 0.08, 0.24, 0.1, 12);
      d.position.set(Math.sin(a) * 0.1, 0.22, Math.cos(a) * 0.1);
      d.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
      h.add(d);
    }
    g.add(h);
    return h;
  },

  tomato(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 32);
    g.add(b);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      // lekuk mesti TENGGELAM dalam badan, bukan tersembul jadi duri
      const lekuk = elips(B.kedua, 0.042, S.H * 0.45, 0.042, 10);
      lekuk.position.set(Math.sin(a) * S.W * 0.78, 0, Math.cos(a) * S.D * 0.78);
      g.add(lekuk);
    }
    const h = new THREE.Group();
    h.position.y = S.H * 0.92;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      const d = daun(B.daun, 0.2, 0.09);
      d.position.set(Math.sin(a) * 0.13, 0, Math.cos(a) * 0.13);
      d.rotation.set(0.3, -a, 0);
      h.add(d);
    }
    const t = tangkai(B.daun, 0.12, 0.035);
    t.position.y = 0.1;
    h.add(t);
    g.add(h);
    return h;
  },

  jagung(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 28);
    g.add(b);
    // biji jagung
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * Math.PI - Math.PI * 0.5 + (i % 2) * 0.3;
        const y = -0.42 + i * 0.15;
        const bj = elips(B.kedua, 0.07, 0.06, 0.05, 8);
        bj.position.set(Math.sin(a) * S.W * 0.92, y, Math.cos(a) * S.D * 0.92);
        bj.rotation.y = a;
        g.add(bj);
      }
    }
    // kulit daun
    [-1, 1].forEach((s) => {
      const d = elips(B.daun, 0.1, S.H * 0.85, 0.16, 14);
      d.position.set(s * S.W * 0.95, -S.H * 0.15, -0.06);
      d.rotation.z = s * 0.22;
      g.add(d);
    });
    const h = new THREE.Group();
    h.position.y = S.H * 0.92;
    const rambut = elips(B.kedua, 0.1, 0.14, 0.1, 12);
    rambut.position.y = 0.08;
    h.add(rambut);
    g.add(h);
    return h;
  },

  terung(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 32);
    g.add(b);
    const bawah = elips(B.utama, S.W * 1.05, S.H * 0.45, S.D * 1.05, 28);
    bawah.position.y = -S.H * 0.42;
    g.add(bawah);
    const kilau = elips(B.kedua, 0.08, S.H * 0.45, 0.06, 12);
    kilau.position.set(-S.W * 0.55, S.H * 0.2, S.D * 0.72);
    g.add(kilau);
    const h = new THREE.Group();
    h.position.y = S.H * 0.9;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      const d = daun(B.daun, 0.22, 0.11);
      d.position.set(Math.sin(a) * 0.14, 0.02, Math.cos(a) * 0.14);
      d.rotation.set(0.35, -a, 0);
      h.add(d);
    }
    const t = tangkai(B.daun, 0.16, 0.045);
    t.position.y = 0.13;
    h.add(t);
    g.add(h);
    return h;
  },

  cili(g, B, S) {
    // segmen BERTINDIH rapat supaya licin, bukan bersusun macam gelang
    const n = 16;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const a = (u - 0.35) * 1.1;
      const r = 0.33 * (1 - Math.pow(u, 1.5) * 0.78);
      const seg = bola(r, B.utama, 18, 12);
      seg.position.set(Math.sin(a) * 0.22, S.H * 0.8 - u * (S.H * 1.75), 0);
      g.add(seg);
    }
    const h = new THREE.Group();
    h.position.y = S.H * 0.85;
    const t = tangkai(B.daun, 0.2, 0.05);
    t.position.y = 0.12;
    t.rotation.z = 0.3;
    const tudung = elips(B.daun, 0.17, 0.07, 0.17, 14);
    tudung.position.y = 0.02;
    h.add(t, tudung);
    g.add(h);
    return h;
  },

  bawang(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 32);
    g.add(b);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const garis = elips(B.kedua, 0.045, S.H * 0.92, 0.045, 10);
      garis.position.set(Math.sin(a) * S.W * 0.9, 0, Math.cos(a) * S.D * 0.9);
      g.add(garis);
    }
    const akar = elips(B.kedua, 0.08, 0.1, 0.08, 10);
    akar.position.y = -S.H * 0.98;
    g.add(akar);
    const h = new THREE.Group();
    h.position.y = S.H * 0.92;
    for (let i = 0; i < 3; i++) {
      const d = elips(B.daun, 0.05, 0.26, 0.05, 10);
      d.position.set((i - 1) * 0.1, 0.22, 0);
      d.rotation.z = (i - 1) * 0.35;
      h.add(d);
    }
    g.add(h);
    return h;
  },

  timun(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 28);
    g.add(b);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const garis = elips(B.kedua, 0.038, S.H * 0.72, 0.038, 10);
      garis.position.set(Math.sin(a) * S.W * 0.86, 0, Math.cos(a) * S.D * 0.86);
      g.add(garis);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU * 1.5;
      const bintil = bola(0.028, B.kedua, 8, 6);
      bintil.position.set(
        Math.sin(a) * S.W * 0.88, -0.3 + i * 0.12, Math.cos(a) * S.D * 0.88
      );
      g.add(bintil);
    }
    const h = new THREE.Group();
    h.position.y = S.H * 0.95;
    const t = tangkai(B.daun, 0.14, 0.04);
    t.position.y = 0.07;
    h.add(t);
    g.add(h);
    return h;
  },

  kubis(g, B, S) {
    const b = elips(B.utama, S.W, S.H, S.D, 32);
    g.add(b);
    // lapisan daun luar
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const d = elips(B.kedua, 0.3, 0.3, 0.14, 18);
      d.position.set(Math.sin(a) * S.W * 0.8, -0.08, Math.cos(a) * S.D * 0.8);
      d.rotation.set(0.2, -a, 0);
      g.add(d);
    }
    const atas = elips(B.daun, S.W * 0.6, 0.16, S.D * 0.6, 20);
    atas.position.y = S.H * 0.82;
    g.add(atas);
    const h = new THREE.Group();
    h.position.y = S.H * 0.95;
    return h;
  },

  cendawan(g, B, S) {
    const batang = kapsul(0.21, 0.3, B.utama);
    batang.position.y = -S.H * 0.35;
    g.add(batang);
    const topi = elips(B.kedua, S.W, S.H * 0.78, S.D, 30);
    topi.position.y = S.H * 0.55;
    topi.scale.y *= 1;
    g.add(topi);
    // potong bawah topi supaya rata
    const bawah = elips(B.daun, S.W * 0.92, 0.1, S.D * 0.92, 24);
    bawah.position.y = S.H * 0.2;
    g.add(bawah);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const b2 = elips(B.daun, 0.1, 0.05, 0.1, 12);
      b2.position.set(
        Math.sin(a) * S.W * 0.6,
        S.H * 0.9,
        Math.cos(a) * S.D * 0.6
      );
      g.add(b2);
    }
    const h = new THREE.Group();
    h.position.y = S.H * 1.1;
    return h;
  },
};

/* ══════════════════ Bina watak penuh ══════════════════ */

// Kaki pendek & badan besar = rupa maskot yang comel.
// Kaki ≈ 24% tinggi keseluruhan.
const PINGGUL = 0.46;

export function buatBuahSayur(p) {
  const S = cariSpesies(p.spesies);
  const perempuan = p.jantina === 'perempuan';

  const B = {
    utama: std(S.utama, 0.42),
    kedua: std(S.kedua, 0.45),
    daun: std(S.daun, 0.5),
    batang: std('#6B4A24', 0.6),
    anggota: std(S.kedua, 0.55),
    sarung: std('#FFFFFF', 0.45),
    kasut: std('#FFFFFF', 0.4),
    sol: std(S.kedua, 0.5),
    mata: std('#FBFBFC', 0.25),
    iris: std('#3B2414', 0.3),
    hitam: std('#120E0B', 0.28),
    putih: std('#FFFFFF', 0.4),
    mulut: std('#6E2026', 0.5),
    lidah: std('#E0707A', 0.6),
    pipi: new THREE.MeshStandardMaterial({
      color: '#FF8C8C', roughness: 0.9, transparent: true, opacity: 0.4,
    }),
    reben: std('#FF5C8A', 0.5),
  };

  const grup = new THREE.Group();
  const akar = new THREE.Group();
  grup.add(akar);

  /* ── Kaki ── */
  const buatKaki = (sisi) => {
    const pehe = new THREE.Group();
    pehe.position.set(0.17 * sisi, PINGGUL, 0);
    const m1 = kapsul(0.095, 0.08, B.anggota);
    m1.position.y = -0.135;
    pehe.add(m1);

    const lutut = new THREE.Group();
    lutut.position.y = -0.24;
    const m2 = kapsul(0.085, 0.05, B.anggota);
    m2.position.y = -0.1;
    lutut.add(m2);
    pehe.add(lutut);

    const tapak = new THREE.Group();
    tapak.position.y = -0.19;
    const atas = kapsul(0.12, 0.13, B.kasut);
    atas.rotation.x = Math.PI / 2;
    atas.position.set(0, -0.07, 0.06);
    const sol = kapsul(0.125, 0.14, B.sol);
    sol.rotation.x = Math.PI / 2;
    sol.scale.set(1.02, 0.62, 1.02);
    sol.position.set(0, -0.125, 0.06);
    tapak.add(atas, sol);
    lutut.add(tapak);
    return { pehe, lutut, tapak };
  };
  const kakiKiri = buatKaki(-1);
  const kakiKanan = buatKaki(1);
  akar.add(kakiKiri.pehe, kakiKanan.pehe);

  /* ── Badan ── */
  const badan = new THREE.Group();
  badan.position.y = PINGGUL;
  akar.add(badan);

  const isiBadan = new THREE.Group();
  isiBadan.position.y = S.cy;
  badan.add(isiBadan);
  const hiasan = (BADAN[S.bentuk] || BADAN.epal)(isiBadan, B, S);

  /* ── Lengan ── */
  const buatLengan = (sisi) => {
    const bahu = new THREE.Group();
    bahu.position.set(S.W * 0.86 * sisi, S.cy + S.H * 0.05, 0);
    const m1 = kapsul(0.08, 0.1, B.anggota);
    m1.position.y = -0.12;
    bahu.add(m1);
    const siku = new THREE.Group();
    siku.position.y = -0.24;
    const m2 = kapsul(0.072, 0.08, B.anggota);
    m2.position.y = -0.1;
    siku.add(m2);
    const tangan = bola(0.115, B.sarung, 18, 14);
    tangan.position.y = -0.23;
    siku.add(tangan);
    bahu.add(siku);
    return { bahu, siku };
  };
  const lenganKiri = buatLengan(-1);
  const lenganKanan = buatLengan(1);
  badan.add(lenganKiri.bahu, lenganKanan.bahu);

  /* ── Muka ── */
  // muka diletak di BAHAGIAN ATAS badan (mata kira-kira 1/5 dari atas)
  const muka = new THREE.Group();
  muka.position.set(0, S.cy + S.mukaY + S.H * 0.2, 0);
  badan.add(muka);

  // pada ketinggian mata, permukaan elipsoid lebih ke dalam
  const yn = 0.2 + S.mukaY / S.H;
  // 0.82 = mata tenggelam sedikit ke dalam permukaan supaya hanya
  // tonjolan kecil kelihatan (bonjol penuh nampak seram, bukan comel)
  const zMuka = S.D * Math.sqrt(Math.max(0.3, 1 - yn * yn)) * 0.82;
  const jarakMata = S.W * 0.4;
  [-1, 1].forEach((s) => {
    const m = buatMata(S.mataR, B, { sisi: s, bulu: perempuan });
    m.position.set(jarakMata * s, S.mataR * 0.5, zMuka);
    m.rotation.y = 0.22 * s;
    m.scale.set(1, 1.05, 0.58);
    muka.add(m);

    const pipi = elips(B.pipi, 0.1, 0.06, 0.05, 12);
    pipi.position.set((jarakMata + S.mataR * 1.35) * s, -S.mataR * 0.85, zMuka * 0.86);
    muka.add(pipi);
  });

  const mulut = bola(S.mataR * 0.78, B.mulut, 20, 14);
  mulut.scale.set(1.25, 0.8, 0.45);
  mulut.position.set(0, -S.mataR * 1.5, zMuka * 0.97);
  muka.add(mulut);
  const lidah = bola(S.mataR * 0.42, B.lidah, 14, 10);
  lidah.scale.set(1.2, 0.6, 0.6);
  lidah.position.set(0, -S.mataR * 1.85, zMuka * 1.0);
  muka.add(lidah);

  // reben untuk perempuan (di hiasan atas)
  if (perempuan) {
    const r = new THREE.Group();
    [-1, 1].forEach((s) => {
      const gelung = elips(B.reben, 0.12, 0.08, 0.05, 14);
      gelung.position.set(0.11 * s, 0, 0);
      gelung.rotation.z = 0.35 * s;
      r.add(gelung);
    });
    const simpul = bola(0.05, B.reben, 12, 10);
    r.add(simpul);
    r.position.set(S.W * 0.55, S.H * 0.62, S.D * 0.4);
    r.rotation.y = -0.5;
    isiBadan.add(r);
  }

  grup.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; }
  });

  const o = {
    jenis: 'buahsayur',
    spesies: S.id,
    grup, akar, badan, isiBadan, muka, hiasan,
    kepala: muka, // nama sama seperti watak lain (haiwan.js guna .kepala)
    bahu: { kiri: lenganKiri.bahu, kanan: lenganKanan.bahu },
    siku: { kiri: lenganKiri.siku, kanan: lenganKanan.siku },
    pehe: { kiri: kakiKiri.pehe, kanan: kakiKanan.pehe },
    lutut: { kiri: kakiKiri.lutut, kanan: kakiKanan.lutut },
    tapak: { kiri: kakiKiri.tapak, kanan: kakiKanan.tapak },
    bahan: B,
    pilihan: { ...p },
  };
  o.pose = (mod, t, laju = 1) => pose(o, mod, t, laju);
  return o;
}

/* ══════════════════ Animasi ══════════════════
   Comel = goyang badan (squash & stretch), kaki laju,
   tangan memukul, dan daun/tangkai di kepala melantun. */

const KADAR = 2.3; // kitaran larian sesaat

function kakiLari(pehe, lutut, tapak, p) {
  const depan = 0.95 * Math.sin(p);
  const bengkok = 0.22 + 1.25 * (0.5 + 0.5 * Math.cos(p - 5.5));
  pehe.rotation.set(-depan, 0, 0);
  lutut.rotation.x = bengkok;
  tapak.rotation.x = 0.3 + depan * 0.3 - bengkok * 0.45;
}

function pose(o, mod, t, laju = 1) {
  if (mod === 'menang') return poseMenang(o, t);
  if (mod === 'sedia') return poseSedia(o, t);

  const kelajuan = mod === 'jogging' ? 0.58 : laju;
  const p = t * KADAR * kelajuan * TAU;
  const kuat = mod === 'jogging' ? 0.6 : 1;

  kakiLari(o.pehe.kanan, o.lutut.kanan, o.tapak.kanan, p);
  kakiLari(o.pehe.kiri, o.lutut.kiri, o.tapak.kiri, p + Math.PI);

  ['kiri', 'kanan'].forEach((s) => {
    const sisi = s === 'kiri' ? -1 : 1;
    const fasa = s === 'kiri' ? p : p + Math.PI;
    o.bahu[s].rotation.set(-0.3 - 0.85 * Math.sin(fasa) * kuat, 0, 0.42 * sisi);
    o.siku[s].rotation.x = -(0.55 + 0.3 * Math.sin(fasa + 1));
  });

  // lantunan + picit/regang
  const lantun = 0.5 - 0.5 * Math.cos(2 * p);
  o.akar.position.y = 0.1 * lantun * kuat;
  const picit = Math.cos(2 * p) * 0.055 * kuat;
  o.isiBadan.scale.set(1 + picit, 1 - picit, 1 + picit);

  o.badan.rotation.set(
    -0.16 * kuat,
    -0.12 * Math.sin(p) * kuat,
    0.07 * Math.sin(p) * kuat
  );
  o.muka.rotation.set(0.08 * kuat, 0, -0.05 * Math.sin(p));
  if (o.hiasan) {
    o.hiasan.rotation.set(
      0.3 * Math.sin(2 * p + 0.6) * kuat,
      0,
      0.22 * Math.sin(p) * kuat
    );
  }
}

function poseSedia(o, t) {
  const n = Math.sin(t * 1.9);
  o.akar.position.y = 0.025 + 0.025 * n;
  const picit = n * 0.03;
  o.isiBadan.scale.set(1 + picit, 1 - picit, 1 + picit);
  o.badan.rotation.set(-0.02, Math.sin(t * 0.9) * 0.16, 0);
  o.muka.rotation.set(0, 0, 0);
  ['kiri', 'kanan'].forEach((s, i) => {
    const sisi = s === 'kiri' ? -1 : 1;
    o.bahu[s].rotation.set(0.12 * n, 0, (0.5 + 0.05 * n) * sisi);
    o.siku[s].rotation.x = -0.3 - 0.12 * Math.sin(t * 1.9 + i);
    o.pehe[s].rotation.set(0, 0, 0.04 * sisi);
    o.lutut[s].rotation.x = 0.06;
    o.tapak[s].rotation.x = 0.02;
  });
  if (o.hiasan) o.hiasan.rotation.set(0.1 * n, 0, 0.08 * Math.sin(t * 1.3));
}

function poseMenang(o, t) {
  const kitar = 0.8;
  const u = (t % kitar) / kitar;
  const lompat = Math.pow(Math.max(0, Math.sin(u * Math.PI)), 0.8);

  o.akar.position.y = lompat * 0.6;
  // picit masa mendarat, regang masa di udara
  const regang = lompat * 0.12 - (1 - lompat) * 0.06;
  o.isiBadan.scale.set(1 - regang * 0.7, 1 + regang, 1 - regang * 0.7);

  o.badan.rotation.set(-0.06 - lompat * 0.08, Math.sin(t * 3.2) * 0.22, 0);
  o.muka.rotation.set(0.12 + lompat * 0.1, 0, 0);

  ['kiri', 'kanan'].forEach((s, i) => {
    const sisi = s === 'kiri' ? -1 : 1;
    o.bahu[s].rotation.set(-0.25, 0, (1.9 + lompat * 0.4) * sisi);
    o.siku[s].rotation.x = -(0.25 + 0.3 * Math.sin(t * 7 + i));
    o.pehe[s].rotation.set(-lompat * (0.85 + i * 0.3), 0, lompat * 0.3 * sisi);
    o.lutut[s].rotation.x = lompat * (1.4 + i * 0.3);
    o.tapak[s].rotation.x = 0.3 - lompat * 0.45;
  });
  if (o.hiasan) {
    o.hiasan.rotation.set(0.45 * lompat, 0, Math.sin(t * 7) * 0.3);
  }
}

/** Pose menunggang kuda (joki buah/sayur). */
export function poseJokiBuahSayur(o, t, goncang = 0) {
  o.akar.position.y = 0.03 * goncang;
  o.isiBadan.scale.set(1, 1, 1);
  o.badan.rotation.set(-0.5 - 0.06 * goncang, 0, 0);
  o.muka.rotation.set(0.3, 0, 0);
  ['kiri', 'kanan'].forEach((s) => {
    const sisi = s === 'kiri' ? -1 : 1;
    o.pehe[s].rotation.set(-1.35, 0, 0.6 * sisi);
    o.lutut[s].rotation.x = 1.9;
    o.tapak[s].rotation.x = -0.3;
    o.bahu[s].rotation.set(0.15 + 0.1 * goncang, 0, 0.5 * sisi);
    o.siku[s].rotation.x = -0.6;
  });
  if (o.hiasan) o.hiasan.rotation.set(0.25 + 0.2 * goncang, 0, 0);
}

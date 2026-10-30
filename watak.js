/**
 * watak.js — Watak manusia "Wira Pecut" (Three.js tulen, tiada fail .glb).
 *
 * INI FAIL SUMBER SEBENAR untuk watak. src/wira/watak.ts (Remotion) hanya
 * mengeksport semula fail ini. Perlukan import map untuk "three".
 *
 * v2 — dirapatkan dengan gambar rujukan: kepala ~40% tinggi badan, jambul
 * tebal tersisir ke atas, hoodie terbuka + baju dengan HURUF besar (huruf
 * pertama nama peserta), jalur putih seluar, kasut berwarna tapak kuning.
 */
import * as THREE from 'three';

/* ───────────────────────── Warna ───────────────────────── */

export const WARNA_WIRA = [
  { id: 'hijau', nama: 'Hijau', hue: 134, sat: 0.52 },
  { id: 'biru', nama: 'Biru', hue: 220, sat: 0.62 },
  { id: 'ungu', nama: 'Ungu', hue: 272, sat: 0.5 },
  { id: 'oren', nama: 'Oren', hue: 20, sat: 0.72 },
  { id: 'kuning', nama: 'Kuning', hue: 44, sat: 0.8 },
  { id: 'teal', nama: 'Teal', hue: 178, sat: 0.55 },
  { id: 'merahjambu', nama: 'Merah Jambu', hue: 332, sat: 0.6 },
  { id: 'merah', nama: 'Merah', hue: 357, sat: 0.62 },
  { id: 'lime', nama: 'Lime', hue: 86, sat: 0.58 },
  { id: 'indigo', nama: 'Indigo', hue: 250, sat: 0.5 },
  { id: 'magenta', nama: 'Magenta', hue: 302, sat: 0.5 },
  { id: 'langit', nama: 'Langit', hue: 198, sat: 0.65 },
];

export const KULIT = ['#F7C9A3', '#EDAE7E', '#C8875C', '#94603E'];
export const RAMBUT = ['#3A2419', '#1E1511', '#5A3520', '#2A1C14'];

/** Tinggi anggaran watak berdiri (unit dunia, sebelum skala). */
export const TINGGI = 2.4;

export const hsl = (h, s, l) => new THREE.Color().setHSL(h / 360, s, l);
export const cariWarna = (id) => WARNA_WIRA.find((x) => x.id === id) ?? WARNA_WIRA[0];

/** Penjana nombor rawak boleh-ulang (supaya watak sama setiap kali dimuat). */
export function benih(teks) {
  const s = String(teks);
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────────────── Pembantu geometri ───────────────────── */

export const kapsul = (r, p, m) =>
  new THREE.Mesh(new THREE.CapsuleGeometry(r, p, 8, 22), m);

export const bola = (r, m, ws = 28, hs = 20) =>
  new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m);

/** Tempurung sfera menghadap +Z (untuk iris, anak mata). */
export const tempurung = (r, sudut, m) => {
  const g = new THREE.SphereGeometry(r, 28, 18, 0, Math.PI * 2, 0, sudut);
  const mesh = new THREE.Mesh(g, m);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
};

export const std = (warna, kasar = 0.7, logam = 0) =>
  new THREE.MeshStandardMaterial({
    color: warna instanceof THREE.Color ? warna : new THREE.Color(warna),
    roughness: kasar,
    metalness: logam,
  });

const PAKSI_Y = new THREE.Vector3(0, 1, 0);
/** Letak kapsul supaya paksinya ikut arah `arah`, berpangkal di `pangkal`. */
export function kapsulArah(r, panjang, bahan, pangkal, arah) {
  const m = kapsul(r, panjang, bahan);
  const d = arah.clone().normalize();
  m.quaternion.setFromUnitVectors(PAKSI_Y, d);
  m.position.copy(pangkal).addScaledVector(d, panjang / 2 + r * 0.4);
  return m;
}

/** Mata kartun besar — dikongsi oleh manusia & haiwan. */
export function buatMata(r, bahan, { bulu = false, sisi = 1 } = {}) {
  const m = new THREE.Group();
  const putih = bola(r, bahan.mata);
  const iris = tempurung(r + 0.004 * (r / 0.17), 0.47, bahan.iris);
  const anak = tempurung(r + 0.008 * (r / 0.17), 0.26, bahan.hitam);
  const kilau = bola(r * 0.23, bahan.putih, 12, 10);
  kilau.position.set(-0.3 * r * sisi + 0.06 * r, 0.45 * r, r * 0.9);
  m.add(putih, iris, anak, kilau);
  if (bulu) {
    const lengkok = 0.78 * Math.PI;
    const b = new THREE.Mesh(new THREE.TorusGeometry(r * 0.92, r * 0.11, 8, 22, lengkok), bahan.hitam);
    b.rotation.z = Math.PI / 2 - lengkok / 2;
    b.position.z = Math.sqrt(Math.max(0, r * r - Math.pow(r * 0.92, 2)));
    m.add(b);
    // tiga helai bulu mata di hujung luar
    for (let i = 0; i < 3; i++) {
      const h = kapsul(r * 0.045, r * 0.22, bahan.hitam);
      const a = 0.35 + i * 0.28;
      h.position.set(-sisi * Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, r * 0.25);
      h.rotation.z = sisi * (Math.PI / 2 - a) * -1 + (sisi > 0 ? 0.6 : -0.6);
      m.add(h);
    }
  }
  return m;
}

/* ── Tekstur baju: warna + huruf besar putih, dibalut pada sfera ──
   UV sfera: u=0.25 ialah arah +Z (hadapan). Kanvas 2:1 = 2π:π, jadi
   huruf segi empat di kanvas kekal segi empat di khatulistiwa. */
function lukisBaju(kanvas, warnaCss, huruf) {
  const g = kanvas.getContext('2d');
  const W = kanvas.width, H = kanvas.height;
  g.fillStyle = warnaCss; g.fillRect(0, 0, W, H);
  if (!huruf) return;
  g.save();
  g.translate(W * 0.25, H * 0.5);
  g.scale(1, 1.15);
  g.font = `900 ${H * 0.6}px Poppins, Montserrat, "Arial Black", Arial, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = H * 0.04; g.strokeStyle = 'rgba(0,0,0,0.18)';
  g.strokeText(huruf, 0, H * 0.02);
  g.fillStyle = '#FFFFFF';
  g.fillText(huruf, 0, 0);
  g.restore();
}

/* ── Tekstur seluar: jalur putih di kedua-dua sisi (u=0.25 → +X, 0.75 → −X) */
function teksturSeluar(warnaCss) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = warnaCss; g.fillRect(0, 0, 128, 16);
  g.fillStyle = '#F4F2EC';
  [0.25, 0.75].forEach((u) => g.fillRect(u * 128 - 4, 0, 8, 16));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const css = (c) => '#' + c.getHexString();

/* ───────────────────────── Bina ─────────────────────────
   pilihan = { jantina:'lelaki'|'perempuan', warna:<id>, kulit:0-3,
               rambut:0-3, huruf:'A', seed:<apa-apa> }
---------------------------------------------------------------- */

const KEPALA_R = 0.56;
const SKALA_KEPALA = 0.8;

export function buatWira(pilihan) {
  const rnd = benih(pilihan.seed ?? pilihan.warna + pilihan.jantina);
  const w = cariWarna(pilihan.warna);
  const perempuan = pilihan.jantina === 'perempuan';
  const ada = typeof document !== 'undefined';

  const warna = {
    jaket: hsl(w.hue, w.sat, 0.46),
    gelap: hsl(w.hue, w.sat, 0.34),
    baju: hsl(w.hue, w.sat * 0.6, 0.62),
    seluar: hsl(w.hue, w.sat, 0.36),
  };

  const bahan = {
    kulit: std(KULIT[pilihan.kulit ?? Math.floor(rnd() * KULIT.length)], 0.8),
    rambut: std(RAMBUT[pilihan.rambut ?? Math.floor(rnd() * RAMBUT.length)], 0.55),
    jaket: std(warna.jaket, 0.8),
    jaketGelap: std(warna.gelap, 0.8),
    baju: std('#FFFFFF', 0.85),
    seluar: std('#FFFFFF', 0.82),
    seluarPolos: std(warna.seluar, 0.82),
    kasut: std(warna.jaket, 0.6),
    midsol: std('#F6F4EE', 0.6),
    sol: std('#F2C230', 0.55),
    putih: std('#FFFFFF', 0.45),
    mata: std('#FBFBFC', 0.3),
    iris: std('#6A4120', 0.35),
    hitam: std('#120E0B', 0.3),
    mulut: std('#5E1A20', 0.55),
    lidah: std('#E0707A', 0.6),
    pipi: new THREE.MeshStandardMaterial({ color: '#F08A86', roughness: 0.9, transparent: true, opacity: 0.35 }),
    jalur: std('#F4F2EC', 0.75),
  };

  // tekstur baju (huruf) & seluar (jalur) — hanya bila ada DOM
  let kanvasBaju = null;
  if (ada) {
    kanvasBaju = document.createElement('canvas');
    kanvasBaju.width = 512; kanvasBaju.height = 256;
    lukisBaju(kanvasBaju, css(warna.baju), (pilihan.huruf || '').slice(0, 1).toUpperCase());
    const tb = new THREE.CanvasTexture(kanvasBaju);
    tb.colorSpace = THREE.SRGBColorSpace;
    tb.anisotropy = 4;
    bahan.baju.map = tb;
    bahan.seluar.map = teksturSeluar(css(warna.seluar));
  } else {
    bahan.baju.color.copy(warna.baju);
    bahan.seluar.color.copy(warna.seluar);
  }

  const grup = new THREE.Group();
  const akar = new THREE.Group();
  grup.add(akar);

  /* ── Kaki (lebih panjang daripada v1) ── */
  const PINGGUL_Y = 1.08;
  const buatKaki = (sisi) => {
    const pehe = new THREE.Group();
    pehe.position.set(0.15 * sisi, PINGGUL_Y, 0);

    const mPehe = kapsul(0.13, 0.3, bahan.seluar);
    mPehe.position.y = -0.28;
    pehe.add(mPehe);

    const lutut = new THREE.Group();
    lutut.position.y = -0.56;
    const mBetis = kapsul(0.112, 0.27, bahan.seluar);
    mBetis.position.y = -0.245;
    lutut.add(mBetis);
    const kelepet = new THREE.Mesh(new THREE.CylinderGeometry(0.124, 0.118, 0.07, 22), bahan.jaketGelap);
    kelepet.position.y = -0.44;
    lutut.add(kelepet);
    pehe.add(lutut);

    const tapak = new THREE.Group();
    tapak.position.y = -0.49;
    const atas = kapsul(0.13, 0.17, bahan.kasut);
    atas.rotation.x = Math.PI / 2;
    atas.position.set(0, -0.06, 0.07);
    const lidahKasut = bola(0.085, bahan.midsol, 14, 10);
    lidahKasut.scale.set(0.9, 0.6, 1.2);
    lidahKasut.position.set(0, 0.0, 0.11);
    const mid = kapsul(0.142, 0.19, bahan.midsol);
    mid.rotation.x = Math.PI / 2;
    mid.scale.set(1.04, 0.5, 1.02);
    mid.position.set(0, -0.12, 0.07);
    const sol = kapsul(0.145, 0.2, bahan.sol);
    sol.rotation.x = Math.PI / 2;
    sol.scale.set(1.05, 0.42, 1.04);
    sol.position.set(0, -0.165, 0.075);
    tapak.add(atas, lidahKasut, mid, sol);
    lutut.add(tapak);

    return { pehe, lutut, tapak };
  };

  const kakiKiri = buatKaki(-1);
  const kakiKanan = buatKaki(1);
  akar.add(kakiKiri.pehe, kakiKanan.pehe);

  const pinggul = bola(0.28, bahan.seluarPolos);
  pinggul.scale.set(1.0, 0.75, 0.92);
  pinggul.position.y = PINGGUL_Y + 0.03;
  akar.add(pinggul);

  /* ── Badan ── */
  const badan = new THREE.Group();
  badan.position.y = PINGGUL_Y + 0.06;
  akar.add(badan);

  const dada = kapsul(0.28, 0.27, bahan.jaket);
  dada.position.y = 0.24;
  dada.scale.set(1, 1, 0.88);
  badan.add(dada);

  // hud terlipat di belakang leher (ciri utama hoodie)
  const hud = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.09, 12, 26), bahan.jaket);
  hud.rotation.x = Math.PI / 2 - 0.35;
  hud.scale.set(1.15, 1, 1);
  hud.position.set(0, 0.55, -0.06);
  badan.add(hud);
  const belakangHud = bola(0.2, bahan.jaket);
  belakangHud.scale.set(1.1, 0.75, 0.6);
  belakangHud.position.set(0, 0.47, -0.22);
  badan.add(belakangHud);

  // kelepet bawah jaket
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.282, 0.27, 0.09, 28), bahan.jaketGelap);
  hem.scale.set(1, 1, 0.88);
  hem.position.y = 0.0;
  badan.add(hem);

  // baju dalam dengan HURUF (tekstur dibalut pada elipsoid)
  const panel = bola(0.24, bahan.baju, 40, 24);
  panel.scale.set(0.95, 1.15, 0.62);
  panel.position.set(0, 0.27, 0.105);
  panel.rotation.y = 0; // u=0.25 (huruf) menghala +Z
  badan.add(panel);

  // bibir jaket terbuka di tepi panel, dengan zip nipis
  [-1, 1].forEach((s) => {
    const bibir = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.08), bahan.jaket);
    bibir.position.set(0.215 * s, 0.25, 0.17);
    bibir.rotation.z = 0.08 * s;
    bibir.rotation.y = -0.45 * s;
    badan.add(bibir);
    const zip = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.5, 0.015), bahan.jalur);
    zip.position.set(0.19 * s, 0.25, 0.205);
    zip.rotation.z = 0.08 * s;
    badan.add(zip);
  });

  /* ── Lengan ── */
  const buatLengan = (sisi) => {
    const bahu = new THREE.Group();
    bahu.position.set(0.29 * sisi, 0.43, 0);
    const pad = bola(0.13, bahan.jaket);
    bahu.add(pad);

    const mAtas = kapsul(0.105, 0.23, bahan.jaket);
    mAtas.position.y = -0.22;
    bahu.add(mAtas);

    const siku = new THREE.Group();
    siku.position.y = -0.44;
    const mBawah = kapsul(0.095, 0.2, bahan.jaket);
    mBawah.position.y = -0.19;
    siku.add(mBawah);
    const manset = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.098, 0.07, 18), bahan.jaketGelap);
    manset.position.y = -0.33;
    siku.add(manset);

    // penumbuk: genggaman + ibu jari
    const tangan = bola(0.13, bahan.kulit);
    tangan.scale.set(1, 1.05, 0.95);
    tangan.position.y = -0.43;
    const ibu = bola(0.05, bahan.kulit, 12, 10);
    ibu.position.set(-0.07 * sisi, -0.4, 0.09);
    siku.add(tangan, ibu);

    bahu.add(siku);
    return { bahu, siku };
  };

  const lenganKiri = buatLengan(-1);
  const lenganKanan = buatLengan(1);
  badan.add(lenganKiri.bahu, lenganKanan.bahu);

  /* ── Kepala ── */
  const kepala = new THREE.Group();
  kepala.position.y = 0.74;
  kepala.scale.setScalar(SKALA_KEPALA);
  badan.add(kepala);

  const leher = kapsul(0.11, 0.1, bahan.kulit);
  leher.position.y = -0.52;
  kepala.add(leher);

  const muka = bola(KEPALA_R, bahan.kulit, 36, 26);
  muka.scale.set(1, 0.98, 0.95);
  kepala.add(muka);
  // dagu & pipi bulat sedikit
  const dagu = bola(0.36, bahan.kulit);
  dagu.scale.set(1.1, 0.75, 0.9);
  dagu.position.set(0, -0.2, 0.12);
  kepala.add(dagu);

  [-1, 1].forEach((s) => {
    const t = bola(0.09, bahan.kulit);
    t.scale.set(0.6, 1.1, 0.6);
    t.position.set(0.54 * s, -0.04, -0.02);
    kepala.add(t);
    const pipi = bola(0.1, bahan.pipi, 16, 12);
    pipi.scale.set(1.2, 0.7, 0.3);
    pipi.position.set(0.31 * s, -0.17, 0.43);
    pipi.rotation.y = 0.55 * s;
    kepala.add(pipi);
  });

  // mata besar
  [-1, 1].forEach((s) => {
    const rMata = perempuan ? 0.168 : 0.16;
    const m = buatMata(rMata, bahan, { bulu: perempuan, sisi: s });
    m.position.set(0.205 * s, 0.0, 0.37);
    m.rotation.y = 0.18 * s;
    m.scale.set(1, 1.08, 0.78);
    kepala.add(m);

    // kening tebal melengkung
    const kening = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, perempuan ? 0.022 : 0.032, 8, 16, Math.PI * 0.55),
      bahan.rambut
    );
    kening.position.set(0.2 * s, 0.13, 0.45);
    kening.rotation.set(-0.35, 0, Math.PI / 2 - Math.PI * 0.275 + (s > 0 ? -0.08 : 0.08));
    kepala.add(kening);
  });

  const hidung = bola(0.055, bahan.kulit);
  hidung.scale.set(1.15, 0.85, 1);
  hidung.position.set(0, -0.09, 0.52);
  kepala.add(hidung);

  // senyum lebar terbuka: rongga gelap + gigi atas + lidah
  const mulut = bola(0.15, bahan.mulut);
  mulut.scale.set(1.25, 0.72, 0.5);
  mulut.position.set(0, -0.27, 0.44);
  kepala.add(mulut);
  const gigi = bola(0.12, bahan.putih, 20, 12);
  gigi.scale.set(1.25, 0.32, 0.4);
  gigi.position.set(0, -0.215, 0.475);
  kepala.add(gigi);
  const lidah = bola(0.085, bahan.lidah, 18, 12);
  lidah.scale.set(1.3, 0.55, 0.6);
  lidah.position.set(0, -0.315, 0.49);
  kepala.add(lidah);

  /* ── Rambut ── */
  let ekor;
  const pusatR = new THREE.Vector3(0, 0.1, -0.08);
  const topi = bola(1, bahan.rambut, 32, 24);
  topi.scale.set(perempuan ? 0.6 : 0.585, perempuan ? 0.58 : 0.57, 0.6);
  topi.position.copy(pusatR);
  kepala.add(topi);

  if (!perempuan) {
    // JAMBUL: gumpalan tebal yang tersisir ke BELAKANG (bukan tegak),
    // bertindih supaya jadi satu jisim mengembang seperti dalam gambar
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rnd() * 0.4;
      const naik = 0.55 + rnd() * 0.35;
      const sisiR = Math.sqrt(1 - naik * naik);
      const pada = new THREE.Vector3(Math.cos(a) * sisiR, naik, Math.sin(a) * sisiR);
      const pangkal = pusatR.clone().add(new THREE.Vector3(pada.x * 0.5, pada.y * 0.48, pada.z * 0.5));
      const arah = new THREE.Vector3(pada.x * 0.9, 0.55 + rnd() * 0.3, -1.0 + pada.z * 0.3);
      const helai = kapsulArah(0.13 + rnd() * 0.04, 0.08 + rnd() * 0.08, bahan.rambut, pangkal, arah);
      kepala.add(helai);
    }
    // jambul hadapan: gumpal besar melentik ke atas & ke sisi (macam gambar)
    [[-0.22, 0.4, 0.3, -0.9, 0.15], [-0.02, 0.47, 0.32, -0.6, 0.16], [0.2, 0.43, 0.28, -0.2, 0.14], [0.33, 0.32, 0.22, 0.5, 0.11]]
      .forEach(([x, y, z, condong, r]) => {
        const helai = kapsulArah(r, 0.16, bahan.rambut, new THREE.Vector3(x, y, z),
          new THREE.Vector3(condong, 1.0, -0.15));
        kepala.add(helai);
      });
    // jambang pendek
    [-1, 1].forEach((s) => {
      const j = bola(0.09, bahan.rambut);
      j.scale.set(0.6, 1.4, 0.8);
      j.position.set(0.5 * s, 0.08, 0.12);
      kepala.add(j);
    });
  } else {
    // poni beralun
    [[-0.22, 0.34, 0.36, 0.45], [0.0, 0.38, 0.4, 0], [0.22, 0.34, 0.36, -0.45]].forEach(([x, y, z, r]) => {
      const p = bola(0.17, bahan.rambut);
      p.scale.set(1.0, 0.6, 0.7);
      p.position.set(x, y, z);
      p.rotation.z = r;
      kepala.add(p);
    });
    // juntaian tepi muka hingga paras dagu
    [-1, 1].forEach((s) => {
      const j = kapsul(0.095, 0.38, bahan.rambut);
      j.position.set(0.48 * s, -0.08, 0.16);
      j.rotation.z = 0.1 * s;
      kepala.add(j);
    });
    // ekor kuda tinggi
    ekor = new THREE.Group();
    // dipasang di BELAKANG kepala (bukan ubun-ubun) supaya tidak menjulang
    // ke atas seperti tanduk bila dilihat dari depan. Permukaan belakang
    // rambut pada y=0.32 ialah z≈−0.64, jadi pangkal ini tersorok di dalamnya.
    ekor.position.set(0, 0.32, -0.6);
    const gelang = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.045, 12, 22), bahan.jaket);
    gelang.rotation.y = Math.PI / 2;
    gelang.position.y = -0.04;
    ekor.add(gelang);
    let y = -0.2;
    [0.2, 0.18, 0.15, 0.115, 0.075].forEach((r, i) => {
      const s = bola(r, bahan.rambut);
      s.scale.set(0.9, 1.35, 0.9);
      s.position.set(0, y, -0.015 * i);
      ekor.add(s);
      y -= r * 1.55;
    });
    kepala.add(ekor);
  }

  grup.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; }
  });

  return {
    jenis: 'manusia',
    grup, akar, badan, kepala,
    bahu: { kiri: lenganKiri.bahu, kanan: lenganKanan.bahu },
    siku: { kiri: lenganKiri.siku, kanan: lenganKanan.siku },
    pehe: { kiri: kakiKiri.pehe, kanan: kakiKanan.pehe },
    lutut: { kiri: kakiKiri.lutut, kanan: kakiKanan.lutut },
    tapak: { kiri: kakiKiri.tapak, kanan: kakiKanan.tapak },
    ekor, bahan, kanvasBaju,
    pilihan: { ...pilihan },
  };
}

/** Tukar huruf di dada (contoh: bila peserta menaip nama). */
export function setHuruf(wira, huruf) {
  if (!wira.kanvasBaju) return;
  const h = (huruf || '').slice(0, 1).toUpperCase();
  if (h === (wira.pilihan.huruf || '').slice(0, 1).toUpperCase()) return;
  wira.pilihan.huruf = h;
  const w = cariWarna(wira.pilihan.warna);
  lukisBaju(wira.kanvasBaju, css(hsl(w.hue, w.sat * 0.6, 0.62)), h);
  wira.bahan.baju.map.needsUpdate = true;
}

/** Tukar warna pakaian tanpa bina semula watak. */
export function tukarWarna(wira, idWarna) {
  const w = cariWarna(idWarna);
  wira.pilihan.warna = idWarna;
  wira.bahan.jaket.color.copy(hsl(w.hue, w.sat, 0.46));
  wira.bahan.jaketGelap.color.copy(hsl(w.hue, w.sat, 0.34));
  wira.bahan.kasut.color.copy(hsl(w.hue, w.sat, 0.46));
  wira.bahan.seluarPolos.color.copy(hsl(w.hue, w.sat, 0.36));
  if (wira.kanvasBaju) {
    lukisBaju(wira.kanvasBaju, css(hsl(w.hue, w.sat * 0.6, 0.62)), (wira.pilihan.huruf || '').slice(0, 1).toUpperCase());
    wira.bahan.baju.map.needsUpdate = true;
    const lama = wira.bahan.seluar.map;
    wira.bahan.seluar.map = teksturSeluar(css(hsl(w.hue, w.sat, 0.36)));
    wira.bahan.seluar.needsUpdate = true;
    lama && lama.dispose();
  } else {
    wira.bahan.baju.color.copy(hsl(w.hue, w.sat * 0.6, 0.62));
    wira.bahan.seluar.color.copy(hsl(w.hue, w.sat, 0.36));
  }
}

/* ───────────────────────── Animasi ─────────────────────────
   Semua pose dipandu MASA (saat) — tiada keadaan tersembunyi, jadi
   telefon dan skrin pentas boleh kira pose yang sama daripada jam
   pelayan dan kelihatan serentak.
---------------------------------------------------------------- */

const KADAR_LARI = 2.1; // kitaran penuh sesaat

function kakiLari(pehe, lutut, tapak, p) {
  const depan = 1.08 * Math.sin(p);
  const bengkok = 0.18 + 1.35 * (0.5 + 0.5 * Math.cos(p - 5.5));
  pehe.rotation.set(-depan, 0, 0);
  lutut.rotation.x = bengkok;
  tapak.rotation.x = 0.34 + depan * 0.3 - bengkok * 0.45;
}

function lenganLari(bahu, siku, p, sisi) {
  // negatif = ke hadapan; -0.25 = lengan sentiasa dalam kedudukan memecut;
  // rotation.z 0.34 supaya penumbuk tidak menutup muka.
  bahu.rotation.x = -0.25 - 0.8 * Math.sin(p);
  bahu.rotation.z = 0.34 * sisi;
  bahu.rotation.y = -0.2 * sisi;
  siku.rotation.x = -(1.15 + 0.35 * Math.sin(p + 1.0));
}

/** Pose larian. t = masa dalam saat. laju 1 = normal. */
export function poseLari(wira, t, laju = 1) {
  const p = t * KADAR_LARI * laju * Math.PI * 2;
  kakiLari(wira.pehe.kanan, wira.lutut.kanan, wira.tapak.kanan, p);
  kakiLari(wira.pehe.kiri, wira.lutut.kiri, wira.tapak.kiri, p + Math.PI);
  lenganLari(wira.bahu.kanan, wira.siku.kanan, p + Math.PI, 1);
  lenganLari(wira.bahu.kiri, wira.siku.kiri, p, -1);
  wira.akar.position.y = 0.09 * (0.5 - 0.5 * Math.cos(2 * p));
  wira.akar.rotation.set(0, 0, 0);
  wira.badan.rotation.set(-0.26, -0.14 * Math.sin(p), 0.055 * Math.sin(p));
  wira.kepala.rotation.set(0.21, 0.1 * Math.sin(p), -0.055 * Math.sin(p));
  if (wira.ekor) {
    // ~1.3 rad = melayang ke belakang, sedikit ke bawah
    wira.ekor.rotation.x = 1.3 + 0.22 * Math.sin(2 * p + 0.8);
    wira.ekor.rotation.z = 0.22 * Math.sin(p);
  }
}

/** Pose jogging santai (antara pusingan). */
export function poseJogging(wira, t) {
  poseLari(wira, t * 0.55);
  wira.badan.rotation.x = -0.1;
  wira.akar.position.y *= 0.55;
}

/** Pose raikan kemenangan — lompat gembira, tangan terbuka bentuk "V". */
export function poseMenang(wira, t) {
  const kitar = 0.85;
  const u = (((t % kitar) + kitar) % kitar) / kitar;
  const lompat = Math.pow(Math.max(0, Math.sin(u * Math.PI)), 0.85);
  wira.akar.position.y = lompat * 0.62;
  wira.akar.rotation.set(0, 0, 0);
  wira.badan.rotation.set(-0.05 - lompat * 0.1, Math.sin(t * 3.1) * 0.18, 0);
  wira.kepala.rotation.set(0.08 + lompat * 0.24, Math.sin(t * 3.1) * 0.12, Math.sin(t * 6.2) * 0.07);
  ['kiri', 'kanan'].forEach((s, i) => {
    const sisi = s === 'kiri' ? -1 : 1;
    wira.bahu[s].rotation.set(-0.3, 0, (1.85 + lompat * 0.35) * sisi);
    wira.siku[s].rotation.x = -(0.3 + 0.25 * Math.sin(t * 6 + i));
  });
  ['kiri', 'kanan'].forEach((s, i) => {
    const sisi = i === 0 ? -1 : 1;
    wira.pehe[s].rotation.set(-lompat * (0.95 + i * 0.25), 0, lompat * 0.28 * sisi);
    wira.lutut[s].rotation.x = lompat * (1.5 + i * 0.3);
    wira.tapak[s].rotation.x = 0.35 - lompat * 0.5;
  });
  if (wira.ekor) {
    wira.ekor.rotation.x = 0.75 + lompat * 0.6;
    wira.ekor.rotation.z = Math.sin(t * 6) * 0.22;
  }
}

/** Pose berdiri sedia. */
export function poseSedia(wira, t) {
  const n = Math.sin(t * 1.8);
  wira.akar.position.y = 0.02 + 0.02 * n;
  wira.akar.rotation.set(0, 0, 0);
  wira.badan.rotation.set(-0.04, Math.sin(t * 0.9) * 0.12, 0);
  wira.kepala.rotation.set(0.05 - 0.02 * n, Math.sin(t * 0.9) * 0.18, 0);
  ['kiri', 'kanan'].forEach((s, i) => {
    const sisi = s === 'kiri' ? -1 : 1;
    wira.bahu[s].rotation.set(0.1 * n, 0, (0.2 + 0.03 * n) * sisi);
    wira.siku[s].rotation.x = -0.4 - 0.1 * Math.sin(t * 1.8 + i);
    wira.pehe[s].rotation.set(0, 0, 0.045 * sisi);
    wira.lutut[s].rotation.x = 0.05;
    wira.tapak[s].rotation.x = 0.02;
  });
  if (wira.ekor) {
    wira.ekor.rotation.x = 0.5 + 0.06 * n;
    wira.ekor.rotation.z = 0;
  }
}

/** Pose JOKI menunggang kuda: membongkok, lutut dilipat, tangan pegang tali.
 *  `goncang` (−1..1) diberi oleh kuda supaya joki bergerak seiring. */
export function poseJoki(wira, t, goncang = 0) {
  wira.akar.position.y = 0.03 * goncang;
  wira.akar.rotation.set(0, 0, 0);
  wira.badan.rotation.set(-0.95 - 0.06 * goncang, 0, 0);
  wira.kepala.rotation.set(0.8, 0, 0);
  ['kiri', 'kanan'].forEach((s) => {
    const sisi = s === 'kiri' ? -1 : 1;
    wira.pehe[s].rotation.set(-1.45, 0, 0.55 * sisi);
    wira.lutut[s].rotation.x = 2.1;
    wira.tapak[s].rotation.x = -0.4;
    // badan condong −0.95; lengan +0.1 → jumlah ≈ −0.85 = ke depan-bawah
    // ke arah leher kuda, siku −0.75 → lengan bawah mendatar (pegang tali).
    // (dulu −1.25 → jumlah −2.2 = penumbuk menjulang ke atas.)
    wira.bahu[s].rotation.set(0.1 + 0.1 * goncang, 0, 0.22 * sisi);
    wira.siku[s].rotation.x = -0.75;
  });
  if (wira.ekor) {
    wira.ekor.rotation.x = 1.35 + 0.15 * goncang;
    wira.ekor.rotation.z = 0;
  }
}

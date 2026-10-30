/**
 * haiwan.js — Watak tema haiwan untuk Wira Pecut (Three.js tulen).
 *   buatKuda(p)   : kuda + joki (joki = watak manusia peserta, ikut jantina)
 *   buatItik(p)   : itik gaya "itik getah", badan ikut warna pilihan
 *   buatBurung(p) : burung bulat, bulu ikut warna pilihan
 *
 * Setiap fungsi memulangkan { jenis, grup, pose(mod, t, laju) }
 *   mod = 'sedia' | 'lari' | 'jogging' | 'menang'
 * Semua pose dipandu masa (saat) — selamat untuk penyegerakan peranti.
 * Watak menghadap +Z (sama seperti watak manusia).
 */
import * as THREE from 'three';
import {
  hsl, cariWarna, benih, kapsul, std, buatMata, kapsulArah,
} from './watak.js';
import { buatBuahSayur, poseJokiBuahSayur } from './buahsayur.js';

// Joki = watak buah/sayur pilihan peserta (menggantikan watak manusia)
const buatWira = buatBuahSayur;
const poseJoki = poseJokiBuahSayur;

const bola = (r, m, ws = 20, hs = 14) => new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m);
const lancar = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const TAU = Math.PI * 2;

function bahanMata() {
  return {
    mata: std('#FBFBFC', 0.3), iris: std('#3B2414', 0.35),
    hitam: std('#120E0B', 0.3), putih: std('#FFFFFF', 0.45),
  };
}

function bayang(grup) {
  grup.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
}

/** Reben (perempuan) — dua gelung + simpul. */
function buatReben(warna = '#FF5C8A') {
  const m = std(warna, 0.5);
  const g = new THREE.Group();
  [-1, 1].forEach((s) => {
    const gelung = bola(0.09, m, 14, 10);
    gelung.scale.set(1.25, 0.8, 0.45);
    gelung.position.set(0.1 * s, 0, 0);
    gelung.rotation.z = 0.35 * s;
    g.add(gelung);
  });
  const simpul = bola(0.045, m, 12, 8);
  g.add(simpul);
  return g;
}

/* ══════════════════════════ KUDA ══════════════════════════ */

const BULU_KUDA = [
  { badan: '#9A5B2E', surai: '#3A2216' }, // perang kemerahan
  { badan: '#6E3B1F', surai: '#1E1410' }, // perang gelap
  { badan: '#2E2622', surai: '#141010' }, // hitam
  { badan: '#B8B2AA', surai: '#5E5A55' }, // kelabu
  { badan: '#D9A75E', surai: '#F3E6C8' }, // palomino
  { badan: '#EDE7DD', surai: '#CFC6B8' }, // putih
];

export function buatKuda(p) {
  const rnd = benih('kuda' + (p.seed ?? p.warna));
  const w = cariWarna(p.warna);
  const bulu = BULU_KUDA[Math.floor(rnd() * BULU_KUDA.length)];
  const B = {
    ...bahanMata(),
    badan: std(bulu.badan, 0.62),
    surai: std(bulu.surai, 0.55),
    muncung: std(new THREE.Color(bulu.badan).multiplyScalar(0.72), 0.7),
    kuku: std('#2B2420', 0.5),
    stokin: std('#F4F0E8', 0.7),
    kain: std(hsl(w.hue, w.sat, 0.48), 0.75),
    kainTepi: std('#FFFFFF', 0.6),
    pelana: std('#4A2E1A', 0.5),
    tali: std(hsl(w.hue, w.sat, 0.32), 0.6),
    lubang: std('#22150F', 0.8),
  };
  B.kain.side = THREE.DoubleSide; B.kainTepi.side = THREE.DoubleSide; B.pelana.side = THREE.DoubleSide;

  const grup = new THREE.Group();
  const akar = new THREE.Group();
  grup.add(akar);
  const badan = new THREE.Group();
  badan.position.y = 1.08;
  akar.add(badan);

  // torso: kapsul memanjang + dada + punggung
  const tor = kapsul(0.3, 0.62, B.badan);
  tor.rotation.x = Math.PI / 2;
  badan.add(tor);
  const dada = bola(0.34, B.badan, 24, 18);
  dada.scale.set(0.92, 1.02, 1);
  dada.position.set(0, 0.03, 0.42);
  const punggung = bola(0.35, B.badan, 24, 18);
  punggung.position.set(0, 0.05, -0.42);
  badan.add(dada, punggung);

  // kain pelana (warna peserta) — cangkerang silinder di atas belakang
  const kainGeo = (r, panjang, lebar) => {
    const g = new THREE.CylinderGeometry(r, r, panjang, 22, 1, true, Math.PI - lebar / 2, lebar);
    g.rotateX(Math.PI / 2);
    return g;
  };
  const tepi = new THREE.Mesh(kainGeo(0.318, 0.62, 2.3), B.kainTepi);
  tepi.position.z = -0.05;
  const kain = new THREE.Mesh(kainGeo(0.325, 0.56, 2.1), B.kain);
  kain.position.z = -0.05;
  const pelana = new THREE.Mesh(kainGeo(0.335, 0.36, 1.2), B.pelana);
  pelana.position.z = -0.02;
  badan.add(tepi, kain, pelana);

  // leher + kepala
  const leher = new THREE.Group();
  leher.position.set(0, 0.2, 0.55);
  leher.rotation.x = -0.55;
  badan.add(leher);
  const mLeher = kapsul(0.16, 0.38, B.badan);
  mLeher.position.y = 0.27;
  leher.add(mLeher);
  for (let i = 0; i < 7; i++) { // surai
    const s = bola(0.08, B.surai, 12, 8);
    s.scale.set(0.55, 1.2, 0.9);
    s.position.set(0, 0.06 + i * 0.085, -0.13);
    leher.add(s);
  }

  const kepala = new THREE.Group();
  kepala.position.set(0, 0.56, 0.02);
  kepala.rotation.x = 1.05;
  leher.add(kepala);
  const tengkorak = bola(0.19, B.badan, 22, 16);
  const muka = kapsul(0.13, 0.26, B.badan);
  muka.rotation.x = Math.PI / 2;
  muka.position.set(0, -0.03, 0.2);
  const muncung = bola(0.15, B.muncung, 20, 14);
  muncung.scale.set(1, 0.9, 1.05);
  muncung.position.set(0, -0.06, 0.38);
  kepala.add(tengkorak, muka, muncung);
  [-1, 1].forEach((s) => {
    const l = bola(0.025, B.lubang, 8, 6);
    l.position.set(0.06 * s, -0.02, 0.52);
    kepala.add(l);
    const mata = buatMata(0.075, B, { sisi: s, bulu: p.jantina === 'perempuan' });
    mata.position.set(0.14 * s, 0.05, 0.1);
    mata.rotation.y = 0.75 * s;
    mata.scale.set(1, 1.1, 0.8);
    kepala.add(mata);
    const telinga = kapsul(0.045, 0.1, B.badan);
    telinga.position.set(0.09 * s, 0.2, -0.05);
    telinga.rotation.set(-0.3, 0, -0.25 * s);
    kepala.add(telinga);
  });
  const jambul = bola(0.08, B.surai, 12, 8);
  jambul.scale.set(1, 0.6, 1.3);
  jambul.position.set(0, 0.17, 0.08);
  kepala.add(jambul);
  // tali kekang
  const kekang = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 8, 20), B.tali);
  kekang.position.set(0, -0.04, 0.3);
  kepala.add(kekang);

  // kaki
  const kaki = {};
  const putihStokin = rnd() < 0.5;
  const buatKaki = (nama, x, z, hadapan) => {
    const atas = new THREE.Group();
    atas.position.set(x, -0.12, z);
    const m1 = kapsul(hadapan ? 0.095 : 0.11, 0.26, B.badan);
    m1.position.y = -0.2;
    atas.add(m1);
    const bawah = new THREE.Group();
    bawah.position.y = -0.44;
    const m2 = kapsul(0.062, 0.3, B.badan);
    m2.position.y = -0.2;
    bawah.add(m2);
    if (putihStokin && (rnd() < 0.6)) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.08, 0.14, 12), B.stokin);
      st.position.y = -0.35;
      bawah.add(st);
    }
    const kuku = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.1, 14), B.kuku);
    kuku.position.y = -0.46;
    bawah.add(kuku);
    atas.add(bawah);
    badan.add(atas);
    kaki[nama] = { atas, bawah };
  };
  buatKaki('dkiri', -0.16, 0.42, true);
  buatKaki('dkanan', 0.16, 0.42, true);
  buatKaki('bkiri', -0.16, -0.42, false);
  buatKaki('bkanan', 0.16, -0.42, false);

  // ekor
  const ekor = new THREE.Group();
  ekor.position.set(0, 0.2, -0.74);
  let y = -0.05;
  [0.1, 0.11, 0.1, 0.085, 0.06].forEach((r) => {
    const s = bola(r, B.surai, 12, 8);
    s.scale.set(0.8, 1.5, 0.8);
    s.position.y = y;
    ekor.add(s);
    y -= r * 1.6;
  });
  badan.add(ekor);

  // JOKI = watak manusia peserta (jantina, warna & huruf ikut pilihan)
  const joki = buatWira({ ...p, seed: 'joki' + (p.seed ?? '') });
  joki.grup.scale.setScalar(0.46);
  // punggung joki (akar→badan = 0.92 × skala 0.5 ≈ 0.46) mesti duduk atas
  // pelana (≈ +0.33 dari pusat badan kuda), jadi asalnya ≈ 0.33 − 0.46.
  joki.grup.position.set(0, -0.11, -0.04);
  badan.add(joki.grup);

  bayang(grup);

  const PUSING_BELAKANG = new THREE.Vector3(0, 0, -0.42);
  const PAKSI_X = new THREE.Vector3(1, 0, 0);

  function kakiBerdiri() {
    Object.values(kaki).forEach((k) => { k.atas.rotation.set(0, 0, 0); k.bawah.rotation.set(0, 0, 0); });
  }

  function lari(t, laju, kuat = 1) {
    const f = 2.2 * laju;
    const fasa = TAU * f * t;
    const ofs = { bkiri: 0, bkanan: 0.1, dkiri: 0.48, dkanan: 0.58 };
    Object.entries(ofs).forEach(([n, o]) => {
      const ph = fasa + TAU * o;
      const hadapan = n[0] === 'd';
      kaki[n].atas.rotation.x = (hadapan ? -0.75 : -0.6) * Math.sin(ph) * kuat + (hadapan ? 0 : 0.1);
      kaki[n].bawah.rotation.x = hadapan
        ? 1.4 * Math.max(0, Math.sin(ph + 1.2)) * kuat
        : -0.95 * Math.max(0, Math.sin(ph + 0.9)) * kuat;
    });
    const g = Math.sin(fasa);
    akar.position.set(0, 0.07 * Math.max(0, Math.sin(fasa + 0.6)) * kuat, 0);
    akar.rotation.set(0.07 * Math.sin(fasa + Math.PI) * kuat, 0, 0);
    leher.rotation.x = -0.55 + 0.13 * Math.sin(fasa + 0.5) * kuat;
    kepala.rotation.x = 1.05;
    ekor.rotation.set(0.6 + 0.6 * kuat + 0.12 * Math.sin(fasa * 2), 0, 0.1 * Math.sin(fasa));
    poseJoki(joki, t, g * kuat);
  }

  function pose(mod, t, laju = 1) {
    if (mod === 'lari') return lari(t, laju, 1);
    if (mod === 'jogging') return lari(t, 0.6, 0.55);
    if (mod === 'menang') {
      // MENDONGAK berdiri dua kaki, kaki depan mengais udara, joki angkat tangan
      const th = 0.62 + 0.08 * Math.sin(t * 3);
      akar.rotation.set(-th, 0, 0);
      const pivot = PUSING_BELAKANG.clone().add(new THREE.Vector3(0, 0, 0));
      const putar = pivot.clone().applyAxisAngle(PAKSI_X, -th);
      akar.position.copy(pivot).sub(putar);
      kaki.dkiri.atas.rotation.x = -0.9 + 0.5 * Math.sin(t * 9);
      kaki.dkanan.atas.rotation.x = -0.9 + 0.5 * Math.sin(t * 9 + 1.6);
      kaki.dkiri.bawah.rotation.x = 1.3; kaki.dkanan.bawah.rotation.x = 1.3;
      kaki.bkiri.atas.rotation.x = 0.55; kaki.bkanan.atas.rotation.x = 0.55;
      kaki.bkiri.bawah.rotation.x = -0.35; kaki.bkanan.bawah.rotation.x = -0.35;
      leher.rotation.x = -0.15; kepala.rotation.x = 0.7 + 0.1 * Math.sin(t * 6);
      ekor.rotation.set(0.4, 0, 0.3 * Math.sin(t * 5));
      poseJoki(joki, t, 0);
      joki.badan.rotation.x = -0.15;
      joki.kepala.rotation.x = 0.3;
      joki.bahu.kanan.rotation.set(-0.4, 0, 2.3 + 0.2 * Math.sin(t * 8));
      joki.siku.kanan.rotation.x = -0.3;
      return;
    }
    // sedia
    kakiBerdiri();
    akar.position.set(0, 0.01 * Math.sin(t * 1.6), 0);
    akar.rotation.set(0, 0, 0);
    const kais = Math.pow(Math.max(0, Math.sin(t * 1.3)), 6);
    kaki.dkanan.atas.rotation.x = -0.35 * kais;
    kaki.dkanan.bawah.rotation.x = 1.0 * kais;
    leher.rotation.x = -0.45 + 0.06 * Math.sin(t * 1.1);
    kepala.rotation.x = 1.05 + 0.08 * Math.sin(t * 2.2);
    ekor.rotation.set(0.35, 0, 0.35 * Math.sin(t * 2.4));
    poseJoki(joki, t, 0);
    joki.badan.rotation.x = -0.4;
    joki.kepala.rotation.x = 0.35;
  }

  return { jenis: 'kuda', grup, pose, joki };
}

/* ══════════════════════════ ITIK ══════════════════════════ */

export function buatItik(p) {
  const w = cariWarna(p.warna);
  const perempuan = p.jantina === 'perempuan';
  const B = {
    ...bahanMata(),
    badan: std(hsl(w.hue, Math.min(1, w.sat * 1.1), 0.56), 0.35),
    gelap: std(hsl(w.hue, w.sat, 0.42), 0.4),
    paruh: std('#FF8A1F', 0.4),
    pipi: new THREE.MeshStandardMaterial({ color: '#FF8C8C', roughness: 0.9, transparent: true, opacity: 0.4 }),
    buih: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9, transparent: true, opacity: 0.65 }),
  };

  const grup = new THREE.Group();
  const akar = new THREE.Group();
  grup.add(akar);

  const tubuh = bola(0.5, B.badan, 28, 20);
  tubuh.scale.set(0.88, 0.62, 1.05);
  tubuh.position.y = 0.24;
  const dada = bola(0.4, B.badan, 24, 18);
  dada.scale.set(0.9, 0.85, 0.8);
  dada.position.set(0, 0.36, 0.24);
  const ekor = kapsulArah(0.13, 0.12, B.badan, new THREE.Vector3(0, 0.34, -0.42), new THREE.Vector3(0, 0.9, -0.6));
  akar.add(tubuh, dada, ekor);

  const kepala = new THREE.Group();
  kepala.position.set(0, 0.84, 0.26);
  akar.add(kepala);
  const k = bola(0.33, B.badan, 26, 20);
  const paruhAtas = bola(0.16, B.paruh, 20, 12);
  paruhAtas.scale.set(1.25, 0.42, 1.3);
  paruhAtas.position.set(0, -0.05, 0.31);
  const paruhBawah = bola(0.13, B.paruh, 16, 10);
  paruhBawah.scale.set(1.1, 0.3, 1.05);
  paruhBawah.position.set(0, -0.11, 0.27);
  kepala.add(k, paruhAtas, paruhBawah);
  [-1, 1].forEach((s) => {
    const m = buatMata(0.105, B, { sisi: s, bulu: perempuan });
    m.position.set(0.14 * s, 0.07, 0.24);
    m.rotation.y = 0.38 * s;
    m.scale.set(1, 1.1, 0.8);
    kepala.add(m);
    const pipi = bola(0.07, B.pipi, 12, 8);
    pipi.scale.set(1.2, 0.7, 0.3);
    pipi.position.set(0.22 * s, -0.06, 0.2);
    pipi.rotation.y = 0.7 * s;
    kepala.add(pipi);
  });
  if (perempuan) {
    const r = buatReben();
    r.position.set(0.13, 0.28, 0.02);
    r.rotation.set(0, 0.3, -0.4);
    kepala.add(r);
  } else {
    // topi kelasi
    const topi = new THREE.Group();
    const putih = std('#FFFFFF', 0.6);
    const tapak = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.08, 20), putih);
    const jalur = new THREE.Mesh(new THREE.CylinderGeometry(0.192, 0.192, 0.035, 20), B.gelap);
    jalur.position.y = -0.02;
    const bunga = bola(0.035, B.gelap, 10, 8);
    bunga.position.y = 0.06;
    topi.add(tapak, jalur, bunga);
    topi.position.set(0, 0.3, -0.02);
    topi.rotation.set(-0.15, 0, 0.18);
    kepala.add(topi);
  }

  const sayap = {};
  [-1, 1].forEach((s) => {
    const g = new THREE.Group();
    g.position.set(0.36 * s, 0.4, -0.02);
    const m = bola(0.27, B.badan, 18, 14);
    m.scale.set(0.3, 0.55, 0.95);
    m.position.set(0.05 * s, -0.08, -0.04);
    g.add(m);
    akar.add(g);
    sayap[s > 0 ? 'kanan' : 'kiri'] = g;
  });

  // buih air keliling badan (tidak ikut naik-turun)
  const buih = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 28), B.buih);
  buih.rotation.x = Math.PI / 2;
  buih.scale.set(0.92, 1.2, 1);
  buih.position.y = 0.04;
  grup.add(buih);

  bayang(grup);
  buih.castShadow = false;

  function kepak(sudut) {
    sayap.kanan.rotation.z = sudut;
    sayap.kiri.rotation.z = -sudut;
  }

  function pose(mod, t, laju = 1) {
    if (mod === 'menang') {
      buih.visible = false;
      const u = ((t % 0.7) + 0.7) % 0.7 / 0.7;
      const lompat = Math.sin(u * Math.PI);
      akar.position.set(0, 0.55 * lompat, 0);
      akar.rotation.set(-0.1, Math.sin(t * 2.5) * 0.5, 0);
      kepala.rotation.set(-0.35 * lompat, 0, 0.15 * Math.sin(t * 6));
      kepak(1.2 + 0.5 * Math.sin(t * 22));
      return;
    }
    buih.visible = true;
    if (mod === 'lari' || mod === 'jogging') {
      const kuat = mod === 'lari' ? 1 : 0.4;
      const f = (mod === 'lari' ? 3.2 : 1.6) * laju;
      const ph = TAU * f * t;
      akar.position.set(0, 0.045 * Math.sin(ph) * kuat, 0);
      akar.rotation.set(-0.12 * kuat, 0, 0.09 * Math.sin(ph / 2) * kuat);
      kepala.position.z = 0.26 + 0.05 * Math.sin(ph) * kuat;
      kepala.rotation.set(0.1 * kuat, 0, 0);
      kepak(mod === 'lari' ? 0.35 + 0.75 * (0.5 + 0.5 * Math.sin(ph * 2.2)) : 0.12);
      buih.scale.set(0.92 + 0.08 * kuat * Math.sin(ph), 1.2 + 0.25 * kuat, 1);
      return;
    }
    // sedia: terapung, toleh kiri kanan
    akar.position.set(0, 0.025 * Math.sin(t * 2), 0);
    akar.rotation.set(0, 0, 0.04 * Math.sin(t * 1.3));
    kepala.position.z = 0.26;
    kepala.rotation.set(0.05 * Math.sin(t * 2.6), 0.4 * Math.sin(t * 0.8), 0);
    kepak(0.08 + 0.05 * Math.sin(t * 3));
    buih.scale.set(0.92, 1.2, 1);
  }

  return { jenis: 'itik', grup, pose };
}

/* ══════════════════════════ BURUNG ══════════════════════════ */

export function buatBurung(p) {
  const w = cariWarna(p.warna);
  const perempuan = p.jantina === 'perempuan';
  const B = {
    ...bahanMata(),
    badan: std(hsl(w.hue, w.sat, 0.52), 0.6),
    gelap: std(hsl(w.hue, w.sat, 0.36), 0.6),
    perut: std('#FFF3DC', 0.75),
    paruh: std('#FFB21F', 0.4),
    kaki: std('#F28C28', 0.5),
    pipi: new THREE.MeshStandardMaterial({ color: '#FF8C8C', roughness: 0.9, transparent: true, opacity: 0.45 }),
  };

  const grup = new THREE.Group();
  const akar = new THREE.Group();
  grup.add(akar);

  const tubuh = bola(0.5, B.badan, 30, 22);
  tubuh.scale.set(0.95, 0.92, 1.0);
  tubuh.position.y = 0.62;
  const perut = bola(0.4, B.perut, 24, 18);
  perut.scale.set(0.85, 0.8, 0.55);
  perut.position.set(0, 0.5, 0.27);
  akar.add(tubuh, perut);

  const muka = new THREE.Group();
  muka.position.set(0, 0.7, 0);
  akar.add(muka);
  [-1, 1].forEach((s) => {
    const m = buatMata(0.135, B, { sisi: s, bulu: perempuan });
    m.position.set(0.17 * s, 0.07, 0.37);
    m.rotation.y = 0.33 * s;
    m.scale.set(1, 1.1, 0.78);
    muka.add(m);
    const pipi = bola(0.075, B.pipi, 12, 8);
    pipi.scale.set(1.2, 0.7, 0.3);
    pipi.position.set(0.3 * s, -0.1, 0.33);
    pipi.rotation.y = 0.75 * s;
    muka.add(pipi);
    const kening = kapsul(0.022, 0.1, B.gelap);
    kening.position.set(0.17 * s, 0.24, 0.42);
    kening.rotation.set(0, 0, Math.PI / 2 + 0.3 * s);
    muka.add(kening);
  });
  const paruh = bola(0.1, B.paruh, 16, 10);
  paruh.scale.set(1.05, 0.62, 1.4);
  paruh.position.set(0, -0.07, 0.49);
  const paruhB = bola(0.07, B.paruh, 12, 8);
  paruhB.scale.set(1, 0.5, 1.2);
  paruhB.position.set(0, -0.12, 0.46);
  muka.add(paruh, paruhB);

  if (perempuan) {
    const r = buatReben();
    r.position.set(0.16, 0.42, 0.12);
    r.rotation.set(0, 0.2, -0.5);
    muka.add(r);
  } else {
    [[-0.06, 0.25], [0, 0], [0.06, -0.25]].forEach(([x, c], i) => {
      const j = kapsulArah(0.045, 0.14 + (i === 1 ? 0.06 : 0), B.gelap,
        new THREE.Vector3(x, 0.4, 0.05), new THREE.Vector3(c, 1, -0.5));
      muka.add(j);
    });
  }

  // ekor kipas
  const ekor = new THREE.Group();
  ekor.position.set(0, 0.6, -0.42);
  [-0.38, 0, 0.38].forEach((a) => {
    const b = bola(0.14, B.gelap, 14, 10);
    b.scale.set(0.55, 0.18, 1.4);
    b.position.set(Math.sin(a) * 0.12, 0, -0.16);
    b.rotation.y = a;
    ekor.add(b);
  });
  ekor.rotation.x = -0.35;
  akar.add(ekor);

  // sayap: memanjang ke luar paksi X, berpangsi di bahu
  const sayap = {};
  [-1, 1].forEach((s) => {
    const g = new THREE.Group();
    g.position.set(0.4 * s, 0.68, -0.02);
    const m = bola(0.3, B.badan, 18, 12);
    m.scale.set(1.2, 0.2, 0.7);
    m.position.set(0.3 * s, 0, -0.04);
    const hujung = bola(0.19, B.gelap, 14, 10);
    hujung.scale.set(1.25, 0.17, 0.6);
    hujung.position.set(0.6 * s, 0, -0.08);
    g.add(m, hujung);
    akar.add(g);
    sayap[s > 0 ? 'kanan' : 'kiri'] = g;
  });

  const kaki = new THREE.Group();
  [-1, 1].forEach((s) => {
    const k = kapsul(0.035, 0.12, B.kaki);
    k.position.set(0.13 * s, 0.12, 0.04);
    const jari = bola(0.05, B.kaki, 10, 8);
    jari.scale.set(1, 0.4, 1.4);
    jari.position.set(0.13 * s, 0.03, 0.08);
    kaki.add(k, jari);
  });
  akar.add(kaki);

  bayang(grup);

  function kepak(sudut) {
    sayap.kanan.rotation.z = sudut;
    sayap.kiri.rotation.z = -sudut;
  }

  function pose(mod, t, laju = 1) {
    if (mod === 'lari' || mod === 'jogging') {
      const kuat = mod === 'lari' ? 1 : 0.55;
      const f = (mod === 'lari' ? 4.2 : 2.6) * laju;
      const ph = TAU * f * t;
      const k = Math.sin(ph);
      kepak(0.25 + 0.85 * k * kuat);
      akar.position.set(0, -0.09 * k * kuat, 0);
      akar.rotation.set(-0.28 * kuat, 0, 0.06 * Math.sin(ph / 3));
      ekor.rotation.x = -0.15 + 0.1 * Math.sin(ph + 1);
      kaki.rotation.x = 1.1; // kaki dilipat semasa terbang
      kaki.position.set(0, 0.12, -0.1);
      muka.rotation.set(0.22 * kuat, 0, 0);
      return;
    }
    kaki.rotation.x = 0;
    kaki.position.set(0, 0, 0);
    if (mod === 'menang') {
      const u = ((t % 0.6) + 0.6) % 0.6 / 0.6;
      const lompat = Math.sin(u * Math.PI);
      akar.position.set(0, 0.45 * lompat, 0);
      akar.rotation.set(0, Math.sin(t * 2.4) * 0.6, 0);
      kepak(0.9 + 0.6 * Math.sin(t * 24));
      ekor.rotation.x = -0.6 + 0.2 * Math.sin(t * 12);
      muka.rotation.set(-0.25 * lompat, 0, 0.12 * Math.sin(t * 5));
      return;
    }
    // sedia: berdiri di tanah, sayap dilipat, melompat kecil
    const lompat = Math.pow(Math.max(0, Math.sin(t * 3.6)), 2);
    akar.position.set(0, 0.08 * lompat, 0);
    akar.rotation.set(0, 0, 0);
    kepak(-1.15 + 0.08 * Math.sin(t * 2));
    ekor.rotation.x = -0.35 + 0.1 * Math.sin(t * 3);
    muka.rotation.set(0, 0, 0.18 * Math.sin(t * 1.4));
  }

  return { jenis: 'burung', grup, pose };
}

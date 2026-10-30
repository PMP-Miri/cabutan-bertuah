/**
 * kenderaan.js — Watak tema KENDERAAN untuk Wira Pecut (Three.js tulen).
 *   buatBot(p)   : bot laju; badan ikut warna pilihan peserta
 *   buatRoket(p) : roket angkasa; badan ikut warna pilihan
 *   buatJet(p)   : jet pejuang; badan ikut warna pilihan
 *
 * Setiap fungsi memulangkan { jenis, grup, pose(mod, t, laju) }
 *   mod = 'sedia' | 'lari' | 'jogging' | 'menang'
 * Semua pose dipandu masa (saat) — selamat untuk penyegerakan peranti.
 * Kenderaan menghadap +Z (sama seperti semua watak lain).
 *
 * Nota prestasi: tiada sistem zarah. Kesan semburan/api/asap ialah bola &
 * kon biasa yang hanya diubah skala — murah untuk laptop booth.
 */
import * as THREE from 'three';
import { hsl, cariWarna, benih, kapsul, std } from './watak.js';

const bola = (r, m, ws = 18, hs = 12) => new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m);
const TAU = Math.PI * 2;
const klip = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

function bayang(grup) {
  grup.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
}

/** Bahan bercahaya (api, lampu, semburan) — tidak menerima bayang. */
function sinar(warna, kuat = 1.1, lut = 0.9) {
  return new THREE.MeshStandardMaterial({
    color: warna, emissive: warna, emissiveIntensity: kuat,
    roughness: 0.4, transparent: true, opacity: lut,
  });
}

/** Kanopi/cermin lutsinar kebiruan. */
function kaca() {
  return new THREE.MeshStandardMaterial({
    // metalness rendah: tiada peta persekitaran dalam adegan ini, jadi
    // nilai tinggi akan menjadikan permukaan HITAM, bukan berkilat.
    color: '#9FD8FF', emissive: '#2B4A6B', emissiveIntensity: 0.3,
    roughness: 0.18, metalness: 0.08, transparent: true, opacity: 0.6,
  });
}

/** Palet asas daripada warna pilihan peserta. */
function palet(p) {
  const w = cariWarna(p.warna);
  return {
    utama: std(hsl(w.hue, w.sat, 0.52), 0.45),
    gelap: std(hsl(w.hue, w.sat, 0.34), 0.5),
    cerah: std(hsl(w.hue, Math.min(1, w.sat * 1.15), 0.66), 0.4),
    putih: std('#F4F7FB', 0.55),
    kelabu: std('#AFB7C2', 0.5),
    // Lihat nota di kaca(): metalness tinggi tanpa envMap = hitam pekat.
    // Muncung enjin perlu kelihatan kelabu logam, bukan lubang hitam.
    logam: new THREE.MeshStandardMaterial({ color: '#B9C2CE', roughness: 0.45, metalness: 0.2 }),
    hitam: std('#23272E', 0.6),
  };
}

/* ══════════════════════════ BOT ══════════════════════════ */

export function buatBot(p) {
  const B = palet(p);
  B.semburan = new THREE.MeshStandardMaterial({
    color: '#FFFFFF', emissive: '#DFF2FF', emissiveIntensity: 0.5,
    roughness: 0.9, transparent: true, opacity: 0.72,
  });

  const grup = new THREE.Group();
  const akar = new THREE.Group();   // badan bot (boleh anggul/senget)
  grup.add(akar);

  // ── Badan: kapsul pipih + haluan tirus ──
  const badan = new THREE.Group();
  badan.position.y = 0.3;
  akar.add(badan);

  const lambung = kapsul(0.3, 0.72, B.utama);
  lambung.rotation.x = Math.PI / 2;
  lambung.scale.set(1, 1, 0.52);        // pipih (lebar X, cetek Y)
  badan.add(lambung);

  // haluan tajam
  const haluan = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.62, 18), B.utama);
  haluan.rotation.x = Math.PI / 2;
  haluan.scale.set(1, 1, 0.52);
  haluan.position.z = 0.82;
  badan.add(haluan);

  // dek atas (putih) + jalur warna di sisi
  const dek = bola(0.29, B.putih, 20, 12);
  dek.scale.set(0.96, 0.3, 2.0);
  dek.position.set(0, 0.12, 0.08);
  badan.add(dek);
  [-1, 1].forEach((s) => {
    const jalur = bola(0.3, B.cerah, 16, 10);
    jalur.scale.set(0.3, 0.18, 1.95);
    jalur.position.set(0.22 * s, 0.0, 0.05);
    badan.add(jalur);
  });

  // kokpit: cermin depan + tempat duduk
  const cermin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.18, 16, 1, true, Math.PI * 0.1, Math.PI * 0.8), kaca());
  cermin.position.set(0, 0.26, 0.2);
  cermin.rotation.y = Math.PI;
  badan.add(cermin);
  // Tempat duduk: kelabu gelap, BUKAN hitam. Hitam pekat kelihatan seperti
  // lubang pada dek putih bila dilihat dari jauh di projektor.
  const kusyen = std('#7C8798', 0.75);
  const tempatDuduk = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.18), kusyen);
  tempatDuduk.position.set(0, 0.19, -0.02);
  badan.add(tempatDuduk);
  const sandaran = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.06), kusyen);
  sandaran.position.set(0, 0.25, -0.11);
  badan.add(sandaran);

  // enjin luar di belakang
  const enjin = new THREE.Group();
  enjin.position.set(0, 0.06, -0.92);
  const kotakEnjin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.18), B.gelap);
  const kakiEnjin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), B.kelabu);
  kakiEnjin.position.y = -0.2;
  enjin.add(kotakEnjin, kakiEnjin);
  badan.add(enjin);

  // ── Semburan: dinding air "V" di belakang + percikan sisi ──
  const semburan = new THREE.Group();
  grup.add(semburan);
  const ekorAir = [];
  for (let i = 0; i < 9; i++) {
    const b = bola(0.16, B.semburan, 12, 8);
    const d = i / 8;
    b.position.set(0, 0.02, -1.1 - d * 1.5);
    b.scale.setScalar(0.5 + d * 1.1);
    semburan.add(b);
    ekorAir.push(b);
  }
  const sayapAir = [];
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 5; i++) {
      const b = bola(0.13, B.semburan, 10, 8);
      const d = i / 4;
      b.position.set((0.3 + d * 0.75) * s, 0.02 + d * 0.3, 0.1 - d * 1.0);
      b.scale.setScalar(0.45 + d * 0.5);
      semburan.add(b);
      sayapAir.push(b);
    }
  });

  bayang(grup);
  semburan.traverse((o) => { if (o.isMesh) o.castShadow = false; });

  function kesan(kuat) {
    semburan.visible = kuat > 0.02;
    if (!semburan.visible) return;
    ekorAir.forEach((b, i) => { b.scale.setScalar((0.5 + (i / 8) * 1.1) * kuat); });
    sayapAir.forEach((b, i) => { b.scale.setScalar((0.45 + ((i % 5) / 4) * 0.5) * kuat); });
  }

  function pose(mod, t, laju = 1) {
    if (mod === 'menang') {
      // melompat atas ombak sambil berpusing
      const u = ((t % 1.1) + 1.1) % 1.1 / 1.1;
      const lompat = Math.sin(u * Math.PI);
      akar.position.set(0, 0.75 * lompat, 0);
      akar.rotation.set(-0.45 * lompat, Math.sin(t * 2.2) * 0.65, 0.18 * Math.sin(t * 4));
      kesan(0.4 + 0.5 * lompat);
      semburan.rotation.y = akar.rotation.y;
      return;
    }
    semburan.rotation.y = 0;
    if (mod === 'lari' || mod === 'jogging') {
      const kuat = mod === 'lari' ? 1 : 0.42;
      const f = (mod === 'lari' ? 2.6 : 1.5) * laju;
      const ph = TAU * f * t;
      // "planing": haluan terangkat, melantun atas ombak
      akar.rotation.set(-0.17 * kuat + 0.05 * Math.sin(ph) * kuat, 0, 0.1 * Math.sin(ph * 0.7) * kuat);
      akar.position.set(0, 0.06 * Math.sin(ph) * kuat, 0);
      enjin.rotation.x = 0.06 * Math.sin(ph * 3);
      kesan(kuat * (0.85 + 0.15 * Math.sin(ph * 2)));
      return;
    }
    // sedia: terapung perlahan
    akar.position.set(0, 0.03 * Math.sin(t * 1.8), 0);
    akar.rotation.set(0.02 * Math.sin(t * 1.4), 0, 0.05 * Math.sin(t * 1.1));
    enjin.rotation.x = 0;
    kesan(0.14);
  }

  return { jenis: 'bot', grup, pose };
}

/* ══════════════════════════ ROKET ══════════════════════════ */

export function buatRoket(p) {
  const B = palet(p);
  const rnd = benih('roket' + (p.seed ?? p.warna));

  const grup = new THREE.Group();
  const akar = new THREE.Group();
  grup.add(akar);

  // Roket BARING menghadap +Z (semua watak menghadap +Z).
  const badan = new THREE.Group();
  badan.position.y = 0.55;
  akar.add(badan);

  const tiub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 1.25, 22), B.putih);
  tiub.rotation.x = Math.PI / 2;
  badan.add(tiub);

  // jalur warna peserta di tengah badan
  const jalur = new THREE.Mesh(new THREE.CylinderGeometry(0.283, 0.283, 0.3, 22), B.utama);
  jalur.rotation.x = Math.PI / 2;
  jalur.position.z = -0.1;
  badan.add(jalur);
  const jalur2 = new THREE.Mesh(new THREE.CylinderGeometry(0.287, 0.287, 0.08, 22), B.cerah);
  jalur2.rotation.x = Math.PI / 2;
  jalur2.position.z = 0.26;
  badan.add(jalur2);

  // kon hidung
  const hidung = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.56, 22), B.utama);
  hidung.rotation.x = Math.PI / 2;
  hidung.position.z = 0.9;
  badan.add(hidung);

  // tingkap bulat
  const bingkai = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 10, 20), B.logam);
  bingkai.position.set(0, 0.1, 0.42);
  bingkai.rotation.x = -0.35;
  const tingkap = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), kaca());
  tingkap.position.set(0, 0.105, 0.43);
  tingkap.rotation.x = -0.35;
  badan.add(bingkai, tingkap);

  // 4 sirip
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const sirip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.44, 4), B.gelap);
    sirip.scale.set(0.35, 1, 1);
    sirip.position.set(Math.cos(a) * 0.3, Math.sin(a) * 0.3, -0.5);
    sirip.rotation.z = a - Math.PI / 2;
    sirip.rotation.x = Math.PI / 2;
    badan.add(sirip);
  }

  // muncung + api
  const muncung = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.2, 20), B.kelabu);
  muncung.rotation.x = Math.PI / 2;
  muncung.position.z = -0.72;
  badan.add(muncung);

  const api = new THREE.Group();
  api.position.set(0, 0.55, -0.84);
  akar.add(api);
  const apiLuar = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.0, 16), sinar('#FF8A1F', 1.3, 0.62));
  apiLuar.rotation.x = Math.PI / 2;
  apiLuar.position.z = -0.5;
  const apiDalam = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.62, 14), sinar('#FFE9A3', 1.6, 0.95));
  apiDalam.rotation.x = Math.PI / 2;
  apiDalam.position.z = -0.32;
  api.add(apiLuar, apiDalam);

  // asap di belakang
  const asapM = new THREE.MeshStandardMaterial({
    color: '#E8ECF2', emissive: '#C9D3DE', emissiveIntensity: 0.3,
    roughness: 1, transparent: true, opacity: 0.5,
  });
  const asap = [];
  for (let i = 0; i < 7; i++) {
    const b = bola(0.2, asapM, 10, 8);
    const d = i / 6;
    b.position.set((rnd() - 0.5) * 0.3, 0.55 + (rnd() - 0.5) * 0.2, -1.5 - d * 1.9);
    b.scale.setScalar(0.5 + d * 1.2);
    akar.add(b);
    asap.push({ m: b, d });
  }

  bayang(grup);
  api.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  asap.forEach((x) => { x.m.castShadow = false; });

  function kesan(kuat, t) {
    api.visible = kuat > 0.02;
    const kerdip = 1 + 0.16 * Math.sin(t * 34);
    apiLuar.scale.set(1, 1, kuat * kerdip);
    apiDalam.scale.set(1, 1, kuat * (1 + 0.22 * Math.sin(t * 47)));
    asap.forEach((x) => {
      x.m.visible = kuat > 0.3;
      x.m.scale.setScalar((0.5 + x.d * 1.2) * kuat);
    });
  }

  function pose(mod, t, laju = 1) {
    if (mod === 'menang') {
      // Melayang berlepas sambil berpusing. JANGAN tegak 90°: api sepanjang
      // ~1.8 unit akan masuk ke dalam podium dan langsung tidak kelihatan.
      // Senget ~66° + naik sedikit = api terpancar jelas di bawah-belakang.
      const naik = 0.95 + 0.2 * Math.sin(t * 2.4);
      akar.position.set(0, naik, 0);
      akar.rotation.set(-1.15 + 0.06 * Math.sin(t * 3), t * 1.5, 0);
      kesan(1.25, t);
      return;
    }
    if (mod === 'lari' || mod === 'jogging') {
      const kuat = mod === 'lari' ? 1 : 0.4;
      const f = (mod === 'lari' ? 1.7 : 1.0) * laju;
      const ph = TAU * f * t;
      akar.position.set(0, 0.1 * Math.sin(ph) * kuat, 0);
      akar.rotation.set(-0.06 * kuat, 0.05 * Math.sin(ph * 0.6) * kuat, 0.12 * Math.sin(ph * 0.8) * kuat);
      kesan(0.45 + 0.75 * kuat, t);
      return;
    }
    // sedia: terapung perlahan, api kecil
    akar.position.set(0, 0.05 * Math.sin(t * 1.5), 0);
    akar.rotation.set(0, 0, 0.04 * Math.sin(t * 1.2));
    kesan(0.3, t);
  }

  return { jenis: 'roket', grup, pose };
}

/* ══════════════════════════ JET ══════════════════════════ */

export function buatJet(p) {
  const B = palet(p);

  const grup = new THREE.Group();
  const akar = new THREE.Group();
  grup.add(akar);

  const badan = new THREE.Group();
  badan.position.y = 0.6;
  akar.add(badan);

  // fiuslaj
  const fius = kapsul(0.22, 0.75, B.putih);
  fius.rotation.x = Math.PI / 2;
  badan.add(fius);
  const hidung = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.62, 18), B.putih);
  hidung.rotation.x = Math.PI / 2;
  hidung.position.z = 0.88;
  badan.add(hidung);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 10), B.hitam);
  tip.rotation.x = Math.PI / 2;
  tip.position.z = 1.26;
  badan.add(tip);

  // sayap delta (segi tiga leper)
  [-1, 1].forEach((s) => {
    const sayap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.15, 3), B.utama);
    sayap.rotation.set(Math.PI / 2, 0, -Math.PI / 2 * s);
    sayap.scale.set(1, 1, 0.1);           // nipis pada paksi Y selepas putaran
    sayap.position.set(0.62 * s, 0, -0.08);
    badan.add(sayap);
    // hujung sayap warna cerah
    const hujung = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.34), B.cerah);
    hujung.position.set(1.12 * s, 0, -0.2);
    badan.add(hujung);
  });

  // sayap ekor + sirip tegak
  [-1, 1].forEach((s) => {
    const ekor = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 3), B.utama);
    ekor.rotation.set(Math.PI / 2, 0, -Math.PI / 2 * s);
    ekor.scale.set(1, 1, 0.1);
    ekor.position.set(0.28 * s, 0.02, -0.72);
    badan.add(ekor);
  });
  const sirip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 3), B.gelap);
  sirip.scale.set(1, 1, 0.08);
  sirip.rotation.x = Math.PI / 2;
  sirip.position.set(0, 0.3, -0.7);
  badan.add(sirip);

  // kanopi
  const kanopi = bola(0.19, kaca(), 18, 12);
  kanopi.scale.set(0.85, 0.72, 1.7);
  kanopi.position.set(0, 0.16, 0.3);
  badan.add(kanopi);

  // muncung enjin + nyala
  const muncung = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.22, 18), B.logam);
  muncung.rotation.x = Math.PI / 2;
  muncung.position.z = -0.92;
  badan.add(muncung);

  const nyala = new THREE.Group();
  nyala.position.set(0, 0.6, -1.04);
  akar.add(nyala);
  const nyalaLuar = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.78, 14), sinar('#5FA8FF', 1.2, 0.55));
  nyalaLuar.rotation.x = Math.PI / 2;
  nyalaLuar.position.z = -0.39;
  const nyalaDalam = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.44, 12), sinar('#FFF3C4', 1.6, 0.92));
  nyalaDalam.rotation.x = Math.PI / 2;
  nyalaDalam.position.z = -0.22;
  nyala.add(nyalaLuar, nyalaDalam);

  // kontrel (contrail) putih di hujung sayap
  const kontrelM = new THREE.MeshStandardMaterial({
    color: '#FFFFFF', emissive: '#EAF4FF', emissiveIntensity: 0.45,
    roughness: 1, transparent: true, opacity: 0.4,
  });
  const kontrel = [];
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 6; i++) {
      const d = i / 5;
      const b = bola(0.1, kontrelM, 8, 6);
      b.position.set(1.12 * s, 0.6, -0.5 - d * 2.2);
      b.scale.setScalar(0.4 + d * 0.9);
      akar.add(b);
      kontrel.push({ m: b, d });
    }
  });

  bayang(grup);
  nyala.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  kontrel.forEach((x) => { x.m.castShadow = false; });

  function kesan(kuat, t) {
    nyala.visible = kuat > 0.02;
    nyalaLuar.scale.set(1, 1, kuat * (1 + 0.18 * Math.sin(t * 40)));
    nyalaDalam.scale.set(1, 1, kuat * (1 + 0.25 * Math.sin(t * 55)));
    kontrel.forEach((x) => {
      x.m.visible = kuat > 0.45;
      x.m.scale.setScalar((0.4 + x.d * 0.9) * klip(kuat, 0, 1.2));
    });
  }

  function pose(mod, t, laju = 1) {
    if (mod === 'menang') {
      // Terbang lintas kemenangan: hidung menanjak, senget perlahan,
      // berpusing supaya semua penonton nampak.
      // JANGAN gulung tong penuh: sayap (rentang ~2.2) akan mencucuk masuk
      // ke dalam podium kerana offset badan turut berputar bersama akar.
      const naik = 1.25 + 0.18 * Math.sin(t * 2.2);
      akar.position.set(0, naik, 0);
      akar.rotation.set(-0.35, t * 1.4, 0.25 * Math.sin(t * 3));
      kesan(1.2, t);
      return;
    }
    if (mod === 'lari' || mod === 'jogging') {
      const kuat = mod === 'lari' ? 1 : 0.4;
      const f = (mod === 'lari' ? 1.1 : 0.7) * laju;
      const ph = TAU * f * t;
      // senget masuk selekoh + anggul halus
      akar.position.set(0, 0.09 * Math.sin(ph) * kuat, 0);
      akar.rotation.set(-0.05 * kuat, 0, 0.3 * Math.sin(ph * 0.5) * kuat);
      kesan(0.5 + 0.7 * kuat, t);
      return;
    }
    // sedia: melayang tenang
    akar.position.set(0, 0.04 * Math.sin(t * 1.6), 0);
    akar.rotation.set(0, 0, 0.07 * Math.sin(t * 1.1));
    kesan(0.32, t);
  }

  return { jenis: 'jet', grup, pose };
}

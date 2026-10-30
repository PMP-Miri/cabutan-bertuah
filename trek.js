/* trek.js — Stadium 3D Wira Pecut (Three.js tulen, tiada fail luar).
 * Trek bujur: garis mula = garis penamat (x = 0, sisi z positif),
 * jadi setiap pusingan bersambung terus dengan pusingan seterusnya.
 */
import * as THREE from 'three';

export const TREK = { L: 34, R: 15, W: 0.95, LORONG: 12 };

/* ── Laluan ── */
function jejariLorong(lorong) { return TREK.R + (lorong + 0.5) * TREK.W; }

/** Kedudukan pada lorong untuk kemajuan p (0..1 = satu pusingan, boleh > 1). */
export function titik(p, lorong) {
  const L = TREK.L, Rl = jejariLorong(lorong);
  const per = 2 * L + 2 * Math.PI * Rl;
  let s = (((p % 1) + 1) % 1) * per;
  const out = new THREE.Vector3();
  let arah = 0; // sudut rotation.y (watak menghadap +Z asal)
  const seg = [L / 2, Math.PI * Rl, L, Math.PI * Rl, L / 2];
  if (s < seg[0]) { out.set(s, 0, Rl); arah = Math.PI / 2; return { pos: out, arah }; }
  s -= seg[0];
  if (s < seg[1]) {
    const th = s / Rl;
    out.set(L / 2 + Rl * Math.sin(th), 0, Rl * Math.cos(th));
    arah = Math.PI / 2 + th; return { pos: out, arah };
  }
  s -= seg[1];
  if (s < seg[2]) { out.set(L / 2 - s, 0, -Rl); arah = -Math.PI / 2; return { pos: out, arah }; }
  s -= seg[2];
  if (s < seg[3]) {
    const th = s / Rl;
    out.set(-L / 2 - Rl * Math.sin(th), 0, -Rl * Math.cos(th));
    arah = -Math.PI / 2 + th; return { pos: out, arah };
  }
  s -= seg[3];
  out.set(-L / 2 + s, 0, Rl); arah = Math.PI / 2;
  return { pos: out, arah };
}

/* ── Laluan MENEGAK untuk roket (lokasi 'angkasa') ──
   12 pad pelancaran berbaris di paksi X; roket naik lurus ke atas.
   p = 0 di atas pad, p = 1 di garisan angkasa (y = H). */
export const ANGKASA = { H: 90, JARAK: 2.0 };
export function titikAngkasa(p, lorong) {
  const x = (lorong - (TREK.LORONG - 1) / 2) * ANGKASA.JARAK;
  return { pos: new THREE.Vector3(x, Math.max(0, p) * ANGKASA.H, 0), arah: 0 };
}

/* ── Pembantu ── */
function bentukBujur(r, seg = 48) {
  const L = TREK.L, s = new THREE.Shape();
  s.moveTo(-L / 2, r);
  s.lineTo(L / 2, r);
  s.absarc(L / 2, 0, r, Math.PI / 2, -Math.PI / 2, true);
  s.lineTo(-L / 2, -r);
  s.absarc(-L / 2, 0, r, -Math.PI / 2, Math.PI / 2, true);
  return s;
}
function bentukCincin(rLuar, rDalam) {
  const s = bentukBujur(rLuar);
  const lubang = new THREE.Path();
  const L = TREK.L;
  lubang.moveTo(-L / 2, rDalam);
  lubang.absarc(-L / 2, 0, rDalam, Math.PI / 2, -Math.PI / 2, false);
  lubang.lineTo(L / 2, -rDalam);
  lubang.absarc(L / 2, 0, rDalam, -Math.PI / 2, Math.PI / 2, false);
  s.holes.push(lubang);
  return s;
}
function cincin(rLuar, rDalam, bahan, y) {
  const s = bentukCincin(rLuar, rDalam);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 64), bahan);
  m.rotation.x = -Math.PI / 2; // Shape XY → lantai XZ (bujur simetri, jadi arah z tidak penting)
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}
function teksturKanvas(w, h, lukis) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  lukis(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ── Stadium ── */
export function buatStadium(scene, { tajuk = 'WIRA PECUT' } = {}) {
  const kumpulan = new THREE.Group();
  scene.add(kumpulan);

  // langit (latar skrin)
  scene.background = teksturKanvas(16, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3E8EEA'); gr.addColorStop(0.55, '#8CC4F5'); gr.addColorStop(1, '#E9F4FF');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  scene.fog = new THREE.Fog('#CFE6FA', 70, 170);

  // rumput berjalur — warnanya ditukar oleh setTema()
  const rumputWarna = ['#5FAE4E', '#6BBB58'];
  const lukisRumput = (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? rumputWarna[0] : rumputWarna[1];
      g.fillRect(0, (i * h) / 8, w, h / 8);
    }
  };
  const rumputKanvas = document.createElement('canvas');
  rumputKanvas.width = rumputKanvas.height = 256;
  lukisRumput(rumputKanvas.getContext('2d'), 256, 256);
  const rumputT = new THREE.CanvasTexture(rumputKanvas);
  rumputT.colorSpace = THREE.SRGBColorSpace;
  rumputT.anisotropy = 8;
  rumputT.wrapS = rumputT.wrapT = THREE.RepeatWrapping;
  rumputT.repeat.set(10, 10);
  const bahanRumput = new THREE.MeshStandardMaterial({ map: rumputT, roughness: 0.95 });
  const rumput = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), bahanRumput);
  rumput.rotation.x = -Math.PI / 2;
  rumput.receiveShadow = true;
  kumpulan.add(rumput);

  // trek — dikumpul dalam `trekAsas` supaya boleh disorok (lokasi angkasa
  // guna laluan menegak, bukan bujur)
  const trekAsas = new THREE.Group();
  kumpulan.add(trekAsas);
  const rDalam = TREK.R, rLuar = TREK.R + TREK.LORONG * TREK.W;
  const bahanPinggir = new THREE.MeshStandardMaterial({ color: '#E9E4D8', roughness: 0.9 });
  const bahanTrek = new THREE.MeshStandardMaterial({ color: '#2F64C9', roughness: 0.92 });
  trekAsas.add(cincin(rLuar + 0.6, rDalam - 0.4, bahanPinggir, 0.01));
  trekAsas.add(cincin(rLuar, rDalam, bahanTrek, 0.02));
  const putih = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.7 });
  for (let i = 0; i <= TREK.LORONG; i++) {
    const r = rDalam + i * TREK.W;
    trekAsas.add(cincin(r + 0.035, r - 0.035, putih, 0.03));
  }

  // garis penamat berpetak
  const petakT = teksturKanvas(64, 512, (g, w, h) => {
    const n = 4, sz = w / n;
    for (let y = 0; y < h / sz; y++) for (let x = 0; x < n; x++) {
      g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * sz, y * sz, sz, sz);
    }
  });
  const penamat = new THREE.Mesh(new THREE.PlaneGeometry(0.9, rLuar - rDalam), new THREE.MeshStandardMaterial({ map: petakT, roughness: 0.8 }));
  penamat.rotation.x = -Math.PI / 2;
  penamat.position.set(0, 0.04, (rLuar + rDalam) / 2);
  penamat.receiveShadow = true;
  trekAsas.add(penamat);

  // gerbang penamat
  const tiangB = new THREE.MeshStandardMaterial({ color: '#F3C43F', roughness: 0.4, metalness: 0.3 });
  [rDalam - 0.9, rLuar + 0.9].forEach((z) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 5.4, 16), tiangB);
    t.position.set(0, 2.7, z); t.castShadow = true; trekAsas.add(t);
  });
  const panjang = rLuar - rDalam + 1.8;
  const panjiT = teksturKanvas(1024, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#E8432F'); gr.addColorStop(0.5, '#F28C28'); gr.addColorStop(1, '#E8432F');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = '900 78px Poppins, Montserrat, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('🏁  PENAMAT  🏁', w / 2, h / 2 + 4);
  });
  // BoxGeometry susunan muka: [+x, −x, +y, −y, +z, −z]; teks pada kedua-dua muka X
  const bahanPanji = new THREE.MeshStandardMaterial({ map: panjiT, roughness: 0.6 });
  const panji = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.1, panjang),
    [bahanPanji, bahanPanji, tiangB, tiangB, tiangB, tiangB]);
  panji.position.set(0, 5.2, (rLuar + rDalam) / 2);
  panji.castShadow = true;
  trekAsas.add(panji);

  // podium juara di padang tengah, berhampiran garis penamat
  const podium = new THREE.Group();
  podium.position.set(-6, 0, rDalam - 5);
  const emas = new THREE.MeshStandardMaterial({ color: '#F2C94C', roughness: 0.35, metalness: 0.45 });
  const tapak = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.7, 40), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.5 }));
  tapak.position.y = 0.35; tapak.castShadow = tapak.receiveShadow = true;
  const gelang = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.08, 12, 60), emas);
  gelang.rotation.x = Math.PI / 2; gelang.position.y = 0.7;
  podium.add(tapak, gelang);
  kumpulan.add(podium);

  // Semua hiasan KHAS stadium (tempat duduk, penonton, bumbung, lampu, bunting)
  // dikumpul supaya boleh disorok bila lokasi = gunung / tasik / awan.
  const hiasStadium = new THREE.Group();
  kumpulan.add(hiasStadium);

  // tempat duduk penonton (dua sisi lurus) + orang ramai (instanced)
  const tempat = new THREE.MeshStandardMaterial({ color: '#D7DDE6', roughness: 0.9 });
  const bumbung = new THREE.MeshStandardMaterial({ color: '#F05A3C', roughness: 0.6 });
  const warnaOrang = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6', '#E67E22', '#1ABC9C', '#FFFFFF', '#FF6FA9', '#34495E'];
  const geoOrang = new THREE.CapsuleGeometry(0.22, 0.3, 4, 8);
  const bahanOrang = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const BARIS = 7, LAJUR = 70;
  const orang = new THREE.InstancedMesh(geoOrang, bahanOrang, BARIS * LAJUR * 2);
  let n = 0;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sk = new THREE.Vector3(1, 1, 1), ps = new THREE.Vector3();
  const warnaC = new THREE.Color();
  const pusatOrang = [];
  [1, -1].forEach((sisi) => {
    const z0 = sisi * (rLuar + 4);
    for (let b = 0; b < BARIS; b++) {
      const anak = new THREE.Mesh(new THREE.BoxGeometry(TREK.L + 24, 0.6, 1.2), tempat);
      anak.position.set(0, 0.3 + b * 0.6, z0 + sisi * b * 1.2);
      anak.receiveShadow = true;
      hiasStadium.add(anak);
      for (let l = 0; l < LAJUR; l++) {
        if (Math.sin(l * 12.9898 + b * 78.233 + sisi) * 43758.5453 % 1 > 0.82) continue; // tempat kosong
        ps.set(-(TREK.L + 22) / 2 + (l / (LAJUR - 1)) * (TREK.L + 22), 0.9 + b * 0.6, z0 + sisi * b * 1.2);
        m4.compose(ps, q, sk);
        orang.setMatrixAt(n, m4);
        warnaC.set(warnaOrang[(l * 7 + b * 3 + (sisi > 0 ? 1 : 0)) % warnaOrang.length]);
        orang.setColorAt(n, warnaC);
        pusatOrang.push(ps.clone());
        n++;
      }
    }
    const atap = new THREE.Mesh(new THREE.BoxGeometry(TREK.L + 26, 0.3, BARIS * 1.2 + 2), bumbung);
    atap.position.set(0, 0.6 * BARIS + 3.2, z0 + sisi * (BARIS * 0.6 - 0.2));
    atap.castShadow = true;
    hiasStadium.add(atap);
  });
  orang.count = n;
  orang.instanceMatrix.needsUpdate = true;
  if (orang.instanceColor) orang.instanceColor.needsUpdate = true;
  hiasStadium.add(orang);

  // menara lampu di empat penjuru
  const kelabu = new THREE.MeshStandardMaterial({ color: '#9AA4B2', roughness: 0.6, metalness: 0.4 });
  const lampu = new THREE.MeshStandardMaterial({ color: '#FFFBE6', emissive: '#FFF3C4', emissiveIntensity: 1.2 });
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
    const g = new THREE.Group();
    g.position.set(sx * (TREK.L / 2 + rLuar + 2), 0, sz * (rLuar + 2));
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 16, 10), kelabu);
    t.position.y = 8;
    const k = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 0.4), lampu);
    k.position.y = 16.5; k.lookAt(0, 0, 0);
    g.add(t, k);
    hiasStadium.add(g);
  });

  // panji-panji bunting di atas tempat duduk
  const geoBendera = new THREE.BufferGeometry();
  geoBendera.setAttribute('position', new THREE.Float32BufferAttribute([-0.35, 0, 0, 0.35, 0, 0, 0, -0.75, 0], 3));
  geoBendera.computeVertexNormals();
  const warnaBendera = ['#E74C3C', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6', '#FF8A3D'];
  const bendera = new THREE.InstancedMesh(geoBendera, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7 }), 160);
  let nb = 0;
  [1, -1].forEach((sisi) => {
    const z = sisi * (rLuar + 2.6);
    for (let i = 0; i < 80; i++) {
      const u = i / 79, x = -(TREK.L + 20) / 2 + u * (TREK.L + 20);
      const y = 4.4 - Math.sin(((u * 4) % 1) * Math.PI) * 0.9;
      m4.compose(ps.set(x, y, z), q, sk);
      bendera.setMatrixAt(nb, m4);
      bendera.setColorAt(nb, warnaC.set(warnaBendera[i % warnaBendera.length]));
      nb++;
    }
  });
  hiasStadium.add(bendera);

  // cahaya
  const hemi = new THREE.HemisphereLight('#D6ECFF', '#8DB36B', 0.9);
  const matahari = new THREE.DirectionalLight('#FFF4E0', 2.0);
  matahari.position.set(18, 30, 22);
  matahari.castShadow = true;
  matahari.shadow.mapSize.set(2048, 2048);
  Object.assign(matahari.shadow.camera, { left: -45, right: 45, top: 35, bottom: -35, near: 1, far: 100 });
  matahari.shadow.bias = -0.0006;
  matahari.shadow.normalBias = 0.02;
  scene.add(hemi, matahari, new THREE.AmbientLight('#ffffff', 0.15));

  // orang ramai bergoyang/melompat (panggil setiap bingkai)
  function kemasOrang(t, teruja = 0) {
    for (let i = 0; i < n; i++) {
      const p = pusatOrang[i];
      const lompat = Math.max(0, Math.sin(t * (6 + (i % 5)) + i * 1.7)) * (0.05 + 0.3 * teruja);
      m4.compose(ps.set(p.x, p.y + lompat, p.z), q, sk);
      orang.setMatrixAt(i, m4);
    }
    orang.instanceMatrix.needsUpdate = true;
  }

  /* ── Tukar kulit mengikut tema ──
     Laluan & podium kekal sama; hanya warna, langit dan kabus berubah,
     serta satu lapisan air berkilat untuk tema itik. */
  const air = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260),
    new THREE.MeshStandardMaterial({
      color: '#2E9BD6', roughness: 0.18, metalness: 0.1,
      transparent: true, opacity: 0.88,
    })
  );
  air.rotation.x = -Math.PI / 2;
  air.position.y = 0.05;
  air.visible = false;
  air.receiveShadow = true;
  kumpulan.add(air);

  const awan = new THREE.Group();
  awan.visible = false;
  kumpulan.add(awan);
  {
    const bahanAwan = new THREE.MeshStandardMaterial({
      color: '#FFFFFF', roughness: 1, transparent: true, opacity: 0.92,
    });
    for (let i = 0; i < 26; i++) {
      const g = new THREE.Group();
      const n2 = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < n2; j++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), bahanAwan);
        b.scale.setScalar(1.1 + Math.random() * 1.3);
        b.position.set((j - n2 / 2) * 1.5, Math.random() * 0.5, Math.random() * 0.8);
        g.add(b);
      }
      const a = (i / 26) * Math.PI * 2;
      const jj = rLuar + 6 + Math.random() * 26;
      g.position.set(Math.cos(a) * jj * 1.3, 3 + Math.random() * 7, Math.sin(a) * jj);
      awan.add(g);
    }
  }

  /* ══════════ LOKASI: Gunung · Tasik · Awan ══════════
     Laluan, garis penamat, gerbang & podium SAMA di semua lokasi (peraturan,
     koreografi & kamera tidak berubah). Hanya persekitaran yang berganti.
     Setiap lokasi dibina sekali sahaja, bila pertama kali dipilih. */
  const rawakL = (benih) => () => { // PRNG kecil supaya pemandangan sama setiap kali
    benih = (benih + 0x6d2b79f5) | 0;
    let t = Math.imul(benih ^ (benih >>> 15), 1 | benih);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /** Titik pada bujur berjejari `rho`, u = 0..1 keliling. */
  function titikBujur(rho, u) {
    const L = TREK.L, per = 2 * L + 2 * Math.PI * rho;
    let s = (((u % 1) + 1) % 1) * per;
    if (s < L) return [-L / 2 + s, rho];
    s -= L;
    if (s < Math.PI * rho) { const th = s / rho; return [L / 2 + rho * Math.sin(th), rho * Math.cos(th)]; }
    s -= Math.PI * rho;
    if (s < L) return [L / 2 - s, -rho];
    s -= L;
    const th = s / rho; return [-L / 2 - rho * Math.sin(th), -rho * Math.cos(th)];
  }
  /** Blok bujur tebal (permukaan atas di y = 0). bahan = [atas/bawah, sisi] */
  function blokBujur(rho, tebal, bahan) {
    const geo = new THREE.ExtrudeGeometry(bentukBujur(rho), { depth: tebal, bevelEnabled: false, curveSegments: 40 });
    const m = new THREE.Mesh(geo, bahan);
    m.rotation.x = -Math.PI / 2;
    m.position.y = -tebal;
    m.receiveShadow = true;
    return m;
  }
  /** Sekumpulan bola (InstancedMesh) — untuk awan, batu, daun teratai… */
  function banyak(geo, bahan, senarai) {
    const im = new THREE.InstancedMesh(geo, bahan, senarai.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    senarai.forEach((x, i) => {
      // ord 'YXZ' = senget dahulu (rx), kemudian pusing arah (ry) — untuk daun/batang kelapa
      e.set(x.rx || 0, x.ry || 0, x.rz || 0, x.ord || 'XYZ'); q.setFromEuler(e);
      m4.compose(new THREE.Vector3(x.x, x.y, x.z), q, new THREE.Vector3(x.sx, x.sy ?? x.sx, x.sz ?? x.sx));
      im.setMatrixAt(i, m4);
      if (x.c) im.setColorAt(i, new THREE.Color(x.c));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.frustumCulled = false;
    return im;
  }
  /** Pokok pain (kon + batang) di senarai kedudukan. */
  function pokok(senarai, warna = '#2F7D3A') {
    const g = new THREE.Group();
    const daun = senarai.flatMap((p) => [
      { x: p.x, y: p.y + 1.6 * p.s, z: p.z, sx: p.s, c: warna },
      { x: p.x, y: p.y + 2.5 * p.s, z: p.z, sx: p.s * 0.72, c: warna },
    ]);
    g.add(banyak(new THREE.ConeGeometry(1.3, 2.2, 8), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), daun));
    g.add(banyak(new THREE.CylinderGeometry(0.18, 0.24, 1.2, 6), new THREE.MeshStandardMaterial({ color: '#6B4A2E', roughness: 1 }),
      senarai.map((p) => ({ x: p.x, y: p.y + 0.6 * p.s, z: p.z, sx: p.s }))));
    g.children.forEach((m) => { m.castShadow = true; });
    return g;
  }
  // kawasan kamera "penamat" (x ≈ −7..10, z ≈ trek luar) — jangan letak pokok/batu di situ
  const halangKamera = (x, z) => z > 0 && x > -14 && x < 16;

  /** Pokok kelapa (batang melengkung + 8 pelepah + buah) — semua instanced. */
  function pokokKelapa(senarai) {
    const g = new THREE.Group();
    const batang = [], daun = [], buah = [];
    senarai.forEach((p, n) => {
      const s = p.s, arah = p.arah ?? n * 2.399;
      let x = p.x, y = p.y, z = p.z;
      for (let i = 0; i < 6; i++) {
        const senget = 0.08 + i * 0.07, panj = 0.75 * s;
        const dx = Math.sin(arah) * Math.sin(senget) * panj, dy = Math.cos(senget) * panj, dz = Math.cos(arah) * Math.sin(senget) * panj;
        batang.push({ x: x + dx / 2, y: y + dy / 2, z: z + dz / 2, sx: s * (1 - i * 0.07), sy: s, sz: s * (1 - i * 0.07), rx: senget, ry: arah, ord: 'YXZ' });
        x += dx; y += dy; z += dz;
      }
      for (let i = 0; i < 8; i++) {
        const phi = (i / 8) * Math.PI * 2 + n, th = 0.45 + (i % 2) * 0.25, L = 1.25 * s;
        daun.push({
          x: x + Math.sin(phi) * Math.cos(th) * L, y: y - Math.sin(th) * L * 0.8 + 0.1 * s, z: z + Math.cos(phi) * Math.cos(th) * L,
          sx: 0.32 * s, sy: 0.05 * s, sz: 1.45 * s, rx: th, ry: phi, ord: 'YXZ', c: i % 2 ? '#3E9B3A' : '#4FB045',
        });
      }
      for (let i = 0; i < 3; i++) {
        const phi = i * 2.1 + n;
        buah.push({ x: x + Math.sin(phi) * 0.2 * s, y: y - 0.22 * s, z: z + Math.cos(phi) * 0.2 * s, sx: 0.17 * s });
      }
    });
    g.add(banyak(new THREE.CylinderGeometry(0.15, 0.19, 0.78, 8), new THREE.MeshStandardMaterial({ color: '#9A7448', roughness: 1, flatShading: true }), batang));
    g.add(banyak(new THREE.SphereGeometry(1, 12, 6), new THREE.MeshStandardMaterial({ roughness: 0.8 }), daun));
    g.add(banyak(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: '#6B4A23', roughness: 0.8 }), buah));
    g.children.forEach((m) => { m.castShadow = true; });
    return g;
  }

  /** Papan teks (kanvas) — untuk sepanduk & tanda ketinggian. */
  function papanTeks(teks, lebar, tinggi, latar = '#E8432F', warnaTeks = '#FFFFFF') {
    const t = teksturKanvas(1024, Math.round(1024 * tinggi / lebar), (c, w, h) => {
      c.fillStyle = latar; c.fillRect(0, 0, w, h);
      c.fillStyle = warnaTeks; c.font = `900 ${Math.round(h * 0.56)}px Poppins, Montserrat, Arial, sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(teks, w / 2, h / 2 + h * 0.03);
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(lebar, tinggi), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
  }

  function buatGunung() {
    const g = new THREE.Group();
    const r = rawakL(11);
    const tepi = rLuar + 11;
    const bahanRumputG = new THREE.MeshStandardMaterial({ color: '#74BF5E', roughness: 0.95 });
    const bahanBatu = new THREE.MeshStandardMaterial({ color: '#8E7F70', roughness: 1, flatShading: true });
    g.add(blokBujur(tepi, 18, [bahanRumputG, bahanBatu]));       // puncak rata (plato)
    // batu kasar di sekeliling bibir plato
    const batu = [];
    for (let i = 0; i < 70; i++) {
      const [x, z] = titikBujur(tepi + 0.4 - r() * 1.2, i / 70 + r() * 0.01);
      const s = 1.4 + r() * 2.6;
      batu.push({ x, y: -1.2 - r() * 4, z, sx: s, sy: s * (0.8 + r() * 0.6), sz: s, rx: r() * 3, ry: r() * 3, c: ['#8E7F70', '#7D6F62', '#A39383'][i % 3] });
    }
    g.add(banyak(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), batu));
    // pokok pain di atas plato (di luar trek)
    const pk = [];
    for (let i = 0; pk.length < 46 && i < 400; i++) {
      const [x, z] = titikBujur(rLuar + 2.5 + r() * (tepi - rLuar - 4), r());
      if (halangKamera(x, z)) continue;
      pk.push({ x, y: 0, z, s: 0.9 + r() * 0.8 });
    }
    g.add(pokok(pk, '#2E7A3C'));
    // lembah jauh di bawah + awan di bawah plato
    const lembah = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: '#5E8F5C', roughness: 1 }));
    lembah.rotation.x = -Math.PI / 2; lembah.position.y = -60;
    g.add(lembah);
    const awanB = [];
    for (let i = 0; i < 160; i++) {
      const a = r() * Math.PI * 2, d = 70 + r() * 110, s = 4 + r() * 6;
      awanB.push({ x: Math.cos(a) * d * 1.3, y: -16 - r() * 6, z: Math.sin(a) * d, sx: s * 1.6, sy: s * 0.6, sz: s });
    }
    g.add(banyak(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, emissive: '#FFFFFF', emissiveIntensity: 0.3 }), awanB));
    // banjaran gunung bersalji di kejauhan
    const bahanPuncak = new THREE.MeshStandardMaterial({ color: '#7A8794', roughness: 1, flatShading: true });
    const salji = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.8, flatShading: true });
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + r() * 0.2, d = 135 + r() * 70;
      const h = 70 + r() * 75, rad = h * (0.6 + r() * 0.25), ry = r() * 3;
      const kon = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 7, 1), bahanPuncak);
      kon.position.set(Math.cos(a) * d * 1.3, -60 + h / 2, Math.sin(a) * d);
      kon.rotation.y = ry;
      const topi = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.3, h * 0.3, 7, 1), salji);
      topi.position.set(kon.position.x, -60 + h - h * 0.15 + 0.3, kon.position.z);
      topi.rotation.y = ry;
      g.add(kon, topi);
    }
    // bendera kecil di puncak (penanda "puncak gunung")
    const tiang = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4, 8), tiangB);
    tiang.position.set(-TREK.L / 2 - 4, 2, 0);
    const kain = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshStandardMaterial({ color: '#E8432F', side: THREE.DoubleSide }));
    kain.position.set(-TREK.L / 2 - 4, 3.4, 0.8); kain.rotation.y = Math.PI / 2;
    g.add(tiang, kain);
    return g;
  }

  function buatTasik() {
    const g = new THREE.Group();
    const r = rawakL(23);
    // air tasik dengan riak halus
    const riakT = teksturKanvas(256, 256, (c, w, h) => {
      c.fillStyle = '#3AA0D8'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        const x = r() * w, y = r() * h, l = 10 + r() * 24;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 3, x + l, y); c.stroke();
      }
    });
    riakT.wrapS = riakT.wrapT = THREE.RepeatWrapping; riakT.repeat.set(40, 40);
    const air2 = new THREE.Mesh(new THREE.PlaneGeometry(700, 700),
      new THREE.MeshStandardMaterial({ map: riakT, roughness: 0.15, metalness: 0.2 }));
    air2.rotation.x = -Math.PI / 2; air2.position.y = -0.55; air2.receiveShadow = true;
    g.add(air2);
    // pulau di tengah (podium di sini) + jeti kayu di bawah trek
    g.add(blokBujur(rDalam - 0.4, 1.2, [
      new THREE.MeshStandardMaterial({ color: '#79C463', roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: '#E3CF9A', roughness: 1 }),
    ]));
    const kayuGelap = new THREE.MeshStandardMaterial({ color: '#7A4E2C', roughness: 0.9 });
    const geli = new THREE.ExtrudeGeometry(bentukCincin(rLuar + 0.6, rDalam - 0.4), { depth: 0.35, bevelEnabled: false, curveSegments: 40 });
    const jeti = new THREE.Mesh(geli, kayuGelap);
    jeti.rotation.x = -Math.PI / 2; jeti.position.y = -0.37;
    g.add(jeti);
    const tiangJ = [];
    for (let i = 0; i < 64; i++) {
      [rLuar + 0.45, rDalam - 0.25].forEach((rho) => {
        const [x, z] = titikBujur(rho, i / 64);
        tiangJ.push({ x, y: -0.9, z, sx: 1 });
      });
    }
    g.add(banyak(new THREE.CylinderGeometry(0.13, 0.13, 1.1, 8), kayuGelap, tiangJ));
    // daun teratai + bunga
    const daun = [], bunga = [];
    for (let i = 0; i < 140; i++) {
      const [x, z] = titikBujur(rLuar + 2 + r() * 60, r());
      const s = 0.6 + r() * 0.9;
      daun.push({ x, y: -0.5, z, sx: s, sy: 1, sz: s, ry: r() * 6, c: ['#3E9B4F', '#4FAE5A', '#368A46'][i % 3] });
      if (i % 5 === 0) bunga.push({ x: x + 0.2, y: -0.32, z, sx: 0.35, c: i % 2 ? '#FF8FC0' : '#FFFFFF' });
    }
    g.add(banyak(new THREE.CylinderGeometry(1, 1, 0.05, 18, 1, false, 0.3, Math.PI * 2 - 0.3), new THREE.MeshStandardMaterial({ roughness: 0.6 }), daun));
    g.add(banyak(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ roughness: 0.5 }), bunga));
    // bukit hijau & pokok di tebing jauh
    const bukit = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + r() * 0.2, d = 150 + r() * 50;
      bukit.push({ x: Math.cos(a) * d * 1.3, y: -8, z: Math.sin(a) * d, sx: 40 + r() * 30, sy: 14 + r() * 16, sz: 32 + r() * 20, c: ['#5DAA55', '#6DB860', '#4F9A4C'][i % 3] });
    }
    g.add(banyak(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshStandardMaterial({ roughness: 1 }), bukit));
    const pk = [];
    for (let i = 0; i < 90; i++) {
      const a = r() * Math.PI * 2, d = 118 + r() * 20;
      pk.push({ x: Math.cos(a) * d * 1.3, y: -0.6, z: Math.sin(a) * d, s: 2 + r() * 1.5 });
    }
    g.add(pokok(pk, '#2F8A44'));
    return g;
  }

  function buatAwanLokasi() {
    const g = new THREE.Group();
    const r = rawakL(37);
    // sedikit "cahaya sendiri" supaya awan putih gebu, bukan kelabu
    const putihLembut = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, emissive: '#FFF6FB', emissiveIntensity: 0.38 });
    // trek PELANGI: setiap lorong satu warna
    for (let i = 0; i < TREK.LORONG; i++) {
      const warna = new THREE.Color().setHSL((i / TREK.LORONG) * 0.8, 0.78, 0.64);
      g.add(cincin(rDalam + (i + 1) * TREK.W, rDalam + i * TREK.W,
        new THREE.MeshStandardMaterial({ color: warna, roughness: 0.6 }), 0.025));
    }
    // pulau awan di tengah (podium di sini)
    // permukaan pulau ungu lembut berbintik supaya podium putih menonjol
    const bintikT = teksturKanvas(256, 256, (c, w, h) => {
      c.fillStyle = '#E6DDFF'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        c.fillStyle = ['#F4EEFF', '#FFE3F1', '#DCD2FF'][i % 3];
        c.beginPath(); c.arc(r() * w, r() * h, 6 + r() * 14, 0, Math.PI * 2); c.fill();
      }
    });
    bintikT.wrapS = bintikT.wrapT = THREE.RepeatWrapping; bintikT.repeat.set(0.08, 0.08);
    const atasPulau = new THREE.MeshStandardMaterial({ map: bintikT, roughness: 1, emissive: '#F3EEFF', emissiveIntensity: 0.15 });
    g.add(blokBujur(rDalam - 0.4, 0.8, [atasPulau, putihLembut]));
    // gumpalan awan di bibir pulau & di bawah tepi trek
    const tepiA = [];
    for (let i = 0; i < 90; i++) {
      const [x, z] = titikBujur(rDalam - 0.8, i / 90);
      tepiA.push({ x, y: -0.7, z, sx: 1.1 + r() * 0.6 });
    }
    for (let i = 0; i < 110; i++) {
      const [x, z] = titikBujur(rLuar + 1.6 + r(), i / 110);
      tepiA.push({ x, y: -1.25, z, sx: 1.2 + r() * 0.5 });
    }
    // lautan awan di bawah
    for (let i = 0; i < 420; i++) {
      const a = r() * Math.PI * 2, d = r() * 190;
      const s = 4 + r() * 6;
      const jauh = d > 75;
      tepiA.push({ x: Math.cos(a) * d * 1.3, y: jauh ? -4 + r() * 4 - s * 0.3 : -2.2 - s, z: Math.sin(a) * d, sx: s * 1.3, sy: s * 0.7, sz: s });
    }
    g.add(banyak(new THREE.SphereGeometry(1, 14, 10), putihLembut, tepiA));
    // pelangi besar di latar
    ['#FF5A5A', '#FF9F43', '#FFD93D', '#6BCB77', '#4D96FF', '#6C63FF', '#B56BFF'].forEach((c, i) => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(78 - i * 2.4, 1.2, 8, 80, Math.PI),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.8, transparent: true, opacity: 0.85 }));
      t.position.set(0, -14, -120);
      g.add(t);
    });
    // pulau terapung kecil di sekeliling
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4, d = 70 + r() * 30;
      const p = new THREE.Group();
      // Dilihat dari podium, pulau ini berada DI ATAS kamera — jadi hanya bahagian
      // bawahnya kelihatan. Tanpa `emissive` ia jadi segi tiga hitam di langit pastel.
      const atas = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.4, 1, 10),
        new THREE.MeshStandardMaterial({ color: '#8FD977', roughness: 1, flatShading: true, emissive: '#6FAE5C', emissiveIntensity: 0.45 }));
      const bawah = new THREE.Mesh(new THREE.ConeGeometry(4.3, 6, 10),
        new THREE.MeshStandardMaterial({ color: '#D7B48C', roughness: 1, flatShading: true, emissive: '#C9A179', emissiveIntensity: 0.5 }));
      bawah.rotation.x = Math.PI; bawah.position.y = -3.5;
      p.add(atas, bawah);
      p.position.set(Math.cos(a) * d * 1.3, 4 + r() * 10, Math.sin(a) * d);
      g.add(p);
    }
    return g;
  }

  /* ── LAUT: pelantar atas lautan terbuka, ombak, pulau & camar ── */
  function buatLaut() {
    const g = new THREE.Group();
    const r = rawakL(71);
    // lautan luas dengan riak
    const riakT = teksturKanvas(256, 256, (c, w, h) => {
      c.fillStyle = '#1C6FA8'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2.5;
      for (let i = 0; i < 26; i++) {
        const y = (i / 26) * h;
        c.beginPath();
        for (let x = 0; x <= w; x += 8) c.lineTo(x, y + Math.sin((x / w) * 9 + i) * 5);
        c.stroke();
      }
    });
    riakT.wrapS = riakT.wrapT = THREE.RepeatWrapping; riakT.repeat.set(26, 26);
    const laut = new THREE.Mesh(new THREE.PlaneGeometry(1300, 1300),
      new THREE.MeshStandardMaterial({ map: riakT, roughness: 0.34, metalness: 0.28 }));
    laut.rotation.x = -Math.PI / 2;
    laut.position.y = -0.55;
    g.add(laut);

    // pelantar kayu tempat larian
    const papanT = teksturKanvas(256, 256, (c, w, h) => {
      c.fillStyle = '#C08A52'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(90,55,25,0.5)'; c.lineWidth = 3;
      for (let i = 0; i <= 10; i++) { c.beginPath(); c.moveTo(0, (i / 10) * h); c.lineTo(w, (i / 10) * h); c.stroke(); }
    });
    // PENTING: blokBujur() guna ExtrudeGeometry, dan UV-nya lebih kurang sama
    // dengan koordinat dunia (-35..35). Jadi `repeat` di sini kecil, bukan besar
    // — nilai seperti 10 atau 30 menghasilkan ratusan ulangan yang bercampur
    // menjadi warna coklat rata. (Lihat juga bintikT di buatAwanLokasi: 0.08.)
    papanT.wrapS = papanT.wrapT = THREE.RepeatWrapping; papanT.repeat.set(0.12, 0.12);
    g.add(blokBujur(rLuar + 2.2, 0.75,
      [new THREE.MeshStandardMaterial({ map: papanT, roughness: 0.92 }),
        new THREE.MeshStandardMaterial({ color: '#7A5330', roughness: 1 })]));

    // tiang pancang di bawah bibir pelantar
    const tiangL = [];
    for (let i = 0; i < 44; i++) {
      const [x, z] = titikBujur(rLuar + 1.4, i / 44);
      tiangL.push({ x, y: -2.6, z, sx: 0.22, sy: 2.4, sz: 0.22 });
    }
    g.add(banyak(new THREE.CylinderGeometry(1, 1, 1, 8),
      new THREE.MeshStandardMaterial({ color: '#6B4A2C', roughness: 1 }), tiangL));

    // buih putih di kaki pelantar
    const buih = [];
    for (let i = 0; i < 120; i++) {
      const [x, z] = titikBujur(rLuar + 2.4 + r() * 1.2, i / 120);
      buih.push({ x, y: -0.45, z, sx: 0.7 + r() * 0.9, sy: 0.3, sz: 0.7 + r() * 0.9 });
    }
    g.add(banyak(new THREE.SphereGeometry(1, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, emissive: '#EAF6FF', emissiveIntensity: 0.3, transparent: true, opacity: 0.75 }), buih));

    // ombak putih berselerak di laut
    const ombak = [];
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2, d = rLuar + 8 + r() * 230;
      ombak.push({ x: Math.cos(a) * d * 1.25, y: -0.42, z: Math.sin(a) * d, sx: 1.4 + r() * 2.6, sy: 0.18, sz: 0.5 + r() * 0.8, ry: r() * 3 });
    }
    g.add(banyak(new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, transparent: true, opacity: 0.62 }), ombak));

    // pulau kecil berpasir + pokok kelapa di kejauhan
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r() * 0.3, d = 95 + r() * 110;
      const px = Math.cos(a) * d * 1.3, pz = Math.sin(a) * d;
      const rad = 9 + r() * 13;
      const pulau = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 10),
        new THREE.MeshStandardMaterial({ color: '#E8D7A8', roughness: 1 }));
      pulau.scale.set(1, 0.17, 1);
      pulau.position.set(px, -0.6, pz);
      g.add(pulau);
      const hijau = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.62, 14, 9),
        new THREE.MeshStandardMaterial({ color: '#4E9A4A', roughness: 1 }));
      hijau.scale.set(1, 0.2, 1);
      hijau.position.set(px, 0.1, pz);
      g.add(hijau);
      g.add(pokokKelapa([{ x: px + (r() - 0.5) * rad * 0.5, y: 0.2, z: pz + (r() - 0.5) * rad * 0.5, s: 1.5 + r() }]));
    }

    // burung camar jauh (bentuk "V" nipis)
    const camar = [];
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = 50 + r() * 120;
      camar.push({ x: Math.cos(a) * d * 1.3, y: 20 + r() * 34, z: Math.sin(a) * d, sx: 1.5 + r(), sy: 0.16, sz: 0.5, rz: (r() - 0.5) * 0.7, ry: r() * 3 });
    }
    g.add(banyak(new THREE.SphereGeometry(1, 6, 5),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, emissive: '#FFFFFF', emissiveIntensity: 0.25 }), camar));
    return g;
  }

  /* ── ANGKASA: pelantar neon di orbit, Bumi di bawah, bintang & planet ── */
  function buatAngkasa() {
    const g = new THREE.Group();
    const r = rawakL(97);

    // trek neon gelap: setiap lorong bergaris cahaya
    for (let i = 0; i < TREK.LORONG; i++) {
      const biru = new THREE.Color().setHSL(0.55 + (i / TREK.LORONG) * 0.22, 0.85, 0.55);
      g.add(cincin(rDalam + (i + 1) * TREK.W, rDalam + i * TREK.W,
        new THREE.MeshStandardMaterial({
          color: '#101A33', roughness: 0.45, metalness: 0.4,
          emissive: biru, emissiveIntensity: 0.42,
        }), 0.028));
    }
    // pelantar logam gelap
    g.add(blokBujur(rDalam - 0.4, 1.1, [
      new THREE.MeshStandardMaterial({ color: '#1A2340', roughness: 0.5, metalness: 0.55, emissive: '#2B3A6B', emissiveIntensity: 0.22 }),
      new THREE.MeshStandardMaterial({ color: '#0E1526', roughness: 0.7, metalness: 0.5 }),
    ]));

    // BUMI besar jauh di bawah
    const bumi = new THREE.Mesh(new THREE.SphereGeometry(165, 40, 28),
      new THREE.MeshStandardMaterial({ color: '#2E6FC4', roughness: 0.9, emissive: '#163A6B', emissiveIntensity: 0.3 }));
    bumi.position.set(-40, -215, -70);
    g.add(bumi);
    // benua hijau di atas Bumi
    const benua = [];
    for (let i = 0; i < 26; i++) {
      const th = Math.acos(1 - 2 * r()), ph = r() * Math.PI * 2;
      const s = 14 + r() * 26;
      benua.push({
        x: -40 + 166 * Math.sin(th) * Math.cos(ph),
        y: -215 + 166 * Math.cos(th),
        z: -70 + 166 * Math.sin(th) * Math.sin(ph),
        sx: s, sy: s * 0.5, sz: s, rx: r() * 3, ry: r() * 3,
        c: ['#3E9B4F', '#4FAE5C', '#C9B882'][i % 3],
      });
    }
    g.add(banyak(new THREE.SphereGeometry(1, 10, 8),
      new THREE.MeshStandardMaterial({ roughness: 1 }), benua));
    // awan putih nipis di atas Bumi
    const awanBumi = [];
    for (let i = 0; i < 40; i++) {
      const th = Math.acos(1 - 2 * r()), ph = r() * Math.PI * 2;
      const s = 10 + r() * 20;
      awanBumi.push({
        x: -40 + 172 * Math.sin(th) * Math.cos(ph),
        y: -215 + 172 * Math.cos(th),
        z: -70 + 172 * Math.sin(th) * Math.sin(ph),
        sx: s, sy: s * 0.35, sz: s, rx: r() * 3, ry: r() * 3,
      });
    }
    g.add(banyak(new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, transparent: true, opacity: 0.55 }), awanBumi));

    // bintang bertaburan (jauh, di segenap arah atas)
    const bintang = [];
    for (let i = 0; i < 700; i++) {
      const a = r() * Math.PI * 2, d = 240 + r() * 320;
      const y = -40 + r() * 420;
      const s = 0.5 + r() * 1.5;
      bintang.push({ x: Math.cos(a) * d, y, z: Math.sin(a) * d, sx: s, c: ['#FFFFFF', '#CFE4FF', '#FFE9C9'][i % 3] });
    }
    g.add(banyak(new THREE.SphereGeometry(1, 6, 5),
      new THREE.MeshStandardMaterial({ roughness: 1, emissive: '#FFFFFF', emissiveIntensity: 1.1 }), bintang));

    // planet bercincin + bulan
    const planet = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 18),
      new THREE.MeshStandardMaterial({ color: '#D9A05B', roughness: 0.95, emissive: '#6B4A22', emissiveIntensity: 0.3 }));
    planet.position.set(210, 95, -260);
    const cincinP = new THREE.Mesh(new THREE.TorusGeometry(48, 3.4, 8, 56),
      new THREE.MeshStandardMaterial({ color: '#E8CFA0', roughness: 1, emissive: '#8A7044', emissiveIntensity: 0.35, transparent: true, opacity: 0.8 }));
    cincinP.position.copy(planet.position);
    cincinP.rotation.set(Math.PI / 2 - 0.42, 0.3, 0);
    cincinP.scale.set(1, 1, 0.12);
    g.add(planet, cincinP);

    const bulan = new THREE.Mesh(new THREE.SphereGeometry(16, 20, 14),
      new THREE.MeshStandardMaterial({ color: '#CDD3DC', roughness: 1, emissive: '#5A6270', emissiveIntensity: 0.3, flatShading: true }));
    bulan.position.set(-230, 120, -180);
    g.add(bulan);

    // jalur nebula di langit — supaya latar podium tidak hitam kosong
    [['#6C3BBF', 0.17], ['#2E6BC4', 0.15], ['#B5479B', 0.13]].forEach(([c, op], i) => {
      const awanN = [];
      for (let j = 0; j < 55; j++) {
        const a = -0.9 + r() * 2.6 + i * 1.7;
        const d = 360 + r() * 160;
        const s = 34 + r() * 58;
        // leper & lebar = rupa jalur nebula, bukan gumpalan bola
        awanN.push({ x: Math.cos(a) * d, y: 55 + r() * 170, z: Math.sin(a) * d, sx: s * 2.1, sy: s * 0.3, sz: s * 0.35, ry: r() * 3 });
      }
      g.add(banyak(new THREE.SphereGeometry(1, 10, 8),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.7, roughness: 1, transparent: true, opacity: op }), awanN));
    });

    // tiang lampu neon di bibir dalam trek
    const neonM = new THREE.MeshStandardMaterial({ color: '#36E0FF', emissive: '#36E0FF', emissiveIntensity: 1.5, roughness: 0.4 });
    const neon = [];
    for (let i = 0; i < 28; i++) {
      const [x, z] = titikBujur(rDalam - 0.9, i / 28);
      neon.push({ x, y: 0.9, z, sx: 0.09, sy: 0.9, sz: 0.09 });
    }
    g.add(banyak(new THREE.CylinderGeometry(1, 1, 1, 6), neonM, neon));
    return g;
  }

  const LOKASI = {
    trek: null,
    gunung: { bina: buatGunung, langit: ['#2A78E0', '#8EC5F4', '#EEF7FF'], kabus: '#D9EAF8', jauh: [110, 330], trek: '#C9653D', pinggir: '#EADFC9' },
    tasik: { bina: buatTasik, langit: ['#3A8EE6', '#9AD0F5', '#F2FAFF'], kabus: '#D3ECF8', jauh: [100, 300], trek: '#C99158', pinggir: '#8A5A35' },
    awan: { bina: buatAwanLokasi, langit: ['#86B6FF', '#FFC9E3', '#FFEBCD'], kabus: '#F8E1EC', jauh: [110, 320], trek: '#FFFFFF', pinggir: '#FFFFFF' },
    laut: { bina: buatLaut, langit: ['#1E6FD0', '#7FC2F0', '#DFF4FF'], kabus: '#BFE2F5', jauh: [120, 340], trek: '#C08A52', pinggir: '#7A5330' },
    // angkasa: kabus SANGAT jauh supaya bintang & planet tidak pudar
    angkasa: { bina: buatAngkasa, langit: ['#05081A', '#131A42', '#2A1E52'], kabus: '#0A0F26', jauh: [600, 1400], trek: '#101A33', pinggir: '#1A2340' },
  };
  const binaan = {};
  let temaSemasa = null;

  function langitDari(w) {
    return teksturKanvas(16, 512, (g, ww, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, w[0]); gr.addColorStop(0.55, w[1]); gr.addColorStop(1, w[2]);
      g.fillStyle = gr; g.fillRect(0, 0, ww, h);
    });
  }

  /** Tukar lokasi. Dipanggil SELEPAS setTema (warna lokasi menindih warna tema). */
  function setLokasi(id, T = temaSemasa) {
    if (!Object.prototype.hasOwnProperty.call(LOKASI, id)) id = 'trek';
    const V = LOKASI[id];
    hiasStadium.visible = id === 'trek';
    rumput.visible = id === 'trek';
    Object.keys(LOKASI).forEach((n) => {
      if (!LOKASI[n]) return;
      if (n === id && !binaan[n]) { binaan[n] = LOKASI[n].bina(); kumpulan.add(binaan[n]); }
      if (binaan[n]) binaan[n].visible = n === id;
    });
    const berair = T && T.padang === 'air';
    air.visible = berair && id === 'trek'; // satah air besar hanya sesuai di stadium
    if (V) {
      scene.background = langitDari(V.langit);
      scene.fog.color.set(V.kabus);
      scene.fog.near = V.jauh[0]; scene.fog.far = V.jauh[1];
      if (!berair) bahanTrek.color.set(V.trek);
      bahanPinggir.color.set(V.pinggir);
    } else {
      scene.fog.near = 70; scene.fog.far = 170;
    }
  }

  function setTema(T) {
    if (!T) return;
    temaSemasa = T;
    scene.background = teksturKanvas(16, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, T.langit[0]);
      gr.addColorStop(0.55, T.langit[1]);
      gr.addColorStop(1, T.langit[2]);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    scene.fog.color.set(T.kabus);
    bahanTrek.color.set(T.trek);
    bahanPinggir.color.set(T.pinggir);
    rumputWarna[0] = T.rumput[0];
    rumputWarna[1] = T.rumput[1];
    lukisRumput(rumputKanvas.getContext('2d'), 256, 256);
    rumputT.needsUpdate = true;

    const berair = T.padang === 'air';
    air.visible = berair;
    // tema air: trek jadi laluan air lebih gelap, podium tetap di padang
    bahanTrek.roughness = berair ? 0.25 : 0.92;
    bahanTrek.metalness = berair ? 0.08 : 0;
    awan.visible = T.padang === 'awan';
  }

  return {
    kumpulan, podium, kemasOrang, setTema, setLokasi,
    penamatZ: (rLuar + rDalam) / 2, rDalam, rLuar,
  };
}

/* ── Konfeti 3D ── */
export function buatKonfeti(scene, bil = 500) {
  const geo = new THREE.PlaneGeometry(0.16, 0.26);
  const bahan = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6 });
  const mesh = new THREE.InstancedMesh(geo, bahan, bil);
  const warna = ['#FF4D4D', '#FFD23F', '#3BCEAC', '#4D8BFF', '#B36BFF', '#FF8FCF', '#FFFFFF'];
  const c = new THREE.Color();
  const benih = [];
  for (let i = 0; i < bil; i++) {
    mesh.setColorAt(i, c.set(warna[i % warna.length]));
    benih.push([Math.random(), Math.random(), Math.random(), Math.random()]);
  }
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();

  /** t = saat sejak letupan, pusat = Vector3 */
  function kemas(t, pusat) {
    if (t < 0 || t > 6) { mesh.visible = false; return; }
    mesh.visible = true;
    for (let i = 0; i < bil; i++) {
      const [a, b, cc, d] = benih[i];
      // letupan ke atas dengan rintangan udara, kemudian turun perlahan (kertas)
      const sudut = a * Math.PI * 2, laju = 2.5 + b * 5, v0 = 5 + cc * 5;
      const K = 1.5, VT = 0.9, tt = t;
      const ef = 1 - Math.exp(-K * tt);
      const y = 1.5 + ((v0 + VT) / K) * ef - VT * tt;
      const jauh = (laju / K) * ef;
      p.set(
        pusat.x + Math.cos(sudut) * jauh + Math.sin(tt * 3 + d * 9) * 0.5,
        Math.max(0.03, y),
        pusat.z + Math.sin(sudut) * jauh + Math.cos(tt * 2.5 + a * 9) * 0.5
      );
      e.set(tt * (4 + a * 6), tt * (3 + b * 5), d * 6);
      q.setFromEuler(e);
      m4.compose(p, q, s);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { mesh, kemas };
}

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
function cincin(rLuar, rDalam, bahan, y) {
  const s = bentukBujur(rLuar);
  const lubang = new THREE.Path();
  const L = TREK.L;
  lubang.moveTo(-L / 2, rDalam);
  lubang.absarc(-L / 2, 0, rDalam, Math.PI / 2, -Math.PI / 2, false);
  lubang.lineTo(L / 2, -rDalam);
  lubang.absarc(L / 2, 0, rDalam, -Math.PI / 2, Math.PI / 2, false);
  s.holes.push(lubang);
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

  // trek
  const rDalam = TREK.R, rLuar = TREK.R + TREK.LORONG * TREK.W;
  const bahanPinggir = new THREE.MeshStandardMaterial({ color: '#E9E4D8', roughness: 0.9 });
  const bahanTrek = new THREE.MeshStandardMaterial({ color: '#2F64C9', roughness: 0.92 });
  kumpulan.add(cincin(rLuar + 0.6, rDalam - 0.4, bahanPinggir, 0.01));
  kumpulan.add(cincin(rLuar, rDalam, bahanTrek, 0.02));
  const putih = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.7 });
  for (let i = 0; i <= TREK.LORONG; i++) {
    const r = rDalam + i * TREK.W;
    kumpulan.add(cincin(r + 0.035, r - 0.035, putih, 0.03));
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
  kumpulan.add(penamat);

  // gerbang penamat
  const tiangB = new THREE.MeshStandardMaterial({ color: '#F3C43F', roughness: 0.4, metalness: 0.3 });
  [rDalam - 0.9, rLuar + 0.9].forEach((z) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 5.4, 16), tiangB);
    t.position.set(0, 2.7, z); t.castShadow = true; kumpulan.add(t);
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
  kumpulan.add(panji);

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
      kumpulan.add(anak);
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
    kumpulan.add(atap);
  });
  orang.count = n;
  orang.instanceMatrix.needsUpdate = true;
  if (orang.instanceColor) orang.instanceColor.needsUpdate = true;
  kumpulan.add(orang);

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
    kumpulan.add(g);
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
  kumpulan.add(bendera);

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

  function setTema(T) {
    if (!T) return;
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
    kumpulan, podium, kemasOrang, setTema,
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

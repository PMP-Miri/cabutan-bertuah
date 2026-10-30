/* adegan.js — Pengarah adegan skrin Pentas.
 * kemas(keadaanPenuh, kiniMs) meletakkan pelari, kamera & konfeti.
 * TIADA keadaan tersembunyi: semua dikira daripada masa, supaya
 * boleh diuji/dirender bingkai demi bingkai.
 */
import * as THREE from 'three';
import { buatPelari, ambilTema, hurufNama, setHurufPelari } from './tema.js';
import { buatStadium, buatKonfeti, titik, TREK, titikAngkasa, ANGKASA, xPad } from './trek.js';
import { SLOW, lengkung, jamAnimasi, sedangSlowMo } from './slowmo.js';

const lerp = (a, b, t) => a + (b - a) * t;
const FOV_ASAS = 42;      // sama dengan PerspectiveCamera dalam utama.js
const BIL_FOKUS = 4;      // berapa pendahulu yang difokuskan semasa slow-mo
const TANGGA = 0.6;     // jarak tegak antara label bertangga (mod biasa, slow-mo)
const klip = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lancar = (x) => { x = klip(x); return x * x * (3 - 2 * x); };

/**
 * Kedudukan (0..n−1) dalam blok tengah bagi pendahulu ke-1, ke-2, … (ikut
 * susunan penamat). r = PRNG berbenih (sama di semua peranti).
 *  - Johan: kedudukan RAWAK SERAGAM (25% setiap satu), supaya lorong tidak
 *    memberi petunjuk siapa akan menang.
 *  - Mod menegak (n = 4): naib johan sekurang-kurangnya 2 kedudukan dari johan,
 *    supaya label besar mereka tidak bertindih (mereka hampir sama tinggi).
 *  - Selebihnya dikocok.
 * Fungsi tulen — diuji dalam kotak pasir.
 */
export function susunPendahulu(n, menegak, r) {
  const semua = Array.from({ length: n }, (_, j) => j);
  if (n <= 1) return semua;
  const pilih = (arr) => arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))];
  const hasil = [];
  hasil.push(pilih(semua));                                       // johan
  let calon = semua.filter((j) => !hasil.includes(j));
  if (menegak && n === 4) {
    const jauh = calon.filter((j) => Math.abs(j - hasil[0]) >= 2);
    if (jauh.length) calon = jauh;
  }
  hasil.push(pilih(calon));                                       // naib johan
  const baki = semua.filter((j) => !hasil.includes(j));
  for (let j = baki.length - 1; j > 0; j--) {                     // kocok selebihnya
    const k = Math.floor(r() * (j + 1));
    [baki[j], baki[k]] = [baki[k], baki[j]];
  }
  return hasil.concat(baki);
}

export function buatAdegan({ scene, camera, Logik }) {
  const stadium = buatStadium(scene);
  const konfeti = buatKonfeti(scene);
  const MASA = Logik.MASA;
  const kolam = new Map(); // id → pelari
  let korCache = { kunci: '', kor: null };
  let T = ambilTema('wira');     // tema semasa (objek)
  let temaDipasang = '';

  /** Tukar tema: buang semua pelari lama & kulit semula stadium. */
  function pasangTema(idTema) {
    if (idTema === temaDipasang) return;
    temaDipasang = idTema;
    T = ambilTema(idTema);
    kolam.forEach((o) => {
      scene.remove(o.grup);
      o.grup.traverse((m) => m.geometry && m.geometry.dispose());
    });
    kolam.clear();
    stadium.setTema(T);
    stadium.setLokasi(lokasiDipasang || 'trek', T);
  }

  /** Tukar lokasi (trek / gunung / tasik / awan). Pelari tidak perlu dibina semula. */
  let lokasiDipasang = '';
  function pasangLokasi(id) {
    if (id === lokasiDipasang) return;
    lokasiDipasang = id;
    stadium.setLokasi(id, T);
  }

  function pelariUntuk(p) {
    let o = kolam.get(p.id);
    if (!o) {
      o = buatPelari(T.id, {
        jantina: p.jantina, warna: p.warna, spesies: p.spesies,
        kulit: p.kulit, rambut: p.rambut,
        huruf: hurufNama(p.nama), seed: p.id,
      });
      setHurufPelari(o, hurufNama(p.nama));
      o.grup.scale.setScalar(T.skala);
      scene.add(o.grup);
      kolam.set(p.id, o);
      if (kolam.size > 40) { // buang yang paling lama tidak digunakan
        for (const [id, lama] of kolam) {
          if (!lama.grup.visible && id !== p.id) {
            scene.remove(lama.grup);
            lama.grup.traverse((m) => m.geometry && m.geometry.dispose());
            kolam.delete(id);
            break;
          }
        }
      }
    }
    return o;
  }

  /**
   * Agih LORONG untuk PAPARAN sahaja (tiada kaitan dengan peraturan cabutan).
   *
   * Masalah yang diselesaikan: kalau lorong diberi ikut susunan rawak, empat
   * pendahulu boleh berada di lorong 1, 5, 9 dan 12 — berjauhan. Zum slow-mo
   * terpaksa melebar untuk memuatkan kesemuanya, jadi SEMUA pelari masuk
   * semula ke dalam bingkai dan skrin nampak serabut.
   *
   * Penyelesaian: letak 4 pendahulu di lorong BERSEBELAHAN di tengah trek
   * (urutan penamat 1-2-3-4 dari dalam ke luar), dan pelari lain di lorong
   * luar. Zum slow-mo kemudian boleh ketat pada blok tengah sahaja.
   *
   * @returns {number[]} lorong bagi setiap indeks dalam `kor`
   */
  function bahagiLorong(kor, akhir, benih) {
    const n = kor.length;
    const bilF = Math.min(BIL_FOKUS, n);
    const tengah = Math.max(0, Math.round((TREK.LORONG - bilF) / 2));
    const bagi = new Array(n);
    const dipakai = new Set();
    // Susunan pendahulu DALAM blok tengah dikocok (berbenih → sama di semua
    // peranti). Jangan tetap: kalau johan sentiasa di lorong yang sama, penonton
    // boleh "teka" pemenang selepas beberapa pusingan.
    // Mod MENEGAK: johan & naib johan hampir sama tinggi di garisan; kalau
    // bersebelahan, label besar mereka bertindih (dilihat dalam render). Jadi
    // hanya susunan di mana mereka dipisah sekurang-kurangnya satu lorong.
    const susunan = susunPendahulu(bilF, menegak, Logik.rawak('lorong:' + benih));
    akhir.slice(0, bilF).forEach((id, j) => {
      const i = kor.findIndex((x) => x.id === id);
      if (i < 0) return;
      const lr = tengah + susunan[j];
      bagi[i] = lr;
      dipakai.add(lr);
    });
    // selebihnya: lorong terdekat dengan blok tengah, berselang kiri/kanan
    const kosong = [];
    for (let d = 1; kosong.length < n - bilF && d <= TREK.LORONG; d++) {
      [tengah - d, tengah + bilF - 1 + d].forEach((lr) => {
        if (lr >= 0 && lr < TREK.LORONG && !dipakai.has(lr) && kosong.length < n - bilF) {
          kosong.push(lr);
          dipakai.add(lr);
        }
      });
    }
    let kk = 0;
    for (let i = 0; i < n; i++) if (bagi[i] === undefined) bagi[i] = kosong[kk++] ?? i;
    return bagi;
  }

  /* ── Mod MENEGAK (lokasi 'angkasa'): roket naik lurus dari pad ke 100 KM ──
     `menegak` dikira semula setiap bingkai daripada stadium (ikut lokasi). */
  let menegak = false;
  /** Kedudukan pada laluan: bujur biasa, atau menegak untuk roket. */
  const tempat = (p, lorong) => (menegak ? titikAngkasa(p, lorong) : titik(p, lorong));
  // label di atas HIDUNG roket (menegak) atau di atas kepala (biasa)
  const atasLabel = () => (menegak ? ANGKASA.HIDUNG + 0.45 : 2.25);

  /** Letak pelari pada laluan, dengan ketinggian mengikut tema. */
  function letak(o, t) {
    o.grup.position.copy(t.pos);
    if (menegak) {
      // titikAngkasa sudah memberi PUSAT roket; hidung (+Z asal) dihalakan ke +Y
      o.grup.rotation.set(-Math.PI / 2, 0, 0);
      return;
    }
    o.grup.position.y += T.y;
    o.grup.rotation.set(0, t.arah, 0);
  }

  /* Tiang asap di belakang setiap roket (satu bagi setiap lorong), dari pad
     hingga ekor roket. Silinder tirus, alfa pudar ke atas. Hanya mod menegak. */
  const asapT = (() => {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 128);   // atas kanvas = hujung atas silinder
    gr.addColorStop(0, '#2A2A2A'); gr.addColorStop(0.35, '#9A9A9A'); gr.addColorStop(1, '#FFFFFF');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
    return new THREE.CanvasTexture(c);
  })();
  const bahanAsap = new THREE.MeshStandardMaterial({
    color: '#F3F5F9', emissive: '#D5DBE4', emissiveIntensity: 0.4, roughness: 1,
    transparent: true, opacity: 0.8, alphaMap: asapT, depthWrite: false,
  });
  const geoAsap = new THREE.CylinderGeometry(0.3, 0.72, 1, 16, 1, true);
  geoAsap.translate(0, 0.5, 0);                    // tapak di y = 0
  const tiangAsap = [];
  for (let i = 0; i < TREK.LORONG; i++) {
    const m = new THREE.Mesh(geoAsap, bahanAsap);
    m.visible = false;
    m.renderOrder = 2;
    scene.add(m);
    tiangAsap.push(m);
  }
  function asapLorong(lorong, ekorY) {
    const m = tiangAsap[lorong];
    if (!m) return;
    const tinggi = ekorY - 0.25;
    m.visible = tinggi > 0.3;
    m.position.set(xPad(lorong), 0.25, 0);
    // tiang pendek (saat berlepas) dirampingkan: kalau tidak, ia nampak seperti
    // kon/tudung lampu lutsinar di atas pad (dilihat dalam render)
    const lebar = Math.min(1, 0.4 + tinggi / 10);
    m.scale.set(lebar, Math.max(0.01, tinggi), lebar);
  }

  /* ── Syot kamera: setiap satu {pos, lihat} ── */
  const pusatLorong = TREK.R + (TREK.LORONG * TREK.W) / 2;
  const podiumPos = stadium.podium.position;

  const syot = {
    lobi: (s) => ({
      // tinggi & jauh supaya bumbung tempat duduk tidak menghalang
      pos: new THREE.Vector3(Math.sin(s * 0.05) * 50, 24 + Math.sin(s * 0.11) * 2, Math.cos(s * 0.05) * 50 + 6),
      lihat: new THREE.Vector3(0, 0, 10)
    }),
    mula: (s) => ({
      pos: new THREE.Vector3(9.5 - s * 0.25, 2.0, pusatLorong + 1.5),
      lihat: new THREE.Vector3(0, 1.2, pusatLorong)
    }),
    ikut: (c, arah) => {
      const keluar = new THREE.Vector3(c.x - klip(c.x, -TREK.L / 2, TREK.L / 2), 0, c.z).normalize();
      const depan = new THREE.Vector3(Math.sin(arah), 0, Math.cos(arah));
      return {
        pos: c.clone().addScaledVector(keluar, -10).addScaledVector(depan, 4).add(new THREE.Vector3(0, 4.2, 0)),
        lihat: c.clone().addScaledVector(depan, 2).add(new THREE.Vector3(0, 1, 0))
      };
    },
    /* KAMERA FOKUS (slow-mo): kamera garisan penamat gaya siaran TV.
       TETAP di tengah lebar trek, 14 unit SELEPAS garisan (x = 0), sedikit
       tinggi, berdepan terus dengan pelari yang datang (mereka bergerak ke +x,
       jadi muka kelihatan & setiap lorong terpisah mendatar). Hanya berpusing
       dan zum (FOV) untuk membingkai pendahulu.
       Kenapa di sini? Diuji dengan render: kamera di dalam padang (9.5, 3,
       rDalam−3.5) mempunyai tiang gerbang dalam TEPAT pada garis pandang.
       Dari tengah lorong, kedua-dua tiang berada ~25° ke kiri/kanan — di luar
       bingkai zum. y = 3.6: cukup tinggi untuk nampak semua lorong, cukup
       rendah supaya panji gerbang (y≈5.2) di atas bingkai zum, bukan jalur
       oren besar di atas skrin. Pelari berhenti sekitar x ≈ +7 selepas
       penamat, jadi tidak melanggar kamera. */
    fokus: (titikFokus) => {
      const pos = new THREE.Vector3(14, 3.6, pusatLorong);
      const sasaran = new THREE.Vector3();
      const titikBingkai = [];
      titikFokus.forEach((p) => {
        sasaran.add(p).add(new THREE.Vector3(0, 1.1 * T.skala, 0));
        // atas: kepala + label bertangga (hingga 3 × TANGGA lebih tinggi)
        titikBingkai.push(p.clone(), p.clone().add(new THREE.Vector3(0, 2.6 * T.skala + 3 * TANGGA, 0)));
      });
      sasaran.divideScalar(Math.max(1, titikFokus.length));
      // FOV terkecil yang memuatkan semua pendahulu (kaki hingga label)
      const arah = sasaran.clone().sub(pos).normalize();
      const kanan = new THREE.Vector3().crossVectors(arah, new THREE.Vector3(0, 1, 0)).normalize();
      const atas = new THREE.Vector3().crossVectors(kanan, arah);
      const aspek = camera.aspect || 16 / 9;
      let perlu = 0.08;
      titikBingkai.forEach((q) => {
        const v = q.clone().sub(pos);
        const z = Math.max(0.5, v.dot(arah));
        // jidar kecil (rad) — cukup supaya label nama tidak terpotong,
        // tetapi tidak melebarkan bingkai sehingga pelari lain masuk semula
        const ax = Math.atan(Math.abs(v.dot(kanan)) / z) + 0.045;
        const ay = Math.atan(Math.abs(v.dot(atas)) / z) + 0.045;
        perlu = Math.max(perlu, ay, Math.atan(Math.tan(ax) / aspek));
      });
      const fov = klip((2 * perlu * 180) / Math.PI, 9, 55);
      return { pos, lihat: sasaran, fov };
    },
    // dari bibir dalam trek: lorong di belakang kamera, tiada tiang menghalang.
    // Ditulis RELATIF kepada podium (dulu nilai mutlak; hasil sama di stadium:
    // podium z = rDalam − 5 → kamera z = rDalam − 0.6) supaya juga sah untuk
    // stesen angkasa yang tinggi di udara.
    podium: (s) => ({
      pos: podiumPos.clone().add(new THREE.Vector3(Math.sin(s * 0.3) * 1.6, 2.6, 4.4)),
      lihat: podiumPos.clone().add(new THREE.Vector3(0, 1.9, 0))
    })
  };

  /* ── Syot kamera MOD MENEGAK (roket Bumi → Angkasa) ──
     Kamera sentiasa di sisi +z memandang ke −z; roket berbaris di x, naik di y. */
  const syotM = {
    // berayun di hadapan tapak (±50°), tidak pernah ke belakang papan nama
    lobi: (s) => {
      const a = Math.sin(s * 0.07) * 0.85;
      return {
        pos: new THREE.Vector3(Math.sin(a) * 21, 6.5 + Math.sin(s * 0.11) * 0.8, Math.cos(a) * 21),
        lihat: new THREE.Vector3(0, 3.0, -1)
      };
    },
    // syot rendah di tepi pad, mendongak mengikut roket berlepas
    mula: (s, cY) => ({
      pos: new THREE.Vector3(5.5 - s * 0.2, 1.3, 11),
      lihat: new THREE.Vector3(0, 2.6 + Math.max(0, cY - ANGKASA.Y0) * 0.9, 0)
    }),
    // ikut kumpulan dari hadapan, sedikit di bawah & mendongak (nampak arah tuju)
    ikut: (c) => ({
      pos: new THREE.Vector3(c.x * 0.4, c.y - 1.5, 23),
      lihat: new THREE.Vector3(c.x * 0.4, c.y + 2.2, 0)
    }),
    // stesen angkasa: lebih jauh & tinggi daripada podium stadium (cakera
    // stesen lebar 11 unit memenuhi skrin kalau kamera serapat 4.4 unit)
    podium: (s) => ({
      pos: podiumPos.clone().add(new THREE.Vector3(Math.sin(s * 0.3) * 2, 3.4, 7)),
      lihat: podiumPos.clone().add(new THREE.Vector3(0, 2.0, 0))
    }),
    /* SLOW-MO: zum pada 4 pendahulu. Bingkai sentiasa termasuk RUANG KOSONG
       di atas pendahulu (hingga 7 unit, dihadkan pada garisan 100 KM), jadi
       garisan penamat masuk ke bingkai dari atas bila mereka menghampirinya. */
    fokus: (titikFokus) => {
      if (!titikFokus.length) return syotM.ikut(new THREE.Vector3(0, ANGKASA.H * 0.8, 0));
      const titikBingkai = [];
      let xs = 0, yAtas = -Infinity;
      titikFokus.forEach((p) => {
        xs += p.x;
        yAtas = Math.max(yAtas, p.y);
        titikBingkai.push(p.clone().add(new THREE.Vector3(0, -ANGKASA.EKOR - 0.3, 0)),
          p.clone().add(new THREE.Vector3(0, ANGKASA.HIDUNG + 1.3, 0)));
      });
      const xm = xs / titikFokus.length;
      titikBingkai.push(new THREE.Vector3(xm, Math.min(ANGKASA.H + 0.9, yAtas + 7), 0));
      let y0 = Infinity, y1 = -Infinity;
      titikBingkai.forEach((q) => { y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
      const lihat = new THREE.Vector3(xm, (y0 + y1) / 2, 0);
      const pos = new THREE.Vector3(xm * 0.5, lihat.y, 14);
      return { pos, lihat, fov: fovMuat(pos, lihat, titikBingkai) };
    },
  };

  /** FOV terkecil (darjah) dari `pos` memandang `lihat` yang memuatkan semua titik. */
  function fovMuat(pos, lihat, titikBingkai) {
    const arah = lihat.clone().sub(pos).normalize();
    const kanan = new THREE.Vector3().crossVectors(arah, new THREE.Vector3(0, 1, 0)).normalize();
    const atas = new THREE.Vector3().crossVectors(kanan, arah);
    const aspek = camera.aspect || 16 / 9;
    let perlu = 0.08;
    titikBingkai.forEach((q) => {
      const v = q.clone().sub(pos);
      const z = Math.max(0.5, v.dot(arah));
      const ax = Math.atan(Math.abs(v.dot(kanan)) / z) + 0.045;
      const ay = Math.atan(Math.abs(v.dot(atas)) / z) + 0.045;
      perlu = Math.max(perlu, ay, Math.atan(Math.tan(ax) / aspek));
    });
    return klip((2 * perlu * 180) / Math.PI, 9, 55);
  }
  function campur(a, b, t) {
    t = lancar(t);
    return {
      pos: a.pos.clone().lerp(b.pos, t), lihat: a.lihat.clone().lerp(b.lihat, t),
      fov: lerp(a.fov || FOV_ASAS, b.fov || FOV_ASAS, t),
    };
  }

  /**
   * @returns {{fasa, u, label:[{id,no,nama,pos,menang,kedudukan}], kilat:number}}
   */
  function kemas(k, kini) {
    const s = kini / 1000;
    pasangTema((k && k.tema) || 'wira');
    pasangLokasi((k && k.lokasi) || 'trek');
    menegak = stadium.menegak();
    tiangAsap.forEach((m) => { m.visible = false; });
    const S = menegak ? syotM : syot;            // set syot kamera ikut mod
    const L = k && k.larian;
    const pesertaIkutId = new Map((k ? k.peserta : []).map((p) => [p.id, p]));
    kolam.forEach((w) => { w.grup.visible = false; });
    const label = [];
    let kam, fasa = 'lobi', u = 0, kilat = 0, teruja = 0.1, slowmo = false;

    if (!L) {
      /* ── Lobi: pendaftar terkini memanaskan badan di garisan mula ── */
      const terkini = (k ? k.peserta : []).slice(-Logik.HAD.PAPAR);
      // ditengahkan supaya tidak berkumpul di satu tepi trek
      const anjak = Math.max(0, Math.round((TREK.LORONG - terkini.length) / 2));
      terkini.forEach((p, i) => {
        const o = pelariUntuk(p);
        const t0 = tempat(0, anjak + i);
        o.grup.visible = true;
        letak(o, t0);
        // roket menunggu di pad (enjin perlahan); watak lain memanaskan badan
        o.pose(menegak ? 'sedia' : 'jogging', s + i * 0.13);
        label.push({
          id: p.id, no: p.no, nama: p.nama,
          pos: menegak ? o.grup.position.clone().add(new THREE.Vector3(0, atasLabel(), 0))
            : t0.pos.clone().setY(2.3 + T.y)
        });
      });
      kam = S.lobi(s);
      stadium.podium.visible = true;
    } else {
      const tau = kini - L.mula; // ms relatif saat pistol
      const kunci = L.benih + L.no + (menegak ? ':M' : '');  // susunan lorong ikut mod
      if (korCache.kunci !== kunci) {
        const kor = Logik.koreografi(L);
        // Pendahulu yang difokuskan = 4 teratas pada GARISAN PENAMAT. Set ini
        // tetap sepanjang slow-mo, jadi kamera tidak terlompat-lompat bila
        // kedudukan bertukar; susunan 1-2-3-4 di label tetap berubah secara langsung.
        const akhir = Logik.kedudukan(kor, 1).map((x) => x.id);
        const fokus = new Set(akhir.slice(0, BIL_FOKUS));
        const lorongBagi = bahagiLorong(kor, akhir, L.benih + ':' + L.no);
        const tengah = Math.min(...akhir.slice(0, BIL_FOKUS)
          .map((id) => lorongBagi[kor.findIndex((x) => x.id === id)]));
        korCache = { kunci, kor, fokus, lorongBagi, tengah };
      }
      const kor = korCache.kor;
      const LARI = Logik.masaLari(L);            // 5-8 s, pilihan MC
      const laju = T.lajuLari * Math.sqrt(MASA.LARI / LARI); // larian lebih lama → langkah lebih santai
      const tamatLari = tau >= LARI;
      const sr = klip(tau / LARI);               // pecahan masa SEBENAR
      u = lengkung(sr);                          // pecahan KEMAJUAN (dengan slow-mo)
      slowmo = tau >= 0 && sedangSlowMo(sr);
      const jamLari = jamAnimasi(sr, LARI);      // jam kaki: perlahan semasa slow-mo

      // kedudukan setiap pelari
      const pusat = new THREE.Vector3();
      let arahPurata = 0, bil = 0;
      const titikFokus = [];
      const kedudukan = Logik.kedudukan(kor, u).map((x) => x.id);

      kor.forEach((x, idx) => {
        const lorong = korCache.lorongBagi[idx];
        const p = pesertaIkutId.get(x.id);
        if (!p) return;
        const o = pelariUntuk(p);
        o.grup.visible = true;
        const tl = (tau >= 0 && !tamatLari ? jamLari : s) + lorong * 0.17;

        // Mod menegak, selepas sambutan: roket yang KALAH "disediakan semula" di
        // pad supaya tapak tidak kosong sementara menunggu pusingan seterusnya.
        // Dibuat 0.6 s selepas sambutan, ketika kamera masih di stesen (roket
        // di garisan berada di belakang kamera → tiada "lompatan" kelihatan).
        // Pemenang KEKAL di podium stesen; pad-nya dibiarkan kosong.
        const balikPad = menegak && tamatLari && !x.menang && tau - LARI > MASA.RAIKAN + 600;
        if (tau < 0 || balikPad) {
          const t0 = tempat(0, lorong);
          letak(o, t0);
          o.pose('sedia', balikPad ? s + lorong * 0.17 : tl);
          fasa = balikPad ? 'sedia' : 'kira';
        } else if (!tamatLari) {
          const pr = Logik.kemajuan(x, u);
          const tt = tempat(pr, lorong);
          letak(o, tt);
          o.pose('lari', tl, laju);
          if (menegak) asapLorong(lorong, o.grup.position.y - ANGKASA.EKOR);
          pusat.add(o.grup.position); arahPurata += tt.arah; bil++;
          fasa = 'lari';
        } else {
          const tr = (tau - LARI) / 1000;
          const akhir = Logik.kemajuan(x, 1);
          if (x.menang) {
            // terus melepasi garisan, kemudian lompat/terbang ke podium
            const lepas = tempat(1 + 0.02 * (1 - Math.exp(-tr * 3)), lorong).pos;
            if (!menegak) lepas.setY(T.y);
            // podium di tanah: y = 0 → 0.7 (sama seperti dahulu); stesen angkasa: +0.7
            const ke = podiumPos.clone().add(new THREE.Vector3(0, 0.7, 0));
            const a = lancar((tr - 0.7) / 1.0);
            const pos = lepas.clone().lerp(ke, a);
            pos.y += Math.sin(Math.PI * klip((tr - 0.7) / 1.0)) * 2.2;
            o.grup.position.copy(pos);
            if (menegak) {
              // dari tegak (hidung ke atas) beransur ke sudut podium biasa
              o.grup.rotation.set(lerp(-Math.PI / 2, 0, a), lerp(0, T.sudutPodium || 0, a), 0);
              asapLorong(lorong, lepas.y - ANGKASA.EKOR);
            } else {
              o.grup.rotation.set(0, lerp(Math.PI / 2, T.sudutPodium || 0, a), 0);
            }
            if (tr < 0.7) o.pose('lari', tl, laju * Math.max(0.3, 1 - tr));
            else if (tr < 1.7) o.pose('menang', 0.2);
            else o.pose('menang', tr - 1.7);
            if (tr >= 1.7 && tau > LARI + MASA.RAIKAN) o.pose('sedia', s);
          } else {
            const tt = tempat(akhir + 0.035 * (1 - Math.exp(-tr * 2.2)), lorong);
            letak(o, tt);
            if (menegak) asapLorong(lorong, o.grup.position.y - ANGKASA.EKOR);
            if (tr < 1.2) o.pose('lari', tl, laju * (1 - tr * 0.6));
            else o.pose(menegak ? 'sedia' : 'jogging', tl);
          }
          fasa = tau < LARI + MASA.RAIKAN ? 'raikan' : 'sedia';
        }
        const kd = kedudukan.indexOf(x.id) + 1;
        const difokus = korCache.fokus.has(x.id);
        if (difokus) titikFokus.push(o.grup.position.clone());
        label.push({
          id: p.id, no: p.no, nama: p.nama, kedudukan: kd, fokus: difokus,
          menang: tamatLari && x.menang,
          // Mod biasa, slow-mo: kamera menghadap pelari yang datang, jadi 4 lorong
          // bersebelahan hanya ~3.8 unit lebar dan label besar bertindih (dilihat
          // dalam render). Label disusun bertangga ikut LORONG (bukan kedudukan,
          // supaya tangga tidak membocorkan siapa johan).
          pos: o.grup.position.clone().add(new THREE.Vector3(0,
            atasLabel() + (slowmo && difokus && !menegak ? (lorong - korCache.tengah) * TANGGA : 0), 0))
        });
      });

      // kamera
      if (tau < 0) {
        kam = S.mula((tau + MASA.KIRA) / 1000, ANGKASA.Y0);
      } else if (!tamatLari) {
        const c = bil ? pusat.divideScalar(bil) : new THREE.Vector3();
        const ik = S.ikut(c, bil ? arahPurata / bil : 0);
        // potongan terus (gaya siaran TV) — ikut masa SEBENAR (sr), bukan kemajuan
        if (sr < 0.14) kam = S.mula(MASA.KIRA / 1000 + tau / 1000, c.y);
        else if (sr < SLOW.MULA) kam = ik;
        else kam = S.fokus(titikFokus);          // slow-mo: zum pada 4 pendahulu
        teruja = 0.35 + u * 0.65;
      } else {
        const tr = (tau - LARI) / 1000;
        if (tr < 0.6) kilat = 1 - tr / 0.6;
        const akhirRaikan = MASA.RAIKAN / 1000;
        // kamera fokus yang sama terus merakam melepasi garisan (kilat menandakan
        // saat penamat), kemudian beralih perlahan ke podium
        if (tr < 0.9) kam = S.fokus(titikFokus);
        else if (tr < 2.0) kam = campur(S.fokus(titikFokus), S.podium(tr), (tr - 0.9) / 1.1);
        else if (tr < akhirRaikan) kam = S.podium(tr);
        else kam = campur(S.podium(tr), S.lobi(s), (tr - akhirRaikan) / 2.5);
        teruja = tr < akhirRaikan ? 1 : 0.15;
        konfeti.kemas(tr - 1.6, podiumPos);
        // asap roket hilang SEBELUM kamera turun semula ke tapak (kalau tidak,
        // tiang asap kelihatan seperti jeriji di hadapan kamera — dilihat dalam render)
        bahanAsap.opacity = 0.8 * (1 - klip((tr - 2.5) / 2));
      }
      if (tau < LARI) bahanAsap.opacity = 0.8;
      if (tau < LARI) konfeti.kemas(-1, podiumPos);
    }

    stadium.kemasOrang(s, teruja);
    camera.position.copy(kam.pos);
    camera.lookAt(kam.lihat);
    stadium.kemasLangit(camera.position);       // langit angkasa ikut ketinggian kamera
    // zum: hanya syot fokus menukar FOV; syot lain kembali ke FOV asal
    const fov = kam.fov || FOV_ASAS;
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    return { fasa, u, label, kilat, slowmo };
  }

  return { kemas, stadium };
}

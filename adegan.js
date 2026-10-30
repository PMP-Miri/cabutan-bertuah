/* adegan.js — Pengarah adegan skrin Pentas.
 * kemas(keadaanPenuh, kiniMs) meletakkan pelari, kamera & konfeti.
 * TIADA keadaan tersembunyi: semua dikira daripada masa, supaya
 * boleh diuji/dirender bingkai demi bingkai.
 */
import * as THREE from 'three';
import { buatPelari, ambilTema, hurufNama, setHurufPelari } from './tema.js';
import { buatStadium, buatKonfeti, titik, TREK } from './trek.js';

const lerp = (a, b, t) => a + (b - a) * t;
const klip = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lancar = (x) => { x = klip(x); return x * x * (3 - 2 * x); };

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

  /** Letak pelari pada laluan, dengan ketinggian mengikut tema. */
  function letak(o, t) {
    o.grup.position.copy(t.pos);
    o.grup.position.y += T.y;
    o.grup.rotation.y = t.arah;
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
    // di luar lorong paling luar, supaya pelari tidak melanggar kamera
    penamat: () => ({
      pos: new THREE.Vector3(8.5, 2.3, stadium.rLuar + 2.2),
      lihat: new THREE.Vector3(-7, 1.0, pusatLorong)
    }),
    // dari bibir dalam trek: lorong di belakang kamera, tiada tiang menghalang
    podium: (s) => ({
      pos: new THREE.Vector3(podiumPos.x + Math.sin(s * 0.3) * 1.6, 2.6, stadium.rDalam - 0.6),
      lihat: new THREE.Vector3(podiumPos.x, 1.9, podiumPos.z)
    })
  };
  function campur(a, b, t) {
    t = lancar(t);
    return { pos: a.pos.clone().lerp(b.pos, t), lihat: a.lihat.clone().lerp(b.lihat, t) };
  }

  /**
   * @returns {{fasa, u, label:[{id,no,nama,pos,menang,kedudukan}], kilat:number}}
   */
  function kemas(k, kini) {
    const s = kini / 1000;
    pasangTema((k && k.tema) || 'wira');
    const L = k && k.larian;
    const pesertaIkutId = new Map((k ? k.peserta : []).map((p) => [p.id, p]));
    kolam.forEach((w) => { w.grup.visible = false; });
    const label = [];
    let kam, fasa = 'lobi', u = 0, kilat = 0, teruja = 0.1;

    if (!L) {
      /* ── Lobi: 12 pendaftar terkini memanaskan badan di garisan mula ── */
      const terkini = (k ? k.peserta : []).slice(-TREK.LORONG);
      terkini.forEach((p, i) => {
        const o = pelariUntuk(p);
        const t0 = titik(0, i);
        o.grup.visible = true;
        letak(o, t0);
        o.pose('jogging', s + i * 0.13);
        label.push({ id: p.id, no: p.no, nama: p.nama, pos: t0.pos.clone().setY(2.3 + T.y) });
      });
      kam = syot.lobi(s);
      stadium.podium.visible = true;
    } else {
      const tau = kini - L.mula; // ms relatif saat pistol
      const kunci = L.benih + L.no;
      if (korCache.kunci !== kunci) korCache = { kunci, kor: Logik.koreografi(L) };
      const kor = korCache.kor;
      const pemenangId = L.pemenangId;
      const tamatLari = tau >= MASA.LARI;
      u = klip(tau / MASA.LARI);

      // kedudukan setiap pelari
      const pusat = new THREE.Vector3();
      let arahPurata = 0, bil = 0;
      const kedudukan = Logik.kedudukan(kor, u).map((x) => x.id);

      kor.forEach((x, lorong) => {
        const p = pesertaIkutId.get(x.id);
        if (!p) return;
        const o = pelariUntuk(p);
        o.grup.visible = true;
        const tl = s + lorong * 0.17;

        if (tau < 0) {
          const t0 = titik(0, lorong);
          letak(o, t0);
          o.pose('sedia', tl);
          fasa = 'kira';
        } else if (!tamatLari) {
          const pr = Logik.kemajuan(x, u);
          const tt = titik(pr, lorong);
          letak(o, tt);
          o.pose('lari', tl, T.lajuLari);
          pusat.add(o.grup.position); arahPurata += tt.arah; bil++;
          fasa = 'lari';
        } else {
          const tr = (tau - MASA.LARI) / 1000;
          const akhir = Logik.kemajuan(x, 1);
          if (x.menang) {
            // terus melepasi garisan, kemudian lompat ke podium
            const lepas = titik(1 + 0.02 * (1 - Math.exp(-tr * 3)), lorong).pos.setY(T.y);
            const ke = podiumPos.clone().setY(0.7);
            const a = lancar((tr - 0.7) / 1.0);
            const pos = lepas.clone().lerp(ke, a);
            pos.y += Math.sin(Math.PI * klip((tr - 0.7) / 1.0)) * 2.2;
            o.grup.position.copy(pos);
            o.grup.rotation.y = lerp(Math.PI / 2, T.sudutPodium || 0, a);
            if (tr < 0.7) o.pose('lari', tl, T.lajuLari * Math.max(0.3, 1 - tr));
            else if (tr < 1.7) o.pose('menang', 0.2);
            else o.pose('menang', tr - 1.7);
            if (tr >= 1.7 && tau > MASA.LARI + MASA.RAIKAN) o.pose('sedia', s);
          } else {
            const tt = titik(akhir + 0.035 * (1 - Math.exp(-tr * 2.2)), lorong);
            letak(o, tt);
            if (tr < 1.2) o.pose('lari', tl, T.lajuLari * (1 - tr * 0.6));
            else o.pose('jogging', tl);
          }
          fasa = tau < MASA.LARI + MASA.RAIKAN ? 'raikan' : 'sedia';
        }
        const kd = kedudukan.indexOf(x.id) + 1;
        label.push({
          id: p.id, no: p.no, nama: p.nama, kedudukan: kd,
          menang: tamatLari && x.menang,
          pos: o.grup.position.clone().add(new THREE.Vector3(0, 2.25, 0))
        });
      });

      // kamera
      if (tau < 0) {
        kam = syot.mula((tau + MASA.KIRA) / 1000);
      } else if (!tamatLari) {
        const c = bil ? pusat.divideScalar(bil) : new THREE.Vector3();
        const ik = syot.ikut(c, bil ? arahPurata / bil : 0);
        // potongan terus (gaya siaran TV) — campuran jarak jauh menghala ke trek kosong
        if (u < 0.14) kam = syot.mula(MASA.KIRA / 1000 + tau / 1000);
        else if (u < 0.8) kam = ik;
        else kam = syot.penamat();
        teruja = 0.35 + u * 0.65;
      } else {
        const tr = (tau - MASA.LARI) / 1000;
        if (tr < 0.6) kilat = 1 - tr / 0.6;
        const akhirRaikan = MASA.RAIKAN / 1000;
        if (tr < 0.9) kam = syot.penamat();
        else if (tr < 2.0) kam = campur(syot.penamat(), syot.podium(tr), (tr - 0.9) / 1.1);
        else if (tr < akhirRaikan) kam = syot.podium(tr);
        else kam = campur(syot.podium(tr), syot.lobi(s), (tr - akhirRaikan) / 2.5);
        teruja = tr < akhirRaikan ? 1 : 0.15;
        konfeti.kemas(tr - 1.6, podiumPos);
      }
      if (tau < MASA.LARI) konfeti.kemas(-1, podiumPos);
    }

    stadium.kemasOrang(s, teruja);
    camera.position.copy(kam.pos);
    camera.lookAt(kam.lihat);
    return { fasa, u, label, kilat };
  }

  return { kemas, stadium };
}

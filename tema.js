/* tema.js — Pendaftar TEMA Wira Pecut.
 *
 * Semua tema berkongsi laluan bujur yang sama (trek.js → titik()), jadi
 * peraturan cabutan, koreografi dan kamera tidak berubah langsung.
 * Yang berubah hanyalah: watak, hiasan persekitaran, dan ketinggian.
 *
 * Setiap pelari mempunyai API yang SAMA: { grup, pose(mod, t, laju) }
 *   mod = 'sedia' | 'lari' | 'jogging' | 'menang'
 */
import { setHuruf } from './watak.js';
import { buatKuda, buatItik, buatBurung } from './haiwan.js';
import { buatBuahSayur, SPESIES, cariSpesies } from './buahsayur.js';

export { SPESIES, cariSpesies };

export const TEMA = {
  wira: {
    id: 'wira',
    nama: 'Buah & Sayur',
    ikon: '🥕',
    huraian: '20 watak buah & sayur comel berlari di trek',
    pelari: 'pelari',
    kkerja: 'berlari',
    lorongKata: 'Lorong',
    pilihSpesies: true, // peserta pilih buah/sayur, bukan warna
    skala: 0.95,
    y: 0,
    lajuLari: 1.75,
    // persekitaran
    langit: ['#3E8EEA', '#8CC4F5', '#E9F4FF'],
    kabus: '#CFE6FA',
    trek: '#2F64C9',
    pinggir: '#E9E4D8',
    padang: 'rumput',
    rumput: ['#5FAE4E', '#6BBB58'],
  },
  kuda: {
    id: 'kuda',
    nama: 'Lumba Kuda',
    ikon: '🐴',
    huraian: 'Kuda + joki (joki ikut jantina & warna peserta)',
    pelari: 'kuda',
    kkerja: 'berlari',
    lorongKata: 'Lorong',
    skala: 0.72,
    y: 0,
    lajuLari: 1,
    pilihSpesies: true, // joki ialah buah/sayur pilihan peserta
    // di podium: menyerong supaya joki tidak terlindung di belakang kepala kuda
    sudutPodium: 0.95,
    langit: ['#2F7ED8', '#9CCBF0', '#FBF0DC'],
    kabus: '#E6DCC6',
    trek: '#B5793F',
    pinggir: '#D8C9A6',
    padang: 'rumput',
    rumput: ['#4E9A46', '#5CA852'],
  },
  itik: {
    id: 'itik',
    nama: 'Itik Berenang',
    ikon: '🦆',
    huraian: 'Itik getah berenang di kolam',
    pelari: 'itik',
    kkerja: 'berenang',
    lorongKata: 'Laluan',
    skala: 0.95,
    y: 0.06,
    lajuLari: 1,
    langit: ['#3FA2E8', '#93D4F2', '#EAF8FF'],
    kabus: '#CFEAF7',
    trek: '#2E9BD6',
    pinggir: '#CBB68A',
    padang: 'air',
    rumput: ['#4FA35A', '#5CB167'],
  },
  burung: {
    id: 'burung',
    nama: 'Burung Terbang',
    ikon: '🐦',
    huraian: 'Burung comel terbang mengelilingi litar udara',
    pelari: 'burung',
    kkerja: 'terbang',
    lorongKata: 'Laluan',
    skala: 0.9,
    y: 1.9,
    lajuLari: 1,
    langit: ['#2E86E8', '#8FC8F7', '#FFF6E4'],
    kabus: '#DCEDFB',
    trek: '#9AD4F7',
    pinggir: '#FFFFFF',
    padang: 'awan',
    rumput: ['#58B35F', '#64BE6B'],
  },
};

// sudut lalai di podium (0 = menghadap kamera podium)
TEMA.wira.sudutPodium = 0;
TEMA.itik.sudutPodium = 0.45;
TEMA.burung.sudutPodium = 0.35;

export const SENARAI_TEMA = Object.values(TEMA);
export const adaTema = (id) => Object.prototype.hasOwnProperty.call(TEMA, id);
export const ambilTema = (id) => TEMA[id] || TEMA.wira;

/**
 * Bina seorang pelari mengikut tema.
 * @param {string} idTema
 * @param {object} p  { jantina, warna, kulit, rambut, huruf, seed }
 * @returns {{jenis:string, grup:THREE.Group, pose:(mod:string,t:number,laju?:number)=>void, wira?:object}}
 */
export function buatPelari(idTema, p) {
  if (idTema === 'kuda') return buatKuda(p);
  if (idTema === 'itik') return buatItik(p);
  if (idTema === 'burung') return buatBurung(p);
  return buatBuahSayur(p);
}

/** Tukar huruf di dada — hanya bermakna untuk tema yang ada watak manusia. */
export function setHurufPelari(pelari, huruf) {
  if (pelari.wira) setHuruf(pelari.wira, huruf);
  else if (pelari.joki) setHuruf(pelari.joki, huruf);
}

/** Huruf besar pertama nama peserta (untuk baju). */
export function hurufNama(nama) {
  const m = String(nama || '').trim().match(/[A-Za-z]/);
  return m ? m[0].toUpperCase() : '★';
}

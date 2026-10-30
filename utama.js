/* utama.js — SATU halaman untuk semua orang.
 *
 *  Mod PESERTA (lalai, telefon imbas QR):
 *    skrin 3D di atas (larian yang sama seperti projektor) + borang daftar di bawah.
 *  Mod MC (laptop yang disambung ke projektor, selepas PIN):
 *    skrin 3D penuh + bar kawalan kecil di bawah. Apa yang MC nampak = apa
 *    yang orang ramai nampak.
 *
 *  Semua animasi dikira daripada MASA, jadi telefon & projektor menunjukkan
 *  larian yang sama. Telefon yang lambat dapat berita sesuatu pusingan akan
 *  "main dari awal" (kiraan detik 3-2-1) dengan sela beberapa saat.
 */
import * as THREE from 'three';
import { buatAdegan } from './adegan.js';
import { hidupkanBunyi, Bunyi } from './bunyi.js';
import { Muzik } from './muzik.js';
import { ambilTema, cariSpesies } from './tema.js';
import { cariWarna } from './watak.js';
import { pasangMC } from './panelMC.js';
import { pasangPeserta } from './panelPeserta.js';

const $ = (id) => document.getElementById(id);
const MASA = Logik.MASA;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const no3 = (n) => String(n).padStart(3, '0');

/* ───────── Keadaan dikongsi ───────── */
const S = {
  k: null,            // data daripada pelayan (penuh untuk MC, awam untuk peserta)
  mod: 'peserta',     // 'peserta' | 'mc'
  pin: '',
  lewat: 0,           // ms: telefon memainkan larian lewat sebanyak ini
  lewatNo: 0,
  /** Jam paparan. MC = masa sebenar; telefon = masa sebenar − lewat. */
  kini() { return Api.kini() - (S.mod === 'peserta' ? S.lewat : 0); },
  terima(d) {
    S.k = d;
    const L = d && d.larian;
    if (S.mod === 'peserta' && L && L.no !== S.lewatNo) {
      S.lewatNo = L.no;
      const kini = Api.kini();
      const awalTayang = L.mula - MASA.KIRA;
      // dapat tahu semasa kiraan/larian → main dari kiraan detik 3-2-1
      // dapat tahu selepas garisan penamat → tunjuk keputusan terus
      S.lewat = kini > L.mula + Logik.masaLari(L) ? 0 : Math.max(0, Math.min(MASA.KIRA + Logik.masaLari(L), kini - awalTayang));
    }
  },
};
window.__WP = S; // untuk nyahpepijat di DevTools

if (Api.demo) {
  const b = document.createElement('div');
  b.className = 'lencana-demo'; b.textContent = 'MOD DEMO · PIN 1234';
  document.body.appendChild(b);
}

/* ───────── 3D ───────── */
const tayang = $('tayang');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.className = 'gl';
tayang.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 400);
const adegan = buatAdegan({ scene, camera, Logik });

function kualiti() {
  // telefon: tanpa bayang & resolusi lebih rendah supaya lancar
  const mc = S.mod === 'mc';
  renderer.shadowMap.enabled = mc;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mc ? 1.5 : 1.25));
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
}
function saiz() {
  const w = tayang.clientWidth, h = tayang.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(saiz).observe(tayang);
kualiti();
saiz();

/* ───────── Muzik (mod MC sahaja: 100 telefon berbunyi serentak = huru-hara) ───────── */
const btnMuzik = $('pMuzik');
function kemasButangMuzik() {
  btnMuzik.classList.toggle('tersembunyi', S.mod !== 'mc');
  btnMuzik.textContent = Muzik.aktif ? '🔊 Muzik' : '🔇 Muzik';
  btnMuzik.classList.toggle('mati', !Muzik.aktif);
}
function togolMuzik(hidup) {
  if (hidup == null) hidup = !Muzik.aktif;
  if (hidup) { Muzik.hidup(true); Muzik.mula((S.k && S.k.tema) || 'wira'); } else Muzik.hidup(false);
  kemasButangMuzik();
}
btnMuzik.onclick = () => togolMuzik();
addEventListener('keydown', (e) => {
  if (S.mod !== 'mc' || /INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return;
  if (e.code === 'KeyM') togolMuzik();
});

/* ───────── QR (hanya pada skrin MC/projektor) ───────── */
const urlPeserta = new URL('index.html', location.href).href + (Api.demo ? '?demo=1' : '');
$('pQR').src = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=0&data=' + encodeURIComponent(urlPeserta);

/* ───────── Label nama atas kepala ───────── */
const labelEl = new Map();
/**
 * Elak label bertindih. Dari sudut kamera, dua pelari boleh hampir sebaris
 * (contohnya dua pendahulu di lorong bersebelahan semasa slow-mo), jadi label
 * nama besar mereka bertindih dan satu nama tidak terbaca (dilihat dalam render).
 * Label PALING BAWAH kekal; label lain ditolak ke atas sehingga tidak bertindih.
 * Tidak melepasi had atas (bawah bar sinema) supaya label tidak terlindung.
 * Kotak: label diletak dengan translate(-50%,-100%) → [x−w/2, x+w/2] × [y−h, y].
 * @param {{el:HTMLElement,x:number,y:number}[]} diletak
 */
function rungkaiLabel(diletak, H) {
  const atasMin = H * 0.09;
  const kotak = [];
  diletak.sort((a, b) => b.y - a.y).forEach((d) => {
    const w = d.el.offsetWidth, h = d.el.offsetHeight;
    let y = d.y;
    for (let ulang = 0; ulang < 8; ulang++) {
      const k = kotak.find((q) => Math.abs(d.x - q.x) < (w + q.w) / 2 + 4 && y > q.y - q.h - 3 && y - h < q.y + 3);
      if (!k) break;
      y = k.y - k.h - 4;
    }
    y = Math.max(y, atasMin + h);
    kotak.push({ x: d.x, y, w, h });
    if (y !== d.y) d.el.style.top = y + 'px';
  });
}

function kemasLabel(senarai, tapis) {
  const ada = new Set();
  const diletak = [];
  const W = tayang.clientWidth, H = tayang.clientHeight, v = new THREE.Vector3();
  senarai.filter(tapis).forEach((l) => {
    v.copy(l.pos).project(camera);
    if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return;
    let el = labelEl.get(l.id);
    if (!el) { el = document.createElement('div'); el.className = 'p-label'; $('pLabel').appendChild(el); labelEl.set(l.id, el); }
    const teks = (l.saya ? '⭐ KAU · ' : '') + (l.kedudukanTunjuk ? `<i>${l.kedudukanTunjuk}</i>` : '') +
      `#${no3(l.no)} ${esc(l.nama)}`;
    if (el._t !== teks) { el.innerHTML = teks; el._t = teks; }
    el.classList.toggle('menang', !!l.menang);
    el.classList.toggle('saya', !!l.saya);
    el.classList.toggle('besar', !!l.besar);
    const x = ((v.x + 1) / 2) * W, y = ((1 - v.y) / 2) * H;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.display = '';
    diletak.push({ el, x, y });
    ada.add(l.id);
  });
  labelEl.forEach((el, id) => { if (!ada.has(id)) el.style.display = 'none'; });
  rungkaiLabel(diletak, H);
}

/** Pemenang larian L (nama & nombor) — daripada senarai pemenang atau senarai pelari. */
function pemenangLarian(k, L) {
  const w = k.pemenang.filter((x) => x.pusingan === L.no)[0];
  if (w) return { no: w.no, nama: w.nama, hadiah: w.hadiah };
  const p = (k.peserta || []).filter((x) => x.id === L.pemenangId)[0];
  return p ? { no: p.no, nama: p.nama, hadiah: L.hadiah } : null;
}

/* ───────── Papan maklumat atas skrin 3D ───────── */
let kiraTeks = '', bunyiDimainkan = '';
function papar(r, kini) {
  const k = S.k;
  if (!k) return;
  const mc = S.mod === 'mc';
  const L = k.larian;
  const tau = L ? kini - L.mula : -1e9;
  const T = ambilTema(k.tema);
  const sayaId = k.saya && k.saya.id;

  const lok = {
    gunung: ' · ⛰️ ATAS GUNUNG', tasik: ' · 🏞️ ATAS TASIK', awan: ' · ☁️ ATAS AWAN',
    laut: ' · 🌊 ATAS LAUT', angkasa: ' · 🚀 BUMI → ANGKASA',
  }[k.lokasi] || '';
  const tajukHtml = `${esc(k.tajuk)}<small>${T.ikon} ${esc(T.nama.toUpperCase())}${lok} · CABUTAN BERTUAH</small>`;
  if ($('pTajuk')._h !== tajukHtml) { $('pTajuk').innerHTML = tajukHtml; $('pTajuk')._h = tajukHtml; }

  if (mc) {
    Muzik.tukarTema(k.tema || 'wira');
    // slow-mo guna suasana 'kira' = gulungan snare yang makin rapat (debaran),
    // kemudian fanfar 'menang' tepat selepas garisan penamat
    Muzik.suasana(
      k.fasa === 'tamat' ? 'lobi'
        : r.fasa === 'raikan' ? 'menang'
          : r.slowmo ? 'kira'
            : r.fasa === 'lari' ? 'lari'
              : r.fasa === 'kira' ? 'kira' : 'lobi');
  }
  $('pPusingan').textContent = k.fasa === 'tamat' ? 'TAMAT'
    : L ? `PUSINGAN ${L.no} · ${k.bakiHadiah} hadiah lagi` : `${k.jumlahHadiah ?? (k.hadiah || []).length} HADIAH`;

  // hadiah: semasa larian untuk semua; semasa menunggu hanya di telefon
  // (di skrin MC, hadiah seterusnya sudah tertera pada bar MC)
  const sedangLari = L && tau < Logik.masaLari(L) + MASA.RAIKAN;
  if (sedangLari) { $('pHadiahLabel').textContent = '🎁 Hadiah pusingan ini'; $('pHadiahNama').textContent = L.hadiah; }
  else if (k.hadiahSeterusnya) { $('pHadiahLabel').textContent = '🎁 Hadiah seterusnya'; $('pHadiahNama').textContent = k.hadiahSeterusnya; }
  $('pHadiah').classList.toggle('tersembunyi',
    k.fasa === 'persediaan' || r.slowmo || !(sedangLari || (k.hadiahSeterusnya && !mc)));

  // bar sinema + papan pendahulu
  $('pSinema').classList.toggle('aktif', !!r.slowmo);
  paparPendahulu(r, k, mc, sayaId);

  // papan juara (projektor sahaja; skrin telefon terlalu kecil)
  const juara = k.pemenang.filter((w) => kini >= w.dedah).slice().reverse();
  $('pJuara').classList.toggle('tersembunyi', !mc || !juara.length);
  if (mc) {
    const html = juara.map((w) => `<li class="${w.status === 'tidakHadir' ? 'batal' : ''}"><span>P${w.pusingan}</span><span><b>#${no3(w.no)} ${esc(w.nama)}</b><br>${esc(w.hadiah)}</span></li>`).join('');
    if ($('pJuaraSenarai')._h !== html) { $('pJuaraSenarai').innerHTML = html; $('pJuaraSenarai')._h = html; }
  }

  // lobi + QR (projektor sahaja)
  const lobi = !L || r.fasa === 'sedia' || k.fasa === 'tamat';
  $('pLobi').classList.toggle('tersembunyi', !mc || !lobi || k.fasa === 'persediaan');
  $('pQR').classList.toggle('tersembunyi', k.fasa === 'tamat');
  $('pLobiTajuk').textContent = k.fasa === 'tamat' ? 'Terima kasih semua! 🎉' : 'Imbas untuk sertai!';
  $('pLobiBil').textContent = `${k.jumlahPeserta} ${T.pelari} berdaftar · ${k.layak} layak`;

  // kiraan detik
  let teks = '';
  if (L && tau < 0 && tau > -MASA.KIRA) teks = String(Math.ceil(-tau / 1000));
  else if (L && tau >= 0 && tau < 800) teks = 'PECUT!';
  if (teks !== kiraTeks) {
    kiraTeks = teks;
    $('pKira').className = 'p-kira' + (teks === 'PECUT!' ? ' pecut' : '');
    $('pKira').innerHTML = teks ? `<span class="denyut">${teks}</span>` : '';
    if (mc && teks && teks !== 'PECUT!') Bunyi.detik();
    if (mc && teks === 'PECUT!') Bunyi.pistol();
  }
  if (mc && L && r.fasa === 'lari' && r.u > 0.72 && bunyiDimainkan !== 'debar' + L.no + Math.floor(r.u * 8)) {
    bunyiDimainkan = 'debar' + L.no + Math.floor(r.u * 8); Bunyi.debar();
  }

  // kilat photo-finish + sepanduk juara
  $('pKilat').style.opacity = r.kilat.toFixed(3);
  const tr = (tau - Logik.masaLari(L)) / 1000;
  const tunjukMenang = L && tr > 0.9 && tr < MASA.RAIKAN / 1000 + 1.5;
  $('pMenang').classList.toggle('tersembunyi', !tunjukMenang);
  if (tunjukMenang) {
    const w = pemenangLarian(k, L);
    if (w) {
      $('pM1').textContent = (sayaId && L.pemenangId === sayaId) ? '🎉 KAU MENANG!' : `🏆 JUARA PUSINGAN ${L.no}`;
      $('pM2').textContent = `#${no3(w.no)} ${w.nama}`;
      $('pM3').textContent = `🎁 ${w.hadiah}`;
    }
    if (mc && bunyiDimainkan !== 'menang' + L.no) { bunyiDimainkan = 'menang' + L.no; Bunyi.menang(); }
  }

  // label nama
  //  - larian biasa : 3 teratas (pingat)
  //  - SLOW-MO      : HANYA 4 pendahulu yang difokuskan, label besar + nombor
  //                   kedudukan langsung, supaya mata penonton tahu siapa diikut
  const PINGAT = ['🥇', '🥈', '🥉', '4️⃣'];
  const tanda = new Map();
  if (r.fasa === 'lari') {
    const ikut = r.slowmo ? r.label.filter((l) => l.fokus) : r.label;
    ikut.slice().sort((a, b) => a.kedudukan - b.kedudukan).slice(0, r.slowmo ? 4 : 3)
      .forEach((l, i) => tanda.set(l.id, PINGAT[i]));
  }
  r.label.forEach((l) => {
    l.kedudukanTunjuk = tanda.get(l.id) || '';
    l.saya = !!sayaId && l.id === sayaId;
    l.besar = !!r.slowmo && tanda.has(l.id);
  });
  kemasLabel(r.label, (l) => {
    if (l.saya) return true;
    if (r.fasa === 'lari') return tanda.has(l.id);
    if (r.fasa === 'raikan') return l.menang;
    if (r.fasa === 'lobi' || r.fasa === 'kira') return mc; // telefon: elak 12 label bertindih
    return false;
  });
}

/* ───────── PENDAHULU dalam bar sinema bawah (slow-mo sahaja) ─────────
   4 pendahulu yang difokuskan (3 di telefon), susunan langsung, nama besar.
   Hanya semasa slow-mo: larian biasa kekal bersih (cuma 3 label kecil). */
function paparPendahulu(r, k, mc, sayaId) {
  const el = $('pDepanSenarai');
  let html = '';
  if (r.slowmo) {
    const ikutId = new Map((k.peserta || []).map((p) => [p.id, p]));
    const T = ambilTema(k.tema);
    const PINGAT = ['🥇', '🥈', '🥉', '4️⃣'];
    html = r.label.filter((l) => l.fokus).sort((a, b) => a.kedudukan - b.kedudukan).slice(0, mc ? 4 : 3).map((l, i) => {
      const p = ikutId.get(l.id) || {};
      // buah/sayur: emoji spesies; tema lain: bulatan warna pilihan peserta
      const w = cariWarna(p.warna);
      const ikon = T.pilihSpesies
        ? `<em>${(cariSpesies(p.spesies) || {}).emoji || ''}</em>`
        : `<em class="titik" style="--w:hsl(${w.hue} ${Math.round(w.sat * 100)}% 52%)"></em>`;
      const kelas = (i === 0 ? 'satu' : '') + (sayaId && l.id === sayaId ? ' saya' : '');
      return `<span class="${kelas}">${PINGAT[i]}${ikon}<b>#${no3(l.no)} ${esc(l.nama)}</b></span>`;
    }).join('');
  }
  if (el._h !== html) { el.innerHTML = html; el._h = html; }
}

/* ───────── Panel ───────── */
const ctx = {
  S, esc, no3,
  /** Dipanggil oleh panel MC selepas PIN betul (klik pengguna → bunyi dibenarkan). */
  masukMC(pin, data) {
    S.mod = 'mc'; S.pin = pin; S.lewat = 0;
    sessionStorage.setItem('wp_pin', pin);
    document.body.classList.remove('mod-peserta');
    document.body.classList.add('mod-mc');
    hidupkanBunyi();
    S.terima(data);
    if (data.muzik !== false) togolMuzik(true);
    kemasButangMuzik();
    kualiti(); saiz();
    berhentiTarikPeserta();
    document.documentElement.requestFullscreen?.().catch(() => {});
  },
  keluarMC() {
    sessionStorage.removeItem('wp_pin');
    location.href = location.pathname + location.search; // muat semula sebagai peserta
  },
  togolMuzik, kemasButangMuzik,
  tarikSegera() { if (S.mod === 'mc') tarikMC(); else jadualkan(50); },
};
const mcPanel = pasangMC(ctx);
const pesertaPanel = pasangPeserta(ctx);

/* ───────── Tarik data ───────── */

// MC: data penuh setiap 1.5 s (satu peranti sahaja, tiada isu kuota)
function tarikMC() {
  if (S.mod !== 'mc' || !S.pin || mcPanel.sibuk()) return;
  Api.penuh(S.pin).then((d) => { S.terima(d); mcPanel.lukis(); }, (e) => {
    if (/PIN/.test(e.message || '')) ctx.keluarMC();
  });
}
setInterval(tarikMC, 1500);

/* Peserta: tarikan ADAPTIF — supaya 100-300 telefon tidak membanjiri Google
 * Apps Script. Jumlah permintaan kekal ~10-15 sesaat tidak kira berapa ramai:
 *  - biasa         : setiap N/10 saat (min 5 s, maks 20 s) + rawak
 *  - semasa larian : tidak menarik; tunggu garisan penamat, kemudian sekali
 *                    dalam tetingkap rawak N/12 s (2-12 s)
 *  - gagal         : undur 2×, 4×, 8×… hingga 30 s
 *  - tab tersorok  : 20 s
 * Larian tetap dilukis lancar kerana semuanya dikira daripada jam. */
let jadual = 0, gagalBerturut = 0;
function fasaSebenar(L) {
  if (!L) return 'sedia';
  const t = Api.kini();
  if (t < L.mula) return 'kira';
  if (t < L.mula + Logik.masaLari(L)) return 'lari';
  if (t < L.mula + Logik.masaLari(L) + MASA.RAIKAN) return 'raikan';
  return 'sedia';
}
function selaSeterusnya() {
  const k = S.k;
  const N = k ? k.jumlahPeserta : 0;
  const L = k && k.larian;
  const f = fasaSebenar(L);
  if (gagalBerturut) return Math.min(30000, 3000 * 2 ** gagalBerturut) * (0.6 + Math.random() * 0.8);
  if (document.hidden) return 20000;
  if (k && k.fasa === 'tamat') return 30000;
  if (f === 'kira' || f === 'lari') {
    const sebar = Math.min(12, Math.max(2, N / 12)) * 1000;
    return Math.max(300, L.mula + Logik.masaLari(L) - Api.kini()) + Math.random() * sebar;
  }
  const asas = Math.min(20, Math.max(5, N / 10)) * 1000;
  return asas * (0.7 + Math.random() * 0.6);
}
function jadualkan(ms) {
  clearTimeout(jadual);
  if (S.mod !== 'peserta') return;
  jadual = setTimeout(tarikPeserta, ms ?? selaSeterusnya());
}
function berhentiTarikPeserta() { clearTimeout(jadual); }
function tarikPeserta() {
  if (S.mod !== 'peserta') return;
  if (pesertaPanel.sibuk()) { jadualkan(1500); return; }
  Api.awam()
    .then((d) => { S.terima(d); gagalBerturut = 0; pesertaPanel.lukis(); })
    .catch(() => { gagalBerturut = Math.min(gagalBerturut + 1, 4); })
    .finally(() => jadualkan());
}
ctx.jadualkan = jadualkan;

Api.bilaBerubah(() => ctx.tarikSegera()); // Mod Demo: tab lain ubah data
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.mod === 'peserta') jadualkan(200); });

/* ───────── Gelung ───────── */
function gelung() {
  const kini = S.kini();
  const r = adegan.kemas(S.k, kini);
  papar(r, kini);
  renderer.render(scene, camera);
  requestAnimationFrame(gelung);
}
gelung();
setInterval(() => { if (S.mod === 'mc') mcPanel.lukis(); else pesertaPanel.lukis(); }, 300);

/* ───────── Mula ───────── */
// PIN tersimpan (muat semula halaman MC) → tunjuk tetingkap PIN yang sudah terisi;
// klik "Masuk" itu juga membenarkan bunyi (dasar pelayar).
mcPanel.mula(sessionStorage.getItem('wp_pin') || '', /(^|[#&])mc\b/.test(location.hash));
tarikPeserta();

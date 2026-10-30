/* panelPeserta.js — Bahagian bawah skrin telefon peserta.
 * Skrin 3D di atas sama seperti projektor; di sini hanya: daftar, status, menang.
 */
import { WARNA_WIRA, KULIT, RAMBUT } from './watak.js';
import { ambilTema, SPESIES } from './tema.js';

const rawak = (n) => Math.floor(Math.random() * n);
/** Warna CSS untuk bulatan pemilih (sepadan dengan hsl() dalam model 3D). */
const warnaHex = (x) => `hsl(${x.hue} ${Math.round(x.sat * 100)}% 52%)`;

export function pasangPeserta(ctx) {
  const { S, esc, no3 } = ctx;
  const $ = (id) => document.getElementById(id);
  const MASA = Logik.MASA;
  const bawah = $('tBawah');

  let ralat = '', sibuk = false, tandaLalu = '', sudahSorak = 0, mintaKod = 0;
  let namaTaip = '';
  const pilih = {
    warna: WARNA_WIRA[rawak(WARNA_WIRA.length)].id,
    spesies: SPESIES[rawak(SPESIES.length)].id,
    kulit: rawak(KULIT.length),
    rambut: rawak(RAMBUT.length),
  };

  /** Fasa ikut jam PAPARAN telefon (mungkin lewat beberapa saat daripada projektor). */
  function fasaL(L) {
    if (!L) return 'sedia';
    const t = S.kini();
    if (t < L.mula) return 'kira';
    if (t < L.mula + Logik.masaLari(L)) return 'lari';
    if (t < L.mula + Logik.masaLari(L) + MASA.RAIKAN) return 'raikan';
    return 'sedia';
  }

  /** Kemenangan saya, tetapi hanya SELEPAS larian di telefon ini sampai garisan penamat. */
  function menangSaya() {
    const K = S.k, s = K && K.saya;
    if (!s) return null;
    const L = K.larian;
    const habisDiSini = L && S.kini() >= L.mula + Logik.masaLari(L) + 900;
    if (s.menang) {
      if (L && s.menang.pusingan === L.no && !habisDiSini) return null; // jangan dedah sebelum animasi tamat
      return s.menang;
    }
    if (L && L.pemenangId === s.id && habisDiSini) return { pusingan: L.no, hadiah: L.hadiah, kod: null, status: 'menang' };
    return null;
  }

  function pemenangL(K, L) {
    const w = K.pemenang.filter((x) => x.pusingan === L.no)[0];
    if (w) return w;
    return (K.peserta || []).filter((x) => x.id === L.pemenangId)[0] || null;
  }

  /* ── skrin ── */
  function kotakHadiah(label, nama) {
    return `<div class="kad" style="text-align:center"><div class="label">${label}</div>
      <div style="font-size:1.3rem;font-weight:800;color:var(--biru)">🎁 ${esc(nama)}</div></div>`;
  }

  function skrinPilih() {
    const T = ambilTema(S.k && S.k.tema);
    const w = WARNA_WIRA.find((x) => x.id === pilih.warna);
    const grid = (jenis) => SPESIES.filter((s) => s.jenis === jenis).map((s) => `
      <button data-spesies="${s.id}" class="${pilih.spesies === s.id ? 'aktif' : ''}"><b>${s.emoji}</b><span>${esc(s.nama)}</span></button>`).join('');
    return `<div class="kad">
      <h2 style="margin:0 0 .6em;color:var(--biru);font-size:1.2rem">🏁 Sertai cabutan bertuah</h2>
      ${T.pilihSpesies ? `
      <div class="medan">
        <label>1. Pilih watak kau</label>
        <div class="label" style="margin:.4em 0 .2em">🍎 Buah</div><div class="pilih-spesies">${grid('buah')}</div>
        <div class="label" style="margin:.7em 0 .2em">🥦 Sayur</div><div class="pilih-spesies">${grid('sayur')}</div>
      </div>` : `
      <div class="medan">
        <label>1. Pilih warna ${esc(T.pelari)} kau</label>
        <div class="pilih-warna">${WARNA_WIRA.map((x) => `
          <button data-warna="${x.id}" class="${pilih.warna === x.id ? 'aktif' : ''}" title="${esc(x.nama)}"
            style="--w:${warnaHex(x)}"><i></i><span>${esc(x.nama)}</span></button>`).join('')}</div>
        <div class="bantu">Pilihan kau: <b>${esc(w ? w.nama : '')}</b></div>
      </div>`}
      <div class="medan">
        <label>2. Nama kau</label>
        <input class="input" id="tNama" maxlength="28" autocomplete="name" placeholder="Contoh: Aina" value="${esc(namaTaip)}">
      </div>
      ${ralat ? `<p class="ralat">${esc(ralat)}</p>` : ''}
      <button class="btn btn-hijau btn-besar" id="tSertai"${sibuk ? ' disabled' : ''}>${sibuk ? 'Sekejap…' : '🏁 SERTAI LARIAN'}</button>
    </div>`;
  }

  function skrinStatus() {
    const K = S.k, L = K.larian, saya = K.saya, f = fasaL(L);
    const diTrek = L && (L.lorong || []).indexOf(saya.id) >= 0;
    const T = ambilTema(K.tema);
    let h = '';
    if (f === 'kira') {
      h += `<div class="status-besar st-lari">Pusingan ${L.no}<b>BERSEDIA…</b>${diTrek ? '⭐ Kau ada di trek pusingan ini!' : 'Larian bermula sekejap lagi'}</div>`;
      h += kotakHadiah('Hadiah pusingan ini', L.hadiah);
    } else if (f === 'lari') {
      h += `<div class="status-besar st-lari">Pusingan ${L.no}<b>${T.kkerja === 'terbang' ? 'TERBANG!' : T.kkerja === 'berenang' ? 'BERENANG!' : 'LARI!'}</b>${diTrek ? '⭐ Cari label "KAU" di atas!' : 'Siapa juara?'}</div>`;
      h += kotakHadiah('Hadiah pusingan ini', L.hadiah);
    } else {
      const w = L && f === 'raikan' ? pemenangL(K, L) : null;
      h += w && w.no === saya.no
        ? `<div class="status-besar st-menang">Pusingan ${L.no}<b>🏁 …</b>Tengok siapa juara!</div>`
        : w
        ? `<div class="status-besar st-sedia">Pusingan ${L.no}<b>Belum rezeki</b>Pemenang: #${no3(w.no)} ${esc(w.nama)}</div>`
        : K.fasa === 'tamat'
          ? '<div class="status-besar st-sedia">Acara tamat<b>Terima kasih!</b>Jumpa lagi</div>'
          : '<div class="status-besar st-sedia">Kau sudah berdaftar<b>SEDIA</b>Tunggu MC mula pusingan</div>';
      h += `<div class="angka">
        <div><b>#${no3(saya.no)}</b><span>Nombor kau</span></div>
        <div><b>${K.jumlahPeserta}</b><span>Peserta</span></div>
        <div><b>${K.pusingan}</b><span>Pusingan</span></div></div>`;
      if (K.fasa !== 'tamat') h += K.hadiahSeterusnya ? kotakHadiah('Hadiah seterusnya', K.hadiahSeterusnya)
        : '<div class="kad" style="text-align:center">Semua hadiah sudah dicabut.</div>';
    }
    // senarai pemenang (yang sudah sampai garisan penamat di telefon ini)
    const juara = K.pemenang.filter((x) => S.kini() >= x.dedah).slice().reverse();
    if (juara.length) {
      h += `<div class="kad" style="margin-top:12px"><div class="label">🏆 Pemenang</div><ul class="senarai">${juara.map((x) =>
        `<li class="${x.status === 'tidakHadir' ? 'batal' : ''}"><span>${x.pusingan}. #${no3(x.no)} ${esc(x.nama)}</span>
         <span style="color:var(--kelabu);text-align:right">${esc(x.hadiah)}</span></li>`).join('')}</ul></div>`;
    }
    return h;
  }

  function skrinMenang(m) {
    return `<div class="status-besar st-menang">Pusingan ${m.pusingan}<b>🎉 KAU MENANG!</b>Tahniah ${esc(S.k.saya.nama)}</div>
      <div class="kad" style="text-align:center">
        <div class="label">Hadiah kau</div>
        <div style="font-size:1.7rem;font-weight:900;color:var(--biru);line-height:1.2">🎁 ${esc(m.hadiah)}</div>
        <hr style="border:0;border-top:1px solid #eef0f4;margin:14px 0">
        <div class="label">Tunjuk kod ini di kaunter hadiah</div>
        ${m.kod ? `<div class="kod-tuntut">${esc(m.kod)}</div>` : '<div class="kod-tuntut" style="opacity:.4">····</div><div class="bantu">Kod sedang dimuatkan…</div>'}
        <p class="bantu">Jangan tutup halaman ini sehingga hadiah diambil.</p>
      </div>`;
  }

  function skrinTidakHadir(m) {
    return `<div class="status-besar st-sedia">Pusingan ${m.pusingan}<b>Hadiah dilepaskan</b>Kau ditanda tidak hadir</div>
      <div class="kad" style="text-align:center">Hadiah <b>${esc(m.hadiah)}</b> telah dicabut semula.
      Sila jumpa pegawai di kaunter jika ini satu kesilapan.</div>`;
  }

  /* ── lukis ── */
  function tanda() {
    const K = S.k;
    if (!K) return 'muat|' + ralat + sibuk;
    const s = K.saya, m = menangSaya();
    // belum daftar: borang hanya dilukis semula bila perlu (elak papan kekunci telefon berkelip)
    if (!s) return ['borang', K.fasa === 'persediaan' ? 'p' : K.fasa === 'tamat' ? 't' : 'd', K.tema,
      sibuk ? 1 : 0, ralat, pilih.warna + pilih.spesies].join('|');
    return [K.fasa, K.pusingan, K.jumlahPeserta, K.hadiahSeterusnya, K.tema,
      K.larian ? fasaL(K.larian) + K.larian.no : '-',
      s ? s.no : 'x', m ? m.pusingan + m.status + (m.kod || '') : '-',
      K.pemenang.filter((x) => S.kini() >= x.dedah).map((x) => x.status).join(''),
      sibuk ? 1 : 0, ralat, pilih.warna + pilih.spesies].join('|');
  }

  function lukis(paksa) {
    if (S.mod !== 'peserta') return;
    const t = tanda();
    if (!paksa && t === tandaLalu) return;
    const K = S.k;
    const elNama = $('tNama'); if (elNama) namaTaip = elNama.value;
    const fokusNama = elNama && document.activeElement === elNama;
    if (!paksa && fokusNama) return; // sedang menaip: tunggu
    tandaLalu = t;

    let html;
    const m = menangSaya();
    if (!K) html = '<div class="kad" style="text-align:center">Memuatkan…</div>';
    else if (!K.saya) html = K.fasa === 'persediaan'
      ? '<div class="status-besar st-sedia">Wira Pecut<b>Belum dibuka</b>Tunggu pegawai membuka pendaftaran</div>'
      : K.fasa === 'tamat' ? '<div class="status-besar st-sedia">Acara tamat<b>Terima kasih!</b></div>' : skrinPilih();
    else if (m && m.status === 'tidakHadir') html = skrinTidakHadir(m);
    else if (m) html = skrinMenang(m);
    else html = skrinStatus();

    bawah.innerHTML = html;
    pasang();
    if (fokusNama && $('tNama')) { const el = $('tNama'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }

    // raikan sekali bagi setiap kemenangan
    if (m && m.status === 'menang' && sudahSorak !== m.pusingan) {
      sudahSorak = m.pusingan;
      mulakanKonfeti();
      try { navigator.vibrate?.([120, 80, 120, 80, 420]); } catch (e) { /* abaikan */ }
      scrollTo({ top: document.getElementById('lembar').offsetTop - 10, behavior: 'smooth' });
    }
    // menang dikesan daripada larian tetapi kod belum sampai → tarik sekali lagi
    if (m && !m.kod && mintaKod !== m.pusingan) {
      mintaKod = m.pusingan;
      ctx.jadualkan(800 + Math.random() * 2500);
    }
  }

  function pasang() {
    bawah.querySelectorAll('.pilih-spesies button').forEach((b) => {
      b.onclick = () => { pilih.spesies = b.dataset.spesies; lukis(true); };
    });
    bawah.querySelectorAll('.pilih-warna button').forEach((b) => {
      b.onclick = () => { pilih.warna = b.dataset.warna; lukis(true); };
    });
    const elNama = $('tNama');
    if (elNama) elNama.oninput = () => { namaTaip = elNama.value; };
    const sertai = $('tSertai');
    if (sertai) sertai.onclick = () => {
      const nama = (namaTaip || '').replace(/\s+/g, ' ').trim();
      if (nama.length < 2) { ralat = 'Sila masukkan nama kau.'; lukis(true); return; }
      sibuk = true; ralat = ''; lukis(true);
      // Ramai imbas QR serentak → pelayan mungkin "sibuk". Cuba semula sendiri
      // hingga 3 kali; selamat kerana peranti yang sama tidak didaftar dua kali.
      const cuba = (baki) => Api.buat('daftar', { ...pilih, nama, peranti: Api.peranti() })
        .then((d) => { S.terima(d); sibuk = false; lukis(true); })
        .catch((e) => {
          if (baki > 0 && /sibuk|sambungan/i.test(e.message || '')) {
            setTimeout(() => cuba(baki - 1), 1500 + Math.random() * 2500);
            return;
          }
          ralat = e.message || 'Tidak berjaya.'; sibuk = false; lukis(true);
        });
      cuba(3);
    };
  }

  /* ── konfeti 2D (telefon pemenang) ── */
  const kf = $('konfeti2d');
  const kx = kf.getContext('2d');
  let zarah = [], konfetiSampai = 0;
  function mulakanKonfeti(saat = 7) {
    kf.width = innerWidth; kf.height = innerHeight;
    const warna = ['#f5c542', '#ff7a1a', '#22a45d', '#1d4fb8', '#e5484d', '#ffffff'];
    zarah = Array.from({ length: 160 }, () => ({
      x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6,
      w: 6 + Math.random() * 8, h: 9 + Math.random() * 10,
      vy: 2.2 + Math.random() * 3.2, vx: -1.2 + Math.random() * 2.4,
      a: Math.random() * Math.PI, va: -0.16 + Math.random() * 0.32, c: warna[rawak(warna.length)],
    }));
    konfetiSampai = performance.now() + saat * 1000;
    lukisKonfeti();
  }
  function lukisKonfeti() {
    kx.clearRect(0, 0, kf.width, kf.height);
    if (performance.now() > konfetiSampai) { zarah = []; return; }
    for (const z of zarah) {
      z.y += z.vy; z.x += z.vx; z.a += z.va;
      if (z.y > kf.height + 30) { z.y = -20; z.x = Math.random() * kf.width; }
      kx.save(); kx.translate(z.x, z.y); kx.rotate(z.a);
      kx.fillStyle = z.c; kx.fillRect(-z.w / 2, -z.h / 2, z.w, z.h); kx.restore();
    }
    requestAnimationFrame(lukisKonfeti);
  }
  addEventListener('resize', () => { kf.width = innerWidth; kf.height = innerHeight; });

  return { lukis, sibuk: () => sibuk };
}

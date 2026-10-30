/* panelMC.js — Kawalan MC pada SKRIN YANG SAMA dengan projektor.
 *
 * Prinsip: orang ramai nampak skrin ini juga, jadi kawalan dibuat kecil.
 *  - Bar bawah   : hadiah seterusnya + SATU butang besar "MULA PUSINGAN n" + ⚙️
 *                  (bar hilang sendiri semasa larian supaya skrin bersih)
 *  - Tetingkap   : PIN, Langkah 1 (hadiah & tema), ⚙️ Lain-lain, ringkasan tamat
 *  - Kod tuntutan TIDAK ditunjuk besar di skrin (orang ramai nampak). Ada dalam
 *    ⚙️ → "Senarai pemenang & kod" (tertutup) dan fail CSV.
 */
const TEMA = [
  { id: 'wira', ikon: '🥕', nama: 'Buah & Sayur', huraian: '20 buah & sayur comel' },
  { id: 'kuda', ikon: '🐴', nama: 'Lumba Kuda', huraian: 'Kuda + joki' },
  { id: 'itik', ikon: '🦆', nama: 'Itik Berenang', huraian: 'Itik getah di kolam' },
  { id: 'burung', ikon: '🐦', nama: 'Burung Terbang', huraian: 'Burung di litar udara' },
];
const cariTema = (id) => TEMA.find((t) => t.id === id) || TEMA[0];

export function pasangMC(ctx) {
  const { S, esc, no3 } = ctx;
  const $ = (id) => document.getElementById(id);
  const bar = $('mcBar'), tingkap = $('mcTingkap'), isi = $('mcIsi');

  let ralat = '';
  let sibuk = false;
  let buka = '';          // '' | 'pin' | 'lain'  (persediaan & tamat dipaksa)
  let pinTaip = '';
  let tandaLalu = '';
  let draf = { tajuk: '', hadiah: '', tema: 'wira', muzik: true };

  const k = () => S.k;
  const mc = () => S.mod === 'mc';
  const kini = () => Api.kini();

  function fasaLarian() { return k() && k().larian ? Logik.fasaLarian(k(), kini()) : 'sedia'; }
  function berjalan() { return fasaLarian() !== 'sedia'; }
  function pemenangTerkini() {
    const K = k();
    if (!K || !K.pemenang.length) return null;
    const w = K.pemenang[K.pemenang.length - 1];
    return kini() >= w.dedah ? w : null;
  }

  /* ── pelayan ── */
  function buat(t, d) {
    if (sibuk) return;
    sibuk = true; ralat = ''; lukis(true);
    Api.buat(t, d, S.pin).then((data) => {
      S.terima(data); sibuk = false; lukis(true);
    }, (e) => { ralat = e.message || 'Tidak berjaya.'; sibuk = false; lukis(true); });
  }

  /* ── kandungan tetingkap ── */
  function tPin() {
    return `<h2 style="margin-top:0;color:var(--biru)">🎙️ Masuk sebagai MC</h2>
      <p>Masukkan PIN. Skrin ini akan jadi skrin pentas (penuh) dengan butang kawalan di bawah.
      Sambungkan laptop ke projektor.</p>
      <input class="input" id="mPinInput" type="password" inputmode="numeric" placeholder="PIN"
        style="text-align:center;font-size:1.5rem;letter-spacing:.3em" value="${esc(pinTaip)}">
      ${ralat ? `<p class="ralat" style="margin-top:12px">${esc(ralat)}</p>` : ''}
      <button class="btn btn-hijau btn-besar" id="mMasuk" style="margin-top:14px">${sibuk ? 'Sekejap…' : '▶ Masuk'}</button>
      <button class="btn" id="mTutup" style="width:100%;margin-top:8px">Batal</button>
      ${Api.demo ? '<p class="bantu" style="margin-top:10px">Mod Demo: PIN ialah <b>1234</b></p>' : ''}`;
  }

  function tSediakan() {
    return `<div class="arahan">LANGKAH 1 — Pilih tema & masukkan senarai hadiah.
        <small>Satu hadiah satu baris. Baris paling atas dicabut dahulu.</small></div>
      <div class="medan"><label>Tema larian</label><div class="pilih-tema">
        ${TEMA.map((t) => `<button data-tema="${t.id}" class="${draf.tema === t.id ? 'aktif' : ''}">
          <b>${t.ikon}</b><span>${esc(t.nama)}</span><i>${esc(t.huraian)}</i></button>`).join('')}
      </div></div>
      <div class="medan"><label><input type="checkbox" id="mMuzik"${draf.muzik ? ' checked' : ''}> Muzik latar</label></div>
      <div class="medan"><label>Nama acara</label>
        <input class="input" id="mTajuk" maxlength="60" placeholder="Contoh: Hari Pemakanan PKB Miri 2026" value="${esc(draf.tajuk)}"></div>
      <div class="medan"><label>Senarai hadiah</label>
        <textarea class="input" id="mHadiah" rows="7" placeholder="Baucar RM100&#10;Hamper Sihat&#10;Botol Air">${esc(draf.hadiah)}</textarea>
        <div class="bantu">Bilangan baris = bilangan pusingan larian.</div></div>
      ${ralat ? `<p class="ralat">${esc(ralat)}</p>` : ''}
      <button class="btn btn-hijau btn-besar" id="mSimpan">${sibuk ? 'Sekejap…' : '✓ Simpan & Buka Pendaftaran'}</button>
      <button class="btn" id="mKeluar" style="width:100%;margin-top:8px">Keluar mod MC</button>`;
  }

  function senaraiKod() {
    const K = k();
    const ada = K.pemenang.filter((x) => kini() >= x.dedah);
    if (!ada.length) return '';
    return `<details class="kad-dalam"><summary>🔒 Senarai pemenang & kod tuntutan (${ada.length})</summary>
      <ul class="senarai">${ada.slice().reverse().map((x) => `<li class="${x.status === 'tidakHadir' ? 'batal' : ''}">
        <span><b>${x.pusingan}.</b> #${no3(x.no)} ${esc(x.nama)}<br><small>${esc(x.hadiah)}</small></span>
        <span style="font-weight:900;letter-spacing:.15em;color:var(--oren)">${esc(x.kod)}</span></li>`).join('')}</ul>
      <div class="bantu">Skrin ini dilihat orang ramai. Buka senarai ini hanya bila perlu.</div></details>`;
  }

  function tLain() {
    const K = k();
    const T = cariTema(K.tema);
    return `<h2 style="margin-top:0;color:var(--biru)">⚙️ Lain-lain</h2>
      <div class="angka">
        <div><b>${K.jumlahPeserta}</b><span>Peserta</span></div>
        <div><b>${K.bakiHadiah}</b><span>Hadiah tinggal</span></div>
        <div><b>${K.pusingan}</b><span>Pusingan selesai</span></div>
      </div>
      <div style="display:grid;gap:10px">
      ${K.pusingan === 0 ? `<div><div class="label">Tukar tema</div><div class="pilih-tema tukar-tema">
          ${TEMA.map((t) => `<button data-tema="${t.id}" class="${K.tema === t.id ? 'aktif' : ''}"><b>${t.ikon}</b><span>${esc(t.nama)}</span></button>`).join('')}
        </div><div class="bantu">Tema terkunci selepas pusingan pertama bermula.</div></div>`
        : `<div class="bantu">Tema: <b>${T.ikon} ${esc(T.nama)}</b> (terkunci)</div>`}
      <button class="btn btn-biru" id="mMuzikTukar">${K.muzik === false ? '🔇 Muzik: MATI (tekan untuk hidupkan)' : '🔊 Muzik: HIDUP (tekan untuk matikan)'}</button>
      <button class="btn btn-biru" id="mPenuh">⛶ Skrin penuh</button>
      ${Api.demo ? '<button class="btn btn-biru" id="mDemoIsi">+ Tambah 20 peserta contoh (demo)</button>' : ''}
      ${K.pemenang.length ? '<button class="btn btn-biru" id="mCsv">⬇ Muat turun senarai pemenang (CSV)</button>' : ''}
      ${senaraiKod()}
      ${K.fasa !== 'tamat' ? '<button class="btn btn-merah" id="mTamat">■ Tamatkan Acara</button>' : ''}
      <button class="btn btn-merah" id="mReset">🗑 Padam semua & mula acara baharu</button>
      <button class="btn" id="mKeluar">Keluar mod MC</button>
      ${ralat ? `<p class="ralat">${esc(ralat)}</p>` : ''}
      <button class="btn btn-hijau btn-besar" id="mTutup">✓ Tutup</button>
      </div>`;
  }

  function tTamat() {
    const K = k();
    const menang = K.pemenang.filter((x) => x.status === 'menang');
    const baki = K.bakiHadiah;
    return `<div class="status-besar st-menang"><b>Acara tamat</b>${menang.length} pemenang</div>
      ${senaraiKod()}
      ${baki ? `<button class="btn btn-hijau btn-besar" id="mSambung" style="margin-top:12px">▶ Sambung semula (${baki} hadiah belum dicabut)</button>` : ''}
      <button class="btn btn-biru btn-besar" id="mCsv" style="margin-top:12px">⬇ Muat turun senarai pemenang (CSV)</button>
      <button class="btn btn-merah" id="mReset" style="width:100%;margin-top:10px">🗑 Padam semua & mula acara baharu</button>
      <button class="btn" id="mKeluar" style="width:100%;margin-top:8px">Keluar mod MC</button>
      ${ralat ? `<p class="ralat" style="margin-top:10px">${esc(ralat)}</p>` : ''}
      <button class="btn" id="mTutup" style="width:100%;margin-top:8px">Tutup (tunjuk skrin penuh)</button>`;
  }

  /* ── bar bawah ── */
  function tBar() {
    const K = k();
    const w = pemenangTerkini();
    const seterusnya = K.hadiahSeterusnya;
    const n = K.pusingan + 1;
    let h = '';
    if (w && w.status === 'menang') {
      h += `<button class="btn btn-merah mc-kecil" id="mTakHadir">✗ #${no3(w.no)} ${esc(w.nama)} tidak hadir? Cabut semula</button>`;
    }
    h += '<div class="mc-baris">';
    if (seterusnya) {
      const boleh = !sibuk && K.layak > 0;
      h += `<div class="mc-hadiah"><span>🎁 Hadiah pusingan ${n}</span><b>${esc(seterusnya)}</b></div>
        <button class="btn btn-hijau mc-mula" id="mMula"${boleh ? '' : ' disabled'}>${
          sibuk ? 'Sekejap…' : K.layak === 0 ? (K.jumlahPeserta ? 'Tiada peserta layak' : 'Belum ada peserta') : `▶ MULA PUSINGAN ${n}`}</button>`;
    } else {
      h += `<div class="mc-hadiah"><span>Semua hadiah sudah dicabut</span><b>🎉 Tahniah semua!</b></div>
        <button class="btn btn-oren mc-mula" id="mTamat">■ Tamatkan Acara</button>`;
    }
    h += '<button class="btn mc-ikon" id="mLain" title="Lain-lain">⚙️</button></div>';
    if (ralat) h += `<div class="ralat mc-ralat">${esc(ralat)}</div>`;
    return h;
  }

  /* ── lukis ── */
  function keadaanTingkap() {
    if (!mc()) return buka === 'pin' ? 'pin' : '';
    const K = k();
    if (!K) return '';
    if (K.fasa === 'persediaan') return 'sediakan';
    if (buka === 'lain') return 'lain';
    if (K.fasa === 'tamat' && buka !== 'tutupTamat') return 'tamat';
    return '';
  }

  function tanda() {
    const K = k();
    const w = K && K.pemenang[K.pemenang.length - 1];
    return [S.mod, keadaanTingkap(), sibuk ? 1 : 0, ralat, draf.tema, draf.muzik,
      K ? [K.fasa, K.pusingan, K.jumlahPeserta, K.pemenang.length, K.layak, K.bakiHadiah,
        K.hadiahSeterusnya, K.tema, K.muzik, berjalan() ? 1 : 0,
        w ? (kini() >= w.dedah ? 'buka' + w.status : 'tutup') : '-'].join(',') : '-'].join('|');
  }

  function lukis(paksa) {
    const t = tanda();
    if (!paksa && t === tandaLalu) return;
    tandaLalu = t;
    // jangan lukis semula tetingkap ketika pegawai sedang menaip
    const fokus = document.activeElement;
    const sedangTaip = fokus && tingkap.contains(fokus) && /INPUT|TEXTAREA/.test(fokus.tagName) && !paksa;

    const jenis = keadaanTingkap();
    tingkap.classList.toggle('tersembunyi', !jenis);
    if (jenis && !sedangTaip) {
      isi.innerHTML = jenis === 'pin' ? tPin() : jenis === 'sediakan' ? tSediakan()
        : jenis === 'lain' ? tLain() : tTamat();
    }
    const K = k();
    const tunjukBar = mc() && K && (K.fasa === 'daftar' || K.fasa === 'acara') && !berjalan() && !jenis;
    bar.classList.toggle('tersembunyi', !tunjukBar);
    if (tunjukBar) bar.innerHTML = tBar();
    pasang();
  }

  const bila = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };

  function masuk() {
    const pin = ($('mPinInput') || {}).value?.trim() || pinTaip;
    if (!pin) { ralat = 'Sila masukkan PIN.'; lukis(true); return; }
    pinTaip = pin;
    // klik ini membenarkan bunyi; masukMC memanggil hidupkanBunyi lagi selepas jawapan
    sibuk = true; ralat = ''; lukis(true);
    Api.penuh(pin).then((d) => {
      sibuk = false; buka = ''; ralat = '';
      ctx.masukMC(pin, d);
      if (d.tema) draf.tema = d.tema;
      lukis(true);
    }, (e) => { sibuk = false; ralat = e.message || 'PIN salah.'; pinTaip = ''; lukis(true); });
  }

  function pasang() {
    bila('mMasuk', masuk);
    const elPin = $('mPinInput');
    if (elPin) {
      elPin.oninput = () => { pinTaip = elPin.value; };
      elPin.onkeydown = (e) => { if (e.key === 'Enter') masuk(); };
      if (!elPin.value) setTimeout(() => elPin.focus(), 30);
    }
    bila('mTutup', () => { buka = k() && k().fasa === 'tamat' ? 'tutupTamat' : ''; ralat = ''; lukis(true); });
    bila('mKeluar', () => ctx.keluarMC());
    bila('mLain', () => { buka = 'lain'; ralat = ''; lukis(true); });
    bila('mPenuh', () => document.documentElement.requestFullscreen?.().catch(() => {}));

    const elT = $('mTajuk'); if (elT) elT.oninput = () => { draf.tajuk = elT.value; };
    const elH = $('mHadiah'); if (elH) elH.oninput = () => { draf.hadiah = elH.value; };
    const elM = $('mMuzik'); if (elM) elM.onchange = () => { draf.muzik = elM.checked; };
    bila('mSimpan', () => {
      const senarai = draf.hadiah.split('\n').map((x) => x.trim()).filter(Boolean);
      if (!senarai.length) { ralat = 'Masukkan sekurang-kurangnya satu hadiah.'; lukis(true); return; }
      ctx.togolMuzik(draf.muzik);
      buat('sediakan', { tajuk: draf.tajuk, hadiah: senarai, tema: draf.tema, muzik: draf.muzik });
    });
    isi.querySelectorAll('.pilih-tema:not(.tukar-tema) button').forEach((b) => {
      b.onclick = () => { draf.tema = b.dataset.tema; lukis(true); };
    });
    isi.querySelectorAll('.tukar-tema button').forEach((b) => {
      b.onclick = () => buat('tetapan', { tema: b.dataset.tema });
    });
    bila('mMuzikTukar', () => {
      const hidup = k().muzik === false;
      ctx.togolMuzik(hidup);
      buat('tetapan', { muzik: hidup });
    });

    bila('mMula', () => buat('mula', { jangka: k().pusingan + 1 }));
    bila('mSambung', () => { buka = ''; buat('mula', { jangka: k().pusingan + 1 }); });
    bila('mTakHadir', () => {
      const w = k().pemenang[k().pemenang.length - 1];
      if (!w) return;
      if (!confirm(`Tanda ${w.nama} sebagai TIDAK HADIR?\n\nHadiah "${w.hadiah}" akan dicabut semula pada pusingan berikutnya.`)) return;
      buat('tidakHadir', { pusingan: w.pusingan });
    });
    bila('mTamat', () => { if (confirm('Tamatkan acara sekarang?')) { buka = ''; buat('tamat', {}); } });
    bila('mReset', () => {
      if (!confirm('PADAM SEMUA peserta, hadiah dan pemenang?\n\nTindakan ini tidak boleh dibatalkan.')) return;
      if (!confirm('Betul-betul padam semua?')) return;
      draf = { tajuk: '', hadiah: '', tema: 'wira', muzik: true };
      buka = '';
      buat('setSemula', {});
    });
    bila('mDemoIsi', () => buat('demoIsi', { bil: 20 }));
    bila('mCsv', () => {
      const K = k();
      const baris = [['Pusingan', 'No', 'Nama', 'Hadiah', 'Kod', 'Status']].concat(
        K.pemenang.filter((x) => kini() >= x.dedah).map((x) => [x.pusingan, no3(x.no), x.nama, x.hadiah, x.kod,
          x.status === 'tidakHadir' ? 'Tidak hadir' : 'Menang']));
      const csv = '﻿' + baris.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'pemenang-wira-pecut.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }

  $('mcMasuk').onclick = () => { buka = 'pin'; ralat = ''; lukis(true); };

  return {
    lukis,
    sibuk: () => sibuk,
    /** pinTersimpan: dari sessionStorage (muat semula halaman MC); bukaTerus: URL ada #mc */
    mula(pinTersimpan, bukaTerus) {
      pinTaip = pinTersimpan || '';
      if (pinTersimpan || bukaTerus) buka = 'pin';
      lukis(true);
    },
  };
}

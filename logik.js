/* logik.js — PERATURAN CABUTAN Wira Pecut.
 * Fail yang SAMA digunakan oleh:
 *   - pelayar (Mod Demo)            → <script src="logik.js">
 *   - Google Apps Script (Logik.gs) → salin isi fail ini bulat-bulat
 * Jangan guna import/export di sini.
 */
var Logik = (function () {
  'use strict';

  var MASA = { KIRA: 3000, LARI: 5000, RAIKAN: 4500 }; // milisaat
  var HAD = { PESERTA: 300, HADIAH: 60, PAPAR: 12, NAMA: 28 };
  var TEMA_SAH = ['wira', 'kuda', 'itik', 'burung'];

  /* ── Rawak ── */
  function rawak(benih) {
    var a = 0;
    var s = String(benih);
    for (var i = 0; i < s.length; i++) a = (Math.imul(a ^ s.charCodeAt(i), 2654435761) + 7) | 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function kocok(arr, r) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function idRawak(r, n) {
    var abjad = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < (n || 6); i++) s += abjad[Math.floor(r() * abjad.length)];
    return s;
  }

  /* ── Keadaan ── */
  function baru(tajuk) {
    return {
      versi: 2,
      tajuk: tajuk || 'Wira Pecut',
      tema: 'wira', // wira | kuda | itik | burung
      muzik: true,  // muzik latar di skrin pentas
      fasa: 'persediaan', // persediaan → daftar → acara → tamat
      hadiah: [], // [{id, nama, status:'menunggu'|'dimenangi'}]
      peserta: [], // [{id, no, nama, jantina, warna, kulit, rambut, peranti}]
      pemenang: [], // [{pusingan, pesertaId, no, nama, hadiahId, hadiah, kod, status, dedah}]
      pusingan: 0,
      larian: null, // pusingan semasa
      dikemaskini: 0
    };
  }

  function salah(mesej) { var e = new Error(mesej); e.mesejPengguna = mesej; throw e; }

  function layak(k) {
    var sudah = {};
    k.pemenang.forEach(function (w) { sudah[w.pesertaId] = 1; });
    return k.peserta.filter(function (p) { return !sudah[p.id]; });
  }
  function hadiahSeterusnya(k) {
    for (var i = 0; i < k.hadiah.length; i++) if (k.hadiah[i].status === 'menunggu') return k.hadiah[i];
    return null;
  }

  /** Fasa larian semasa ditentukan oleh MASA, bukan disimpan. */
  function fasaLarian(k, kini) {
    var L = k.larian;
    if (!L) return 'sedia';
    if (kini < L.mula) return 'kira';
    if (kini < L.mula + MASA.LARI) return 'lari';
    if (kini < L.mula + MASA.LARI + MASA.RAIKAN) return 'raikan';
    return 'sedia';
  }

  /* ── Tindakan ── */
  var TINDAKAN = {
    /** MC: tajuk + senarai hadiah (satu baris satu hadiah). */
    sediakan: function (k, d) {
      if (k.fasa !== 'persediaan' && k.fasa !== 'daftar') salah('Acara sudah bermula. Hadiah tidak boleh diubah.');
      var senarai = (d.hadiah || []).map(function (x) { return String(x).trim(); }).filter(Boolean);
      if (!senarai.length) salah('Masukkan sekurang-kurangnya satu hadiah.');
      if (senarai.length > HAD.HADIAH) salah('Maksimum ' + HAD.HADIAH + ' hadiah.');
      k.tajuk = String(d.tajuk || k.tajuk).trim().slice(0, 60) || 'Wira Pecut';
      if (d.tema != null) {
        if (TEMA_SAH.indexOf(String(d.tema)) < 0) salah('Tema tidak dikenali.');
        k.tema = String(d.tema);
      }
      if (d.muzik != null) k.muzik = !!d.muzik;
      k.hadiah = senarai.map(function (n, i) { return { id: 'H' + (i + 1), nama: n.slice(0, 60), status: 'menunggu' }; });
      k.fasa = 'daftar';
    },

    /** MC: tukar tema atau muzik SELEPAS acara dibuka (sebelum pusingan 1). */
    tetapan: function (k, d) {
      if (d.tema != null) {
        if (TEMA_SAH.indexOf(String(d.tema)) < 0) salah('Tema tidak dikenali.');
        if (k.pusingan > 0) salah('Tema tidak boleh ditukar selepas pusingan pertama bermula.');
        k.tema = String(d.tema);
      }
      if (d.muzik != null) k.muzik = !!d.muzik;
    },

    /** Peserta (telefon): daftar. Peranti yang sama → rekod yang sama. */
    daftar: function (k, d, kini, r) {
      if (k.fasa === 'persediaan') salah('Pendaftaran belum dibuka.');
      if (k.fasa === 'tamat') salah('Acara sudah tamat.');
      var peranti = String(d.peranti || '').slice(0, 40);
      if (!peranti) salah('Peranti tidak dikenali. Muat semula halaman.');
      var ada = k.peserta.filter(function (p) { return p.peranti === peranti; })[0];
      if (ada) return { peserta: ada };
      var nama = String(d.nama || '').replace(/\s+/g, ' ').trim();
      if (nama.length < 2) salah('Sila masukkan nama (sekurang-kurangnya 2 huruf).');
      if (k.peserta.length >= HAD.PESERTA) salah('Maaf, tempat sudah penuh.');
      var p = {
        id: idRawak(r, 8),
        no: k.peserta.length + 1,
        nama: nama.slice(0, HAD.NAMA),
        jantina: d.jantina === 'perempuan' ? 'perempuan' : 'lelaki',
        warna: String(d.warna || 'hijau').slice(0, 16),
        spesies: String(d.spesies || 'epal').slice(0, 16),
        kulit: Math.max(0, Math.min(3, d.kulit | 0)),
        rambut: Math.max(0, Math.min(3, d.rambut | 0)),
        peranti: peranti
      };
      k.peserta.push(p);
      return { peserta: p };
    },

    /** MC: mula pusingan. `jangka` = nombor pusingan yang MC nampak (+1) — elak tekan dua kali. */
    mula: function (k, d, kini, r) {
      if (k.fasa !== 'daftar' && k.fasa !== 'acara') salah('Acara belum dibuka.');
      if (fasaLarian(k, kini) !== 'sedia') salah('Pusingan sedang berjalan. Tunggu sehingga selesai.');
      if (Number(d.jangka) !== k.pusingan + 1) salah('Pusingan ' + d.jangka + ' sudah dimulakan. Skrin dikemas kini.');
      var h = hadiahSeterusnya(k);
      if (!h) salah('Semua hadiah sudah dicabut.');
      var calon = layak(k);
      if (!calon.length) salah('Tiada peserta layak lagi.');

      var pemenang = calon[Math.floor(r() * calon.length)];
      var lain = kocok(calon.filter(function (p) { return p.id !== pemenang.id; }), r).slice(0, HAD.PAPAR - 1);
      var lorong = kocok([pemenang].concat(lain), r).map(function (p) { return p.id; });

      k.pusingan += 1;
      k.fasa = 'acara';
      var mula = kini + MASA.KIRA;
      k.larian = {
        no: k.pusingan, hadiahId: h.id, hadiah: h.nama,
        mula: mula, lorong: lorong, benih: idRawak(r, 10),
        pemenangId: pemenang.id, calon: calon.length
      };
      h.status = 'dimenangi';
      k.pemenang.push({
        pusingan: k.pusingan, pesertaId: pemenang.id, no: pemenang.no, nama: pemenang.nama,
        hadiahId: h.id, hadiah: h.nama, kod: idRawak(r, 4), status: 'menang',
        dedah: mula + MASA.LARI
      });
    },

    /** MC: pemenang pusingan terakhir tidak hadir → hadiah dicabut semula. */
    tidakHadir: function (k, d, kini) {
      var w = k.pemenang[k.pemenang.length - 1];
      if (!w || w.pusingan !== Number(d.pusingan)) salah('Hanya pemenang pusingan terakhir boleh ditanda tidak hadir.');
      if (kini < w.dedah) salah('Tunggu sehingga pemenang diumumkan.');
      if (w.status !== 'menang') return;
      w.status = 'tidakHadir';
      k.hadiah.forEach(function (h) { if (h.id === w.hadiahId) h.status = 'menunggu'; });
      if (k.fasa === 'tamat') k.fasa = 'acara';
    },

    tamat: function (k) { k.fasa = 'tamat'; }
  };

  /** Laksana tindakan. Mengembalikan {keadaan, hasil}. Keadaan asal tidak diubah. */
  function laksana(keadaan, nama, data, kini, benih) {
    var fn = TINDAKAN[nama];
    if (!fn) salah('Tindakan tidak dikenali: ' + nama);
    var k = JSON.parse(JSON.stringify(keadaan || baru()));
    var r = rawak((benih == null ? Math.random() : benih) + '|' + kini + '|' + nama);
    var hasil = fn(k, data || {}, kini, r) || {};
    k.dikemaskini = kini;
    return { keadaan: k, hasil: hasil };
  }

  /* ── Paparan ── */

  function bakiHadiah(k) {
    return k.hadiah.filter(function (h) { return h.status === 'menunggu'; }).length;
  }
  /** Maklumat awam seorang pelari (untuk dilukis dalam adegan 3D). TIADA peranti. */
  function pelariAwam(p) {
    return {
      id: p.id, no: p.no, nama: p.nama, jantina: p.jantina, warna: p.warna,
      spesies: p.spesies || 'epal', kulit: p.kulit, rambut: p.rambut
    };
  }

  /** Untuk SEMUA orang (telefon). Kod tuntutan hanya untuk pemenang sendiri,
   *  selepas saat penamat. Data larian (lorong + benih) diberi supaya telefon
   *  boleh melukis larian yang SAMA seperti skrin besar. */
  function awam(k, kini, peranti) {
    var L = k.larian;
    var saya = peranti ? k.peserta.filter(function (p) { return p.peranti === peranti; })[0] || null : null;
    var terdedah = k.pemenang.filter(function (w) { return kini >= w.dedah; });
    // pelari untuk adegan: 12 pendaftar terkini (lobi) + pelari dalam lorong larian semasa
    var ikutId = {}, pelari = [];
    k.peserta.forEach(function (p) { ikutId[p.id] = p; });
    function tambah(p) { if (p && !pelari.some(function (x) { return x.id === p.id; })) pelari.push(pelariAwam(p)); }
    k.peserta.slice(-HAD.PAPAR).forEach(tambah);
    if (L) L.lorong.forEach(function (id) { tambah(ikutId[id]); });
    var out = {
      tajuk: k.tajuk, tema: k.tema || 'wira', muzik: k.muzik !== false,
      fasa: k.fasa, pusingan: k.pusingan, kini: kini,
      jumlahPeserta: k.peserta.length, layak: layak(k).length,
      jumlahHadiah: k.hadiah.length, bakiHadiah: bakiHadiah(k),
      hadiahSeterusnya: (hadiahSeterusnya(k) || {}).nama || null,
      peserta: pelari,
      larian: L ? {
        no: L.no, hadiah: L.hadiah, mula: L.mula, fasa: fasaLarian(k, kini),
        lorong: L.lorong, benih: L.benih, pemenangId: L.pemenangId
      } : null,
      pemenang: terdedah.map(function (w) {
        return { pusingan: w.pusingan, no: w.no, nama: w.nama, hadiah: w.hadiah, status: w.status, dedah: w.dedah };
      }),
      saya: null
    };
    if (saya) {
      var menang = terdedah.filter(function (w) { return w.pesertaId === saya.id; })[0];
      out.saya = {
        id: saya.id, no: saya.no, nama: saya.nama, jantina: saya.jantina, warna: saya.warna,
        spesies: saya.spesies || 'epal', kulit: saya.kulit, rambut: saya.rambut,
        menang: menang ? { pusingan: menang.pusingan, hadiah: menang.hadiah, kod: menang.kod, status: menang.status } : null
      };
    }
    return out;
  }

  /** Untuk skrin Pentas & MC (dilindungi PIN): lengkap, termasuk pemenang larian semasa. */
  function penuh(k, kini) {
    var out = JSON.parse(JSON.stringify(k));
    out.kini = kini;
    if (!out.tema) out.tema = 'wira';        // keadaan lama (versi 1)
    if (out.muzik === undefined) out.muzik = true;
    out.peserta.forEach(function (p) { delete p.peranti; });
    out.layak = layak(k).length;
    out.jumlahPeserta = k.peserta.length;
    out.bakiHadiah = bakiHadiah(k);
    out.hadiahSeterusnya = (hadiahSeterusnya(k) || {}).nama || null;
    if (out.larian) out.larian.fasa = fasaLarian(k, kini);
    return out;
  }

  /* ── Koreografi 5 saat ──
     Setiap pelari mendapat lengkung kemajuan p(u), u = 0..1 sepanjang 5 saat.
     Pemenang SAHAJA sampai p = 1 pada u = 1. Seorang lagi "nyaris" (photo finish).
     Pemenang sengaja ketinggalan di pertengahan, kemudian memecut. */
  function koreografi(larian) {
    var r = rawak(larian.benih);
    var ids = larian.lorong;
    var d = ids.map(function (id) {
      return {
        id: id, menang: id === larian.pemenangId,
        jurang: 0.025 + r() * 0.11,
        a: 0.008 + r() * 0.016, k: 0.6 + r() * 0.9, f: r() * Math.PI * 2
      };
    });
    var bukan = d.filter(function (x) { return !x.menang; });
    if (bukan.length) bukan[Math.floor(r() * bukan.length)].jurang = 0.007 + r() * 0.006;
    return d;
  }
  function kemajuan(x, u) {
    u = Math.max(0, Math.min(1, u));
    var s = Math.sin(Math.PI * u);
    if (x.menang) return u - 0.045 * s * s * (1 - u * 0.35);
    return u * (1 - x.jurang * u * u * u) + x.a * s * Math.sin(2 * Math.PI * x.k * u + x.f);
  }
  function kedudukan(kor, u) {
    return kor.map(function (x) { return { id: x.id, p: kemajuan(x, u) }; })
      .sort(function (a, b) { return b.p - a.p; });
  }

  return {
    MASA: MASA, HAD: HAD, baru: baru, laksana: laksana, awam: awam, penuh: penuh,
    fasaLarian: fasaLarian, layak: layak, koreografi: koreografi, kemajuan: kemajuan,
    kedudukan: kedudukan, rawak: rawak
  };
})();

if (typeof module !== 'undefined') module.exports = Logik;

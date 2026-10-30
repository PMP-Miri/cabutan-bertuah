/* api.js — satu antara muka untuk dua mod:
 *   GAS  : config.js ada GAS_URL  → panggil Google Apps Script
 *   DEMO : GAS_URL kosong / ?demo=1 → semua dalam pelayar ini (latihan pegawai)
 * Mod Demo: buka Pentas, MC dan Telefon dalam TAB berasingan pada pelayar yang sama.
 */
var Api = (function () {
  'use strict';
  var CFG = window.WP_CONFIG || {};
  var demo = !CFG.GAS_URL || /[?&]demo=1/.test(location.search);
  var PIN_DEMO = '1234';
  var SPESIES_DEMO = ['epal', 'oren', 'pisang', 'tembikai', 'nanas', 'strawberi', 'anggur', 'mangga', 'betik', 'naga',
    'brokoli', 'lobak', 'tomato', 'jagung', 'terung', 'cili', 'bawang', 'timun', 'kubis', 'cendawan'];
  var offset = 0; // jam pelayan − jam tempatan
  var saluran = 'BroadcastChannel' in window ? new BroadcastChannel('wira-pecut') : null;
  var pendengar = [];
  if (saluran) saluran.onmessage = function () { pendengar.forEach(function (f) { f(); }); };

  function peranti() {
    var id = localStorage.getItem('wp_peranti');
    if (!id) {
      id = 'P' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem('wp_peranti', id);
    }
    return id;
  }

  /** Mod Demo: 128 bit rawak kriptografi daripada pelayar (sama gred dengan pelayan). */
  function benihAman() {
    var a = new Uint32Array(4);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (x) { return ('0000000' + x.toString(16)).slice(-8); }).join('');
  }

  /* ── Demo ── */
  function bacaDemo() {
    try { return JSON.parse(localStorage.getItem('wp_demo')) || Logik.baru(); } catch (e) { return Logik.baru(); }
  }
  function tulisDemo(k) {
    localStorage.setItem('wp_demo', JSON.stringify(k));
    if (saluran) saluran.postMessage(1);
  }
  function demoPanggil(q) {
    return new Promise(function (ok, gagal) {
      setTimeout(function () {
        var kini = Date.now();
        try {
          if (q.a === 'awam') return ok({ ok: true, data: Logik.awam(bacaDemo(), kini, q.peranti) });
          if (q.a === 'penuh') {
            if (q.pin !== PIN_DEMO) return ok({ ok: false, ralat: 'PIN salah. (Mod Demo: 1234)' });
            return ok({ ok: true, data: Logik.penuh(bacaDemo(), kini) });
          }
          if (q.a === 'buat') {
            if (q.t !== 'daftar' && q.pin !== PIN_DEMO) return ok({ ok: false, ralat: 'PIN salah. (Mod Demo: 1234)' });
            var d = JSON.parse(q.d || '{}');
            var k = bacaDemo();
            if (q.t === 'setSemula') k = Logik.baru();
            else if (q.t === 'demoIsi') {
              var nama = ['Aina', 'Faiz', 'Siti', 'Hakim', 'Nurul', 'Danial', 'Farah', 'Irfan', 'Mira', 'Amir',
                'Balqis', 'Haziq', 'Syafiqah', 'Rizal', 'Liyana', 'Zul', 'Alya', 'Imran', 'Wani', 'Adam'];
              var warna = ['hijau', 'biru', 'ungu', 'oren', 'kuning', 'teal', 'merahjambu', 'merah', 'lime', 'indigo', 'magenta', 'langit'];
              var mula = k.peserta.length;
              for (var i = 0; i < (d.bil || 20); i++) {
                var n = mula + i;
                k = Logik.laksana(k, 'daftar', {
                  nama: nama[n % nama.length] + (n >= nama.length ? ' ' + (Math.floor(n / nama.length) + 1) : ''),
                  warna: warna[(n * 5) % warna.length],
                  spesies: SPESIES_DEMO[(n * 7) % SPESIES_DEMO.length],
                  kulit: n % 4, rambut: (n * 3) % 4, peranti: 'demo-' + n
                }, kini).keadaan;
              }
            } else {
              var x = Logik.laksana(k, q.t, d, kini, benihAman());
              k = x.keadaan;
              tulisDemo(k);
              if (q.t === 'daftar') return ok({ ok: true, data: Logik.awam(k, kini, d.peranti) });
              return ok({ ok: true, data: Logik.penuh(k, kini) });
            }
            tulisDemo(k);
            return ok({ ok: true, data: Logik.penuh(k, kini) });
          }
          ok({ ok: false, ralat: 'Permintaan tidak sah.' });
        } catch (e) {
          ok({ ok: false, ralat: e.mesejPengguna || e.message });
        }
      }, 60);
    });
  }

  /* ── GAS ── */
  function gasPanggil(q) {
    var url = CFG.GAS_URL + '?' + Object.keys(q).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(q[k]);
    }).join('&');
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.json(); });
  }

  function panggil(q) {
    var t0 = Date.now();
    return (demo ? demoPanggil(q) : gasPanggil(q)).then(function (res) {
      if (res && res.data && res.data.kini) {
        var t1 = Date.now();
        var anggar = res.data.kini - (t0 + t1) / 2;
        // licinkan; percaya sampel dengan RTT kecil
        offset = Math.abs(offset) < 1 ? anggar : offset * 0.7 + anggar * 0.3;
      }
      if (!res || !res.ok) {
        var e = new Error((res && res.ralat) || 'Tiada sambungan.');
        throw e;
      }
      return res.data;
    }, function () { throw new Error('Tiada sambungan internet. Cuba lagi.'); });
  }

  return {
    demo: demo,
    peranti: peranti,
    kini: function () { return Date.now() + offset; },
    awam: function () { return panggil({ a: 'awam', peranti: peranti() }); },
    penuh: function (pin) { return panggil({ a: 'penuh', pin: pin }); },
    buat: function (t, d, pin) { return panggil({ a: 'buat', t: t, d: JSON.stringify(d || {}), pin: pin || '' }); },
    bilaBerubah: function (f) { pendengar.push(f); }
  };
})();

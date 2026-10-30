# Wira Pecut — Cara Pasang

## ⚠️ Penting: jangan buka fail dengan klik dua kali

Halaman ini guna JavaScript modul. Pelayar **menyekat** modul bila fail
dibuka terus dari komputer (`file:///...`), jadi skrin akan kosong.
Fail mesti dihoskan, contohnya di **GitHub Pages** (percuma).

---

## A. Hos halaman di GitHub Pages (sekali sahaja)

1. Buat repo baharu di GitHub, contoh `wira-pecut`.
2. Muat naik **semua fail dalam zip ini** ke akar repo (rata, tiada folder),
   **kecuali** `Code.gs` dan `Logik.gs` (itu untuk Apps Script).
3. Settings → Pages → Branch: `main`, folder `/ (root)` → Save.
4. Tunggu 1–2 minit. Alamat: `https://<nama-akaun>.github.io/wira-pecut/`

Pada peringkat ini sistem sudah boleh dicuba dalam **Mod Demo**
(tiada backend, PIN `1234`): buka `.../index.html` dalam dua tab pelayar
yang sama. Tab 1: tekan **🎙️ Pegawai / MC? Masuk di sini**. Tab 2: jadi peserta.

## B. Sambung ke Google Apps Script (untuk acara sebenar)

1. Pergi ke https://script.google.com → **New project**.
2. Gantikan isi `Code.gs` dengan fail `Code.gs` daripada zip.
3. Klik **+** → Script → namakan `Logik` → tampal isi `Logik.gs`.
4. Dalam `Code.gs`, tukar `'TUKAR-SAYA-1234'` dalam fungsi `tetapkanPIN`
   kepada PIN sendiri. Pilih `tetapkanPIN` di bar atas → **Run** →
   benarkan akses.
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Salin URL yang berakhir dengan `/exec`.
7. Di GitHub, edit `config.js`, tampal URL itu dalam `GAS_URL: '...'`, Commit.

Siap. Kod QR pada skrin pentas kini membawa peserta ke halaman sebenar.

### Bila kemas kini `Code.gs` atau `Logik.gs` kemudian

Deploy → **Manage deployments** → ✏️ → Version: **New version** → Deploy.
URL kekal sama; `config.js` tidak perlu diubah.

---

## C. Ujian beban sebelum hari acara (disyorkan jika > 100 orang)

Minta 15–20 rakan sekerja imbas QR serentak dan biarkan telefon terbuka
semasa 3 pusingan. Kemudian di Apps Script → **Executions**, semak
sama ada ada ralat merah (`Service invoked too many times`,
`Limit exceeded`). Tiada ralat = selamat.

## Senarai fail

| Fail | Ke mana |
|---|---|
| `index.html` | GitHub — **satu-satunya halaman** (MC, projektor & telefon) |
| `utama.js`, `panelMC.js`, `panelPeserta.js` | GitHub — logik halaman |
| `adegan.js`, `trek.js`, `tema.js`, `buahsayur.js`, `haiwan.js`, `watak.js`, `bunyi.js`, `muzik.js` | GitHub — 3D & bunyi |
| `logik.js`, `api.js`, `config.js`, `gaya.css` | GitHub — dikongsi |
| `mc.html`, `pentas.html` | GitHub — pautan lama, lencong sendiri ke `index.html` |
| `Code.gs`, `Logik.gs` | Apps Script sahaja |
| `PANDUAN-PEGAWAI.md` | Untuk dicetak/diedar kepada pegawai |

**Naik taraf dari versi lama:** padam `mc.js`, `pentas.js` dan `peserta.js`
dari repo (tidak digunakan lagi). Jangan lupa tampal `Logik.gs` baharu di
Apps Script dan buat **New version** (lihat atas).

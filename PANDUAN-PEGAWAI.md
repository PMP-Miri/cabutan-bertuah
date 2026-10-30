# Wira Pecut — Panduan Pegawai

Cabutan bertuah berbentuk larian 3D. Satu pusingan larian = satu hadiah.
**MC yang tekan butang** untuk setiap pusingan.

---

## Satu pautan sahaja untuk semua

Semua orang buka **pautan yang sama** (`index.html`). Tiada halaman lain.

| Siapa | Buat apa | Nampak apa |
|---|---|---|
| **MC** (laptop disambung ke projektor) | Tekan **🎙️ Pegawai / MC? Masuk di sini** di bawah, masukkan PIN | Skrin larian penuh + bar kawalan kecil di bawah. Apa yang MC nampak = apa yang orang ramai nampak. |
| **Peserta** (telefon) | Imbas kod QR di skrin besar | Larian yang sama di atas, borang daftar / status di bawah |

Tip: tandakan pautan `.../index.html#mc` pada laptop MC. Tetingkap PIN terus terbuka.

---

## Empat tema (pilih satu setiap acara)

| Tema | Apa yang orang ramai nampak |
|---|---|
| 🥕 **Buah & Sayur** | 20 watak buah & sayur comel (pilihan peserta) berlari di trek |
| 🐴 **Lumba Kuda** | Kuda berlari, jokinya buah/sayur pilihan peserta |
| 🦆 **Itik Berenang** | Itik getah berenang di kolam |
| 🐦 **Burung Terbang** | Burung comel terbang di litar udara |

Tema boleh ditukar sehingga pusingan pertama bermula, kemudian terkunci.

---

## Sebelum acara (5 minit)

1. Sambung laptop ke projektor (paparan **sama/mirror**).
2. Buka pautan, tekan **🎙️ Pegawai / MC? Masuk di sini**, masukkan PIN, tekan **▶ Masuk**.
   Skrin jadi penuh dan muzik hidup.
3. **LANGKAH 1** muncul: pilih tema, taip nama acara dan senarai hadiah
   (satu baris satu hadiah, baris atas dicabut dahulu). Tekan **✓ Simpan & Buka Pendaftaran**.
4. Kod QR muncul di penjuru kanan bawah skrin. Peserta imbas dan daftar.
   Bilangan peserta naik secara langsung di bawah QR.

## Setiap pusingan

Bar putih di bawah skrin menunjukkan **hadiah pusingan ini** dan satu butang hijau.

1. Umumkan hadiah.
2. Tekan **▶ MULA PUSINGAN n**.
3. Bar hilang sendiri. Kira-kira 12 saat: kiraan 3-2-1, larian 5 saat, pemenang di podium.
4. Bar muncul semula untuk pusingan seterusnya.

### Kalau pemenang tiada di dewan

Selepas pemenang diumumkan, bar ada butang merah kecil
**✗ #nombor nama tidak hadir? Cabut semula**. Hadiah masuk semula ke barisan
hadapan; orang itu tidak boleh menang lagi.

## Butang ⚙️ (di hujung bar)

Tukar tema, hidup/mati muzik, skrin penuh, muat turun CSV pemenang,
**🔒 senarai pemenang & kod tuntutan** (tertutup, kerana skrin dilihat orang ramai),
tamatkan acara, padam semua, keluar mod MC.

## Selepas acara

⚙️ → **⬇ Muat turun senarai pemenang (CSV)**. Kaunter hadiah padankan
**kod tuntutan** di telefon pemenang dengan senarai itu.

---

## Soal jawab pantas

**Tersilap tekan mula?** Tidak boleh dibatalkan; pemenang sudah dipilih.
Guna **tidak hadir** jika perlu cabut semula.

**Tiada bunyi?** Pelayar hanya benarkan bunyi selepas klik. Jika halaman
dimuat semula, tekan **▶ Masuk** sekali lagi (PIN sudah terisi). Kekunci **M** = muzik hidup/mati.

**Telefon peserta tiada bunyi?** Memang begitu. Hanya laptop MC berbunyi,
supaya 100 telefon tidak berbunyi serentak.

**Larian di telefon lambat sedikit daripada skrin besar?** Normal. Untuk
jimat kuota Google, telefon tidak bertanya setiap saat. Telefon yang lambat
dapat berita akan **main larian dari 3-2-1** beberapa saat kemudian. Umumkan
pemenang ikut skrin besar.

**Internet putus?** Semua cuba semula sendiri. Data disimpan di pelayan.

**Nak latih pegawai tanpa internet?** Biarkan `GAS_URL` kosong dalam
`config.js` (Mod Demo, PIN **1234**). Buka pautan dalam **dua tab**:
tab 1 masuk sebagai MC, tab 2 jadi peserta. Dalam ⚙️ ada butang tambah 20 peserta contoh.
(Mod Demo hanya dalam satu pelayar; imbas QR dari telefon lain tidak berfungsi.)

**Mula acara baharu?** ⚙️ → **🗑 Padam semua**. Akan tanya dua kali.

---

## Had sistem

| Bilangan peserta | Status |
|---|---|
| Hingga **150** | ✅ Selesa. Disyorkan. |
| 150 – 300 | ⚠️ Boleh, tetapi telefon mungkin lewat beberapa saat dan pendaftaran serentak mungkin perlu cuba semula (dibuat automatik). Buat ujian beban dahulu. |
| Lebih 300 | ❌ Tidak disokong (sistem menolak pendaftaran ke-301). |

- Maksimum **60 hadiah**.
- **12 pelari** dipaparkan di trek setiap pusingan (dipilih rawak, pemenang sentiasa antaranya).
- Pemenang dipilih oleh **pelayan** saat MC tekan butang. Animasi hanya melakonkan
  keputusan itu. Supaya telefon boleh menunjukkan larian yang sama, data larian
  (termasuk siapa pemenang) dihantar ke telefon semasa kiraan detik. Orang yang
  mahir teknikal boleh "intai" pemenang beberapa saat awal, tetapi **tidak boleh
  mengubahnya**. **Kod tuntutan** hanya dihantar ke telefon pemenang sendiri,
  selepas garisan penamat.

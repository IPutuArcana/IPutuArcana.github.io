# Dokumentasi Pengembang: Portofolio I Putu Arcana

Untuk siapa pun yang memegang proyek ini berikutnya, entah pengembang baru atau
orang awam yang cuma ingin mengerti cara kerjanya. Ditulis 18 Agustus 2026.

Tujuannya bukan menjelaskan tiap baris kode, kode ini sendiri sudah diberi
komentar panjang di bagian-bagian penting (dalam Bahasa Inggris, ikuti gaya
berkas yang sedang dibaca). Yang tidak bisa dititipkan ke komentar adalah
**gambaran menyeluruh dan alasan di balik keputusan yang kelihatan aneh**, dan
itu isi dokumen ini.

Baca bagian 1 sampai 3 sebelum menyentuh apa pun. Sisanya boleh dibaca saat
dibutuhkan.

---

## Daftar isi

1. [Apa ini sebenarnya](#1-apa-ini-sebenarnya)
2. [Menjalankan di laptop sendiri](#2-menjalankan-di-laptop-sendiri)
3. [Peta berkas](#3-peta-berkas)
4. [Sistem konten dan dwibahasa](#4-sistem-konten-dan-dwibahasa)
5. [Tema terang dan gelap](#5-tema-terang-dan-gelap)
6. [Halaman utama: dek slide](#6-halaman-utama-dek-slide)
7. [Karakter 3D Lionk](#7-karakter-3d-lionk)
8. [Motion capture opsional](#8-motion-capture-opsional)
9. [Sistem blog](#9-sistem-blog)
10. [Deploy ke GitHub Pages](#10-deploy-ke-github-pages)
11. [Kuirk dan hal yang wajib diketahui](#11-kuirk-dan-hal-yang-wajib-diketahui)
12. [Pekerjaan berikutnya yang belum selesai](#12-pekerjaan-berikutnya-yang-belum-selesai)

---

## 1. Apa ini sebenarnya

Situs portofolio pribadi, dwibahasa (Indonesia/Inggris), mode terang dan
gelap. Halaman utamanya bukan halaman scroll biasa, melainkan **dek slide
gaya presentasi**: tiap bagian (Tentang, Keahlian, Proyek, Kontak) adalah satu
"slide" penuh layar, berpindah dengan animasi ala transisi menu game. Di
sebelah kanan dek berdiri **Lionk**, karakter 3D bergaya VRM yang ikut
"bermain" mengikuti slide yang aktif: berganti pose, kamera, dan ekspresi
setiap kali Anda pindah slide.

Selain itu ada halaman **Blog** terpisah (`/blog`) berisi catatan kerja
magang, dan itu yang paling relevan untuk penilaian magang.

**Situs ini statis sepenuhnya**, sama seperti prinsip di proyek avatar 3D
Shavira (`AvatarLypsycn`) kalau Anda familiar dengan proyek itu: tidak ada
server sendiri, tidak ada basis data, tidak ada route API. Astro merender
semuanya jadi berkas HTML/CSS/JS statis saat `npm run build`, dan berkas itu
yang dilayani GitHub Pages.

Tumpukannya:

| Bagian | Dipakai |
|---|---|
| Kerangka | Astro 7, output statis penuh, tanpa framework UI (bukan React/Vue/Svelte) |
| Render 3D | three.js 0.185 + `@pixiv/three-vrm` untuk model VRM |
| Font | Fraunces (judul) dan Inter (isi), dimuat lewat Fontsource |
| Deploy | GitHub Actions -> GitHub Pages |

Bahasa komentar dan nama variabel di kode: **Bahasa Inggris**, konsisten di
seluruh proyek ini (beda dengan `AvatarLypsycn` yang komentarnya Indonesia).
Teks yang tampil di situs (lewat `content.ts`) dwibahasa penuh.

---

## 2. Menjalankan di laptop sendiri

```bash
cd Portofolio
npm install
npm run dev       # localhost:4321, live reload
npm run build     # keluaran statis ke ./dist/
npm run preview   # coba hasil build sebelum deploy
npm run astro check   # pemeriksaan tipe TypeScript + Astro
```

### Bug lingkungan yang PERLU diketahui, sudah ditambal di `package.json`

Kalau folder proyek ini disalin ke path Windows yang mengandung karakter
`&` (persis seperti `Dev & Projects` di path aslinya), `npm run dev` bawaan
Astro (`"dev": "astro dev"`) akan **gagal dengan pesan aneh**:

```
'Projects\Portofolio\node_modules\.bin\' is not recognized as an internal or external command
```

Penyebabnya: shim `.cmd` yang dibuat npm di Windows memakai karakter `&`
sebagai pemisah perintah di dalam skrip batch-nya. Begitu `%dp0%` (folder
berkas shim itu sendiri) diekspansi dan ternyata mengandung `&` yang sungguhan
dari nama folder, baris perintahnya terpotong di situ. Ini bug lingkungan
Windows/npm, bukan bug Astro atau kode di proyek ini.

**Sudah ditambal**: skrip di `package.json` (`dev`, `build`, `preview`,
`astro`) memanggil `node node_modules/astro/bin/astro.mjs` secara langsung,
melewati shim `.cmd` yang rusak itu sepenuhnya. Jadi `npm run dev` dkk. sudah
aman dipakai apa adanya. **Yang perlu diingat:** jangan mengembalikan skrip
itu ke bentuk `"astro dev"` polos tanpa alasan kuat, karena bug-nya akan
kembali persis seperti semula selama proyek ini disimpan di path yang
mengandung `&`.

---

## 3. Peta berkas

```
Portofolio/
├── src/
│   ├── data/content.ts         # SATU sumber semua teks situs, dwibahasa
│   ├── layouts/BaseLayout.astro
│   ├── components/
│   │   ├── Header.astro, Footer.astro, Hero.astro, About.astro,
│   │   │   Skills.astro, Projects.astro, ProjectCard.astro, Contact.astro
│   │   ├── LangToggle.astro, ThemeToggle.astro   # dua tombol di header
│   │   ├── Backdrop.astro, SocialRail.astro, BackToTop.astro, StatStrip.astro
│   │   ├── BlogPostCard.astro   # kartu ringkas di /blog
│   │   ├── Lionk.astro          # markup panggung karakter 3D (bukan logikanya)
│   │   └── motifs/              # elemen dekoratif SVG (awan, bunga, bingkai)
│   ├── scripts/
│   │   ├── i18n.ts              # tukar bahasa & baca tema aktif
│   │   ├── reveal.ts            # animasi elemen muncul saat scroll
│   │   ├── deck.ts              # logika dek slide (bagian 6)
│   │   ├── lionk.ts             # runtime karakter 3D (bagian 7)
│   │   ├── lionk-rig.ts         # data pose murni, tanpa three.js (bagian 7)
│   │   └── lionk-actions.ts     # repertoar aksi idle + reaksi scroll (bagian 7)
│   ├── styles/tokens.css        # variabel desain (warna, jarak, tipografi)
│   ├── styles/global.css        # gaya dasar lintas situs
│   └── pages/
│       ├── index.astro          # halaman utama (dek slide)
│       └── blog/
│           ├── index.astro      # daftar kartu blog
│           └── [slug].astro     # halaman artikel penuh per post
├── public/
│   ├── favicon.ico / .svg
│   └── models/
│       ├── lionk.vrm            # model 3D Lionk, ~15 MB
│       └── motions/              # opsional, lihat bagian 8
├── .github/workflows/deploy.yml # auto-deploy ke GitHub Pages
├── astro.config.mjs
└── package.json
```

---

## 4. Sistem konten dan dwibahasa

**Satu berkas menguasai semua teks di situs ini: `src/data/content.ts`.**
Isinya objek `content` dengan dua kunci, `id` dan `en`, keduanya mengikuti
tipe `SiteContent` yang sama persis (TypeScript memaksa strukturnya identik,
jadi menambah field di satu bahasa dan lupa di bahasa lain akan gagal
`npm run astro check`, bukan gagal diam-diam).

Cara kerjanya di HTML: tiap elemen yang butuh diterjemahkan diberi dua
atribut data, isinya versi Indonesia dan Inggris:

```astro
<h2 data-i18n-id={id.about.heading} data-i18n-en={en.about.heading}>
  {t.about.heading}
</h2>
```

Server merender versi `id` sebagai teks awal (SSR/statis selalu bahasa
Indonesia dulu). Begitu pengunjung klik tombol ganti bahasa, skrip
`src/scripts/i18n.ts` berjalan lewat semua elemen berpenanda `[data-i18n-id]`
dan mengganti isinya:

```ts
el.textContent = lang === 'id' ? el.dataset.i18nId : el.dataset.i18nEn;
```

**Satu detail teknis yang harus diingat siapa pun yang menambah teks baru:
penggantiannya lewat `textContent`, BUKAN `innerHTML`.** Artinya isi
`data-i18n-id`/`data-i18n-en` tidak boleh mengandung tag HTML (`<strong>`,
`<em>`, dst.), karena tag itu akan muncul sebagai teks mentah begitu bahasa
diganti. Ini nyata ditemukan saat menulis isi blog (bagian 9): draf awal
sempat memakai `<em>`/`<strong>` untuk penekanan, dan harus dilepas semua
sebelum dipasang.

Untuk atribut (bukan isi teks) seperti `alt` gambar, ada mode kedua lewat
`data-i18n-attr="alt"` di elemen yang sama, lihat contoh di `About.astro`.

---

## 5. Tema terang dan gelap

Ditentukan oleh atribut `data-theme` di elemen `<html>` (`"light"` atau
`"dark"`), dibaca lewat fungsi `resolvedTheme()` di `i18n.ts`. Kalau atribut
itu tidak ada sama sekali, situs mengikuti preferensi sistem operasi lewat
CSS `prefers-color-scheme`. Pilihan pengguna disimpan di
`localStorage['theme']` dan dipasang ulang lewat skrip inline di
`BaseLayout.astro` **sebelum** cat pertama, supaya tidak ada kedipan
salah-tema sesaat sebelum JavaScript utama jalan.

Seluruh warna situs didefinisikan sebagai variabel CSS di
`src/styles/tokens.css`, jadi mengubah palet warna dikerjakan di satu tempat,
bukan menelusuri tiap komponen.

---

## 6. Halaman utama: dek slide

Diatur oleh `src/scripts/deck.ts`, sekitar 300 baris, dan **hanya aktif kalau
ada elemen `<main data-deck>` di halaman** (jadi tidak mengganggu halaman blog
sama sekali, bisa aman ditinggal di layout bersama).

Mekanismenya:

- **Tiap anak langsung dari `<main data-deck>` adalah satu slide.** `index.astro`
  menaruh `<section>` Hero, About, Skills, Projects, Contact langsung di
  bawah `<main data-deck>`.
- **`IntersectionObserver`** memantau slide mana yang paling banyak mengisi
  layar (ambang 40%), dan menandainya `.is-current`.
- Setiap kali slide aktif berpindah, `deck.ts` menyiarkan **`CustomEvent`
  bernama `deck:change`** ke `document`, membawa `{ index, total }`. Sistem
  lain (terutama Lionk, bagian 7) mendengarkan event ini alih-alih membuat
  logika pemantauan scroll sendiri-sendiri.
- **Transisi antar-slide** dipilih dari lima varian (`slash`, `blinds`,
  `wedge`, `bars`, `flash`), diambil dari kantong yang diacak ulang (bukan
  giliran berurutan), supaya berpindah bolak-balik antara dua slide tetap
  memutar seluruh variasi, bukan cuma dua yang sama terus.
- **Navigasi keyboard** penuh: panah atas/bawah, Page Up/Down, spasi
  (mundur kalau ditahan Shift), Home, End. Otomatis tidak aktif kalau fokus
  sedang di kolom input/textarea.
- **Rail titik navigasi** (deretan tombol bulat) dibuat otomatis dari judul
  tiap slide, ditambahkan ke `document.body` saat halaman dimuat.
- Menghormati `prefers-reduced-motion`: transisi visual dimatikan, scroll ke
  slide jadi instan bukan halus.

---

## 7. Karakter 3D Lionk

Ini bagian paling rumit di proyek ini, jadi dijelaskan agak panjang. Tiga
berkas terlibat, dengan pemisahan tanggung jawab yang disengaja:

| Berkas | Isi | Bergantung pada three.js? |
|---|---|---|
| `lionk-rig.ts` | Data pose murni: daftar tulang, dua pose berdiri dasar, matematika spring, fungsi bantu | **Tidak**, murni data dan fungsi |
| `lionk-actions.ts` | Repertoar aksi idle (4 gerakan) dan reaksi scroll, props dibangun dari primitif geometri | Ya, tapi ringan |
| `lionk.ts` | Runtime penuh: memuat model, kamera, loop animasi tiap frame, event pointer/klik | Ya, berat |

Pemisahan ini disengaja: `lionk-rig.ts` bisa diuji dan dibaca tanpa perlu
tahu apa-apa soal three.js, dan tidak menciptakan ketergantungan melingkar
antara runtime dan daftar aksi.

### 7.1 Kenapa dan kapan Lionk dimuat

Model VRM-nya **sekitar 15 MB**, jadi tidak dimuat begitu saja. `lionk.ts`
memeriksa empat syarat dulu (`shouldLoad()`), dan kalau satu saja gagal,
three.js dan model itu **tidak pernah diunduh sama sekali**:

1. Pengguna belum pernah mematikannya lewat tombol toggle (tersimpan di
   `localStorage['lionk-visible']`).
2. `prefers-reduced-motion` tidak aktif.
3. Lebar jendela minimal 1100px (`MIN_VIEWPORT`), di layar sempit tidak ada
   ruang untuk karakter di samping konten.
4. Peramban tidak menandai koneksi hemat data (`navigator.connection.saveData`).

### 7.2 Kosakata rig (`lionk-rig.ts`)

- **`BONES`**: dua puluh tulang yang digerakkan (badan, kepala, lengan,
  kaki). Jari **tidak** termasuk di sini, diperlakukan terpisah (lihat 7.4).
- **Setiap pose adalah selisih (delta) dari pose istirahat VRM (T-pose)**,
  bukan sudut mutlak.
- **`STAND_A` dan `STAND_B`**: dua pose berdiri contrapposto (berat badan di
  satu kaki, bahu berlawanan arah pinggul). Karakter **selalu** melayang
  perlahan di antara keduanya lewat `weightShift()`, tidak pernah diam kaku
  di satu pose. Fungsinya sengaja bukan gelombang sinus polos, melainkan
  segitiga yang dihaluskan: menahan lama di kedua ujung lalu berpindah
  cepat, meniru cara orang sungguhan berdiri (menahan berat, lalu pindah).
- **Spring redaman (damped spring)** menggerakkan tiap tulang menuju target
  posenya, bukan interpolasi linier. Ini yang memberi efek "menyusul lalu
  menetap" (overlapping action): tulang dekat akar tubuh (pinggul) bergerak
  duluan, tulang jauh (tangan) menyusul dan sedikit melewati target sebelum
  berhenti, lewat tabel `BONE_LAG` per tulang.

### 7.3 Adegan per slide (`lionk.ts`, tabel `SCENES`)

Tiap slide dek (Hero, About, Skills, Projects, Contact) punya satu objek
`Scene`, isinya:

- `pose` + `poseB`: pasangan pose yang dilayangi di antaranya, khusus adegan
  itu (mis. melambai di Hero, tangan di dagu berpikir di Skills).
- `expression`: ekspresi wajah VRM yang dipegang selama adegan itu.
- `offsetX`, `turn`: posisi karakter di panggung dan arah hadapnya.
- `cam`: posisi kamera, arah pandang, field-of-view, dan kemiringan (dutch
  tilt) khusus adegan itu. Tiap adegan sengaja memakai gaya bidikan kamera
  yang beda (dari lensa tenang di About sampai sudut ekstrem di Projects),
  supaya dek terasa seperti disutradarai, bukan kamera statis.

Ketika `deck:change` diterima, `lionk.ts` memanggil `setScene(index)`, dan
seluruh nilai di atas dilayangi (bukan langsung dipatok) menuju target baru
lewat `damp()`, dengan kecepatan yang dipercepat sesaat (`snapUntil`) supaya
karakter terasa "dipotong" masuk ke pose baru seperti transisi menu game,
bukan meluncur pelan.

### 7.4 Jari dan tangan

Karena VRM humanoid standar hanya punya satu tulang per tangan, jari
dianimasikan terpisah lewat sistem sendiri di `lionk-rig.ts`
(`FINGERS`, `FINGER_SEGMENTS`, `fingerRotation()`). Tiap jari punya sumbu
putar dan proporsi lekukan sendiri (ruas tengah menekuk paling dalam), dan
tangan yang diam pun tidak lurus sempurna (`HAND_RELAXED`), supaya tidak
terlihat seperti sarung tangan kaku.

**Arah putaran jari diturunkan lewat perhitungan, ditulis sebagai komentar
di kode, bukan ditebak** — konsisten dengan aturan yang sama yang dipegang di
proyek avatar Shavira: arah sumbu tulang yang salah gagal tanpa bersuara,
animasinya tetap jalan, cuma menekuk ke arah yang salah.

### 7.5 Repertoar idle (`lionk-actions.ts`)

Saat tidak ada yang lain terjadi (tidak ada reaksi klik, tidak lagi
menyesuaikan slide baru), "sutradara" (`ActionDirector`) menunggu jeda acak
7-10 detik lalu memutar satu dari empat aksi mikro:

| Aksi | Isi |
|---|---|
| Coder | Membuka laptop (properti dibangun dari primitif geometri), mengetik |
| Swordsman | Menghunus pedang, satu tebasan, kembali |
| L-sit | Menahan posisi gymnastic melayang, dengan getaran halus supaya tidak terlihat seperti manekin |
| Ball spin | Memutar bola basket di atas tangan |

Properti (laptop, pedang, bola) **tidak ada di model VRM-nya**, dibangun
dari bentuk geometri primitif langsung di kode dan ditempelkan (`parent`) ke
tulang yang sesuai saat aksi dimainkan.

Pencampuran pose aksi dengan pose adegan dilakukan pada level **target
pose**, bukan pada rotasi tulang yang sudah jadi. Ini penting: kalau
mencampur dua rotasi tulang final, efek overlapping action dari spring akan
hilang (rata). Mencampur target sebelum masuk ke spring membuat seluruh
karakter tetap terasa hidup selama transisi aksi.

### 7.6 Interaksi pengguna

- **Mata, kepala, dan leher mengikuti kursor mouse** (dengan mata bereaksi
  lebih cepat daripada kepala, meniru cara mata manusia mendahului kepala).
- **Klik pada karakter** (diperiksa lewat raycasting three.js, bukan sekadar
  area kotak) memicu reaksi: putaran cepat, lompatan kecil di bawah gravitasi
  semu, mendarat dengan pose tinju terangkat.
- **Scroll pada dek** membuat badan condong searah gerak scroll
  (`createScrollLean`), berbasis kecepatan scroll bukan posisi, supaya
  terasa seperti "terhempas" saat dek berpindah slide secara snap.
- **Tombol kecil di pojok kanan bawah panggung** mematikan/menghidupkan
  karakter, pilihan tersimpan di localStorage.

### 7.7 Alat bantu pengembangan

Dalam mode `npm run dev`, tersedia `window.__lionk` di console browser untuk
menguji tanpa menunggu jeda acak:

```js
__lionk.play('swordsman')   // mainkan satu aksi langsung
__lionk.vrm                 // objek VRM mentah
```

---

## 8. Motion capture opsional

Lionk bisa digerakkan pakai **klip motion capture sungguhan** (berkas
`.vrma`) alih-alih pose buatan tangan di atas, tapi ini **sepenuhnya
opsional** dan situs berjalan normal tanpanya (itulah kondisi bawaannya
sekarang).

Cara pakainya ada di `public/models/motions/README.md`, ringkasnya:

1. Taruh berkas `.vrma` di `public/models/motions/`.
2. Daftarkan nama berkasnya di `motions.json` (satu per slide, plus satu
   opsional untuk reaksi klik).
3. Selama entrinya `null` (kondisi bawaan sekarang, lihat isi
   `motions.json`), runtime animasi klip **tidak pernah diunduh sama
   sekali**, tidak ada biaya performa untuk fitur yang tidak dipakai.

**Peringatan lisensi yang sudah ditulis eksplisit di README dan
`.gitignore`: jangan commit berkas `.vrma` ke repo ini.** Paket motion
gratisan yang umum beredar (termasuk paket resmi VRoid Project) melarang
distribusi ulang dalam bentuk yang bisa diekstrak, dan situs statis publik
plus repo GitHub publik keduanya persis melakukan itu. `.gitignore` sudah
menahan `public/models/motions/*.vrma` secara khusus, jangan dihapus tanpa
memastikan lisensi berkas yang mau ditambahkan benar-benar mengizinkan.

---

## 9. Sistem blog

Dibangun 18 Agustus 2026 untuk memenuhi syarat blog magang (satu artikel per
minggu, dari Bu Dewi selaku dosen pembimbing). Dua berkas baru:

- **`src/pages/blog/index.astro`**: daftar kartu ringkas (judul, cuplikan,
  tag, tanggal), sudah ada sebelumnya.
- **`src/pages/blog/[slug].astro`** (baru): halaman artikel penuh per post,
  dibuat lewat `getStaticPaths()` Astro yang membaca daftar `slug` dari
  `content.id.blog.posts` saat build, jadi tiap post otomatis dapat
  halamannya sendiri di `/blog/<slug>` tanpa perlu menulis rute manual.

Skema datanya (`BlogPostEntry` di `content.ts`):

```ts
interface BlogPostEntry {
  slug: string;      // dipakai di URL, harus unik
  title: string;
  excerpt: string;    // ringkasan satu-dua kalimat, tampil di kartu
  date: string;        // format YYYY-MM-DD
  tag: string;
  body: string[];      // artikel penuh, satu paragraf per elemen, TEKS POLOS
}
```

**`body` wajib teks polos**, alasan yang sama seperti bagian 4: skrip ganti
bahasa memakai `textContent`. Setiap entri di array `body` versi `id` dan
`en` harus **jumlahnya sama persis**, karena halaman detail memasangkan
paragraf ID ke-`i` dengan paragraf EN ke-`i` secara berurutan
(`enPost.body[i]`), bukan lewat penanda lain.

Menambah post baru: tambahkan satu objek ke **kedua** array
`content.id.blog.posts` dan `content.en.blog.posts` (urutan dan `slug` harus
sama persis di keduanya), lalu jalankan `npm run astro check` untuk
memastikan tidak ada yang lupa diterjemahkan.

Per 18 Agustus 2026 ada lima post, mengikuti minggu magang (20 Juli - 21
Agustus, lima minggu): Minggu 1, 2, 3, dan dua post untuk Minggu 4. **Minggu
5 sengaja belum ditulis**, ditunda sampai ujian magang minggu itu selesai.

---

## 10. Deploy ke GitHub Pages

`.github/workflows/deploy.yml`: **setiap push ke branch `main` memicu build
dan deploy otomatis** lewat `withastro/action@v3`, langsung tayang di
`https://iputuarcana.github.io`. Tidak ada jendela review di antara push dan
tayang, sama seperti peringatan yang sudah berlaku di proyek avatar Shavira
untuk branch `dev`-nya.

`astro.config.mjs` menyetel `site` ke domain itu tanpa `base`, karena situs
ini dilayani dari akar domain (`username.github.io`), bukan dari sub-path
repo.

---

## 11. Kuirk dan hal yang wajib diketahui

- **Karakter Lionk tidak muncul di layar sempit (<1100px), dengan
  `prefers-reduced-motion` aktif, atau koneksi hemat data.** Ini disengaja,
  bukan bug, jangan dilaporkan sebagai "Lionk hilang" tanpa cek tiga syarat
  ini dulu.
- **Isi `data-i18n-id`/`data-i18n-en` tidak boleh mengandung tag HTML**
  (bagian 4). Ini sudah dua kali jadi jebakan nyata: sekali di draf awal
  paragraf `About`, sekali lagi saat menulis isi blog.
- **Jangan mengubah skrip `npm run dev/build/preview` kembali ke bentuk
  `astro dev` polos** tanpa memindahkan proyek ini keluar dari path yang
  mengandung karakter `&` (bagian 2).
- **Jangan commit berkas `.vrma`** ke folder motion (bagian 8), soal
  lisensi, bukan soal ukuran berkas.
- Search di header (`Header.astro`) cuma menyaring **judul** kartu berpenanda
  `[data-searchable]`, bukan pencarian teks penuh ke isi artikel blog.

---

## 12. Pekerjaan berikutnya yang belum selesai

- **Post blog Minggu 5** (17-21 Agustus), menunggu ujian magang selesai.
- `motions.json` masih seluruhnya `null`, Lionk masih sepenuhnya digerakkan
  pose buatan tangan, belum ada motion capture sungguhan terpasang.
- Belum ada RSS feed atau sitemap untuk halaman blog.

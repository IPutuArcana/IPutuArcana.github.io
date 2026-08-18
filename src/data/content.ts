export type Lang = 'id' | 'en';

export interface ProjectEntry {
  title: string;
  description: string;
  tags: string[];
  /** Omitted while the repository is private — the card then shows
      `projects.privateLabel` instead of linking somewhere that 404s. */
  href?: string;
  /** Coursework and practice repos. Still listed in full, but folded into a
      collapsed group so the selected work above stays legible. */
  archived?: boolean;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface StatEntry {
  value: string;
  label: string;
}

export interface BlogPostEntry {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  /** Full article body, one plain-text paragraph per entry — no inline
      markup, since the language toggle swaps text via textContent. */
  body: string[];
}

export interface SiteContent {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    about: string;
    skills: string;
    projects: string;
    blog: string;
    contact: string;
  };
  hero: {
    eyebrow: string;
    name: string;
    tagline: string;
    intro: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: StatEntry[];
  };
  about: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
  };
  skills: {
    eyebrow: string;
    heading: string;
    note: string;
    groups: SkillGroup[];
  };
  projects: {
    eyebrow: string;
    heading: string;
    note: string;
    items: ProjectEntry[];
    linkLabel: string;
    privateLabel: string;
    archiveLabel: string;
    archiveNote: string;
  };
  blog: {
    eyebrow: string;
    heading: string;
    note: string;
    posts: BlogPostEntry[];
  };
  contact: {
    eyebrow: string;
    heading: string;
    body: string;
    email: string;
  };
  footer: {
    backToTop: string;
    rights: string;
  };
  themeToggle: {
    toLight: string;
    toDark: string;
  };
  langToggle: {
    label: string;
  };
}

export const content: Record<Lang, SiteContent> = {
  id: {
    meta: {
      title: 'I Putu Arcana — Portofolio',
      description:
        'Portofolio I Putu Arcana, mahasiswa Ilmu Komputer di Universitas Pendidikan Ganesha.',
    },
    nav: {
      about: 'Tentang',
      skills: 'Keahlian',
      projects: 'Proyek',
      blog: 'Blog',
      contact: 'Kontak',
    },
    hero: {
      eyebrow: 'Mahasiswa Ilmu Komputer',
      name: 'I Putu Arcana',
      tagline: 'Membangun hal-hal kecil dengan niat yang jelas.',
      intro:
        'Saya belajar merancang dan membangun perangkat lunak sambil mencari kebenaran di balik setiap masalah yang saya pecahkan.',
      ctaPrimary: 'Lihat proyek',
      ctaSecondary: 'Hubungi saya',
      stats: [
        { value: '3', label: 'Proyek aktif' },
        { value: '30+', label: 'Repositori publik' },
        { value: 'UNDIKSHA', label: 'Kampus saat ini' },
      ],
    },
    about: {
      eyebrow: 'Tentang',
      heading: 'Sedikit tentang saya',
      paragraphs: [
        'Saya I Putu Arcana, mahasiswa Ilmu Komputer di Universitas Pendidikan Ganesha. Saya tertarik pada proses membangun sesuatu dari nol — mulai dari ide, struktur, sampai detail kecil yang membuatnya terasa selesai.',
        'Juli sampai Agustus 2026 saya magang di UPA TIK Undiksha: memberi chatbot kampus Shavira sebuah avatar 3D yang bisa bicara, sekaligus membangun bot yang mencari dan merangkum dokumen arsip. Di luar kampus saya ikut mengerjakan sistem rental motor tiga cabang yang percakapan pelanggannya ditangani agen AI.',
        'Di luar kode, saya menggambar dan berlatih calisthenics — dua hal yang sama-sama mengajarkan saya soal kesabaran dan pengulangan. Cita-cita saya sederhana: terus mengungkap kebenaran di balik setiap hal yang saya pelajari.',
      ],
    },
    skills: {
      eyebrow: 'Keahlian',
      heading: 'Apa yang saya kerjakan',
      note: 'Yang benar-benar terpakai di proyek di bawah, bukan daftar keinginan.',
      groups: [
        { label: 'Bahasa', items: ['TypeScript', 'Python', 'C#', 'C++'] },
        { label: 'Framework', items: ['Next.js', 'SvelteKit', 'Astro', 'Godot'] },
        { label: 'Alat', items: ['Git', 'Docker', 'PostgreSQL', 'Three.js', 'Blender'] },
      ],
    },
    projects: {
      eyebrow: 'Proyek',
      heading: 'Pekerjaan terpilih',
      note: 'Pekerjaan magang dan klien, situs ini, serta proyek yang saya mulai sendiri di luar tugas kuliah.',
      linkLabel: 'Lihat proyek',
      privateLabel: 'Repo privat',
      archiveLabel: 'Arsip & tugas kuliah',
      archiveNote: 'Repo tugas kelas dan latihan, disimpan apa adanya.',
      items: [
        {
          title: 'Avatar 3D Shavira',
          description:
            'Wajah dan tubuh untuk Shavira, chatbot kampus Undiksha: avatar 3D yang bicara dengan lip-sync real-time, ekspresi, dan gestur lengan yang mengikuti isi jawabannya. Dibangun sebagai klien murni di atas SvelteKit 5 dan Threlte — seluruh RAG, LLM, dan TTS tetap di layanan tim, proyek ini yang merendernya jadi sosok yang bicara. Dikerjakan selama magang di UPA TIK Undiksha.',
          tags: ['SvelteKit', 'Threlte', 'Lip-sync'],
        },
        {
          title: 'Bot Arsip Shavira',
          description:
            'Bot yang mencari dan merangkum dokumen arsip Undiksha sesuai pertanyaan pengguna. Sistem arsipnya belum rampung dan dokumentasi API-nya menyusul, jadi seluruh ketergantungan pada sistem itu dikurung dalam satu lapisan adapter sempit supaya pipeline-nya bisa dibangun lebih dulu. Penyaringannya fail-closed: hanya dokumen berklasifikasi keamanan "Umum" yang boleh diindeks.',
          tags: ['Python', 'RAG', 'Integrasi API'],
        },
        {
          title: 'Rentalday',
          description:
            'Sistem manajemen rental motor untuk tiga cabang, dengan agen WhatsApp yang menangani percakapan pelanggan lewat state machine — pahami, putuskan, tanya, jawab. Next.js dan Drizzle di atas skema multi-tenant yang sengaja dipertahankan, dilengkapi invoice PDF dan pemantauan error Sentry.',
          tags: ['Next.js', 'Drizzle', 'Agen AI'],
        },
        {
          title: 'Portofolio ini',
          description:
            'Situs yang sedang kamu baca. Astro statis dua bahasa dengan mode terang-gelap, dan karakter 3D VRM yang rig-nya digerakkan manual di atas Three.js.',
          tags: ['Astro', 'Three.js', 'TypeScript'],
          href: 'https://github.com/IPutuArcana/IPutuArcana.github.io',
        },
        {
          title: 'RAG Komparatif Multi-Dokumen Temporal',
          description:
            'Eksperimen retrieval-augmented generation yang membandingkan banyak dokumen sekaligus dengan dimensi waktu. Dikerjakan sebagai siklus coba, error, belajar, perbaiki.',
          tags: ['Python', 'RAG'],
          href: 'https://github.com/IPutuArcana/RAG-Komparatif-Multi-Dokumen-Temporal',
        },
        {
          title: 'Balinese TTS',
          description: 'Percobaan membangun text-to-speech untuk bahasa Bali.',
          tags: ['Jupyter', 'TTS'],
          href: 'https://github.com/IPutuArcana/Balinese-TTS',
        },
        {
          title: 'Akashudra',
          description: 'Proyek asisten pribadi.',
          tags: ['Python', 'Asisten'],
          href: 'https://github.com/IPutuArcana/Akashudra',
        },
        {
          title: 'Arcana POS',
          description: 'Aplikasi point of sale berbasis Laravel. Tugas akhir kelas Teknologi Web.',
          tags: ['Laravel', 'Blade'],
          href: 'https://github.com/IPutuArcana/arcana-pos',
        },
        {
          title: 'Wumpus World Agent',
          description: 'Agen AI yang menjelajah dan bertahan hidup di Wumpus World. Tugas kelas Intelligent Agent.',
          tags: ['C#', 'Agen AI'],
          href: 'https://github.com/IPutuArcana/WUMPUS-WORLD-AGENT',
          archived: true,
        },
        {
          title: 'Path Pergerakan Karakter Game',
          description:
            'Agen pencari jalur untuk pergerakan karakter game, sekaligus membandingkan algoritma A* dengan Dijkstra.',
          tags: ['C#', 'Pathfinding'],
          href: 'https://github.com/IPutuArcana/-path-pergerakan-karakter-game',
          archived: true,
        },
        {
          title: 'TicTacToe Minimax',
          description: 'Agen yang bermain tic-tac-toe memakai minimax saja. Tugas kelas Intelligent Agent.',
          tags: ['C#', 'Minimax'],
          href: 'https://github.com/IPutuArcana/TicTacToe',
          archived: true,
        },
        {
          title: 'School Scheduler',
          description: 'Penjadwal pelajaran sekolah yang disusun dengan algoritma genetika. Tugas kelas Intelligent Agent.',
          tags: ['C#', 'Algoritma Genetika'],
          href: 'https://github.com/IPutuArcana/School-Scheduler-',
          archived: true,
        },
        {
          title: 'Eight Queens',
          description: 'Program penyelesai Eight Queens Problem memakai algoritma genetika.',
          tags: ['C#', 'Algoritma Genetika'],
          href: 'https://github.com/IPutuArcana/solve-Eight-Queen-Problem-using-Genetic-Algorithm',
          archived: true,
        },
        {
          title: 'LastSISTER',
          description: 'Proyek untuk kelas Sistem Terdistribusi.',
          tags: ['Python', 'Sistem Terdistribusi'],
          href: 'https://github.com/IPutuArcana/LastSISTER',
          archived: true,
        },
        {
          title: 'Machine Learning Task 1',
          description: 'Tugas pertama kelas Machine Learning di Undiksha.',
          tags: ['Jupyter', 'Machine Learning'],
          href: 'https://github.com/IPutuArcana/MachineLearningTask1_UNDIKSHA',
          archived: true,
        },
        {
          title: 'Scrap Playstore',
          description: 'Percobaan mengambil data aplikasi dari Play Store.',
          tags: ['Jupyter', 'Scraping'],
          href: 'https://github.com/IPutuArcana/ScrapPlaystore',
          archived: true,
        },
        {
          title: 'Simple Web',
          description: 'Situs sederhana berbasis PHP untuk tugas kuliah.',
          tags: ['PHP', 'Web'],
          href: 'https://github.com/IPutuArcana/Simple-WEB-forASSignment',
          archived: true,
        },
        {
          title: 'Tata Surya HTML & CSS',
          description: 'Visualisasi tata surya murni dengan HTML dan CSS. Tugas kuliah.',
          tags: ['HTML', 'CSS'],
          href: 'https://github.com/IPutuArcana/Solar-Systems-HTML-CSS',
          archived: true,
        },
        {
          title: 'Toko Tag Ayam',
          description: 'Aplikasi web toko berbasis PHP.',
          tags: ['PHP', 'Web'],
          href: 'https://github.com/IPutuArcana/toko-tag-ayam',
          archived: true,
        },
        {
          title: 'Computer Graphics',
          description: 'Kumpulan kode yang saya tulis sepanjang kelas Grafika Komputer.',
          tags: ['C++', 'Grafika'],
          href: 'https://github.com/IPutuArcana/Computer-Graphics',
          archived: true,
        },
        {
          title: 'Automata',
          description: 'Kode untuk kelas Teori Komputasi.',
          tags: ['C++', 'Automata'],
          href: 'https://github.com/IPutuArcana/Automata',
          archived: true,
        },
        {
          title: 'TechWEB',
          description: 'Repositori HTML untuk kelas Teknologi Web.',
          tags: ['HTML', 'Web'],
          href: 'https://github.com/IPutuArcana/TechWEB',
          archived: true,
        },
        {
          title: 'Coursework',
          description: 'Kumpulan tugas kuliah dalam bentuk notebook.',
          tags: ['Jupyter', 'Kuliah'],
          href: 'https://github.com/IPutuArcana/Coursework',
          archived: true,
        },
        {
          title: 'Third Person Controller',
          description: 'Catatan belajar membuat third person controller dan mengatur kamera di Godot.',
          tags: ['Godot', 'GDScript'],
          href: 'https://github.com/IPutuArcana/Third-Person-Controller',
          archived: true,
        },
        {
          title: 'Model Selection — Klasifikasi',
          description: 'Membandingkan beberapa model klasifikasi untuk memilih yang paling cocok dengan datanya.',
          tags: ['Jupyter', 'Machine Learning'],
          href: 'https://github.com/IPutuArcana/Model_Selection_Classification',
          archived: true,
        },
        {
          title: 'Model Selection — Regresi',
          description: 'Mencari model regresi yang paling pas untuk sebuah dataset.',
          tags: ['Python', 'Machine Learning'],
          href: 'https://github.com/IPutuArcana/Model_Selection_Regression',
          archived: true,
        },
        {
          title: 'My First Game',
          description: 'Game pertama saya, dibuat sambil mengikuti tutorial Brackeys sampai selesai.',
          tags: ['Game', 'Tutorial'],
          href: 'https://github.com/IPutuArcana/myFirstGame',
          archived: true,
        },
        {
          title: 'Benchmark Algoritma Sorting',
          description: 'Benchmark beberapa algoritma pengurutan, dipakai sebagai apendiks paper kuliah.',
          tags: ['C++', 'Benchmark'],
          href: 'https://github.com/IPutuArcana/DAA_Benchmark_sortingAlgorithm',
          archived: true,
        },
        {
          title: 'Leetcode Bareng',
          description: 'Latihan soal LeetCode yang dikerjakan bareng-bareng.',
          tags: ['C++', 'Latihan'],
          href: 'https://github.com/IPutuArcana/Leetcode-bareng',
          archived: true,
        },
        {
          title: 'Steganografi',
          description: 'Implementasi steganografi dalam bahasa C.',
          tags: ['C', 'Steganografi'],
          href: 'https://github.com/IPutuArcana/Steganographi',
          archived: true,
        },
        {
          title: 'Latihan Soal',
          description: 'Kumpulan latihan soal pemrograman dalam C++.',
          tags: ['C++', 'Latihan'],
          href: 'https://github.com/IPutuArcana/LATIHAN-SOAL',
          archived: true,
        },
        {
          title: 'Practice',
          description: 'Repositori latihan C++.',
          tags: ['C++', 'Latihan'],
          href: 'https://github.com/IPutuArcana/Practice',
          archived: true,
        },
        {
          title: 'TRY-WEB',
          description: 'Repositori paling awal saya, dibuat tahun 2022 untuk belajar coding.',
          tags: ['HTML', 'Awal'],
          href: 'https://github.com/IPutuArcana/TRY-WEB',
          archived: true,
        },
      ],
    },
    blog: {
      eyebrow: 'Blog',
      heading: 'Catatan & pemikiran',
      note: 'Catatan kerja, bukan tutorial.',
      posts: [
        {
          slug: 'tanda-tangan-pejabat-jadi-judul-bab',
          title: 'Tanda tangan pejabat yang mengaku sebagai judul bab',
          excerpt:
            'Menguji ulang cara memotong dokumen dengan sampel delapan puluh kali lebih besar, dan menemukan dua jenis kesalahan yang tidak pernah terlihat di sampel kecil.',
          date: '2026-07-24',
          tag: 'Magang',
          body: [
            'Minggu pertama magang ini dimulai dengan tugas yang kedengarannya sederhana: chatbot kampus Shavira kadang menjawab ngawur, dan saya diminta mencari tahu kenapa. Hari pertama saya habiskan untuk black-box testing, menembak pertanyaan ke Shavira satu per satu dan mencatat pola jawabannya yang aneh ke dalam tabel log.',
            'Dari situ muncul empat kategori noise yang bertahan sepanjang magang ini: format dan karakter sampah, konteks yang bercampur, halusinasi murni, dan jawaban yang memang bersih. Tapi kategori saja tidak cukup, saya perlu tahu di mana persisnya proses pemotongan dokumen ikut menyumbang masalah.',
            'Saya membangun "structural chunker", program yang memotong dokumen jadi potongan lebih kecil sebelum diindeks, dengan heuristik berbasis kata kunci dokumen hukum Indonesia seperti BAB, Pasal, dan Menimbang. Diuji ke dua dokumen contoh, hasilnya kelihatan bagus. Saya nyaris berhenti di situ.',
            'Untungnya saya tidak berhenti. Hari kelima saya perbesar sampelnya jadi seratus enam puluh dokumen, delapan puluh kali lipat dari pengujian pertama, dan angkanya berubah total. Cara lama memotong kata di tengah kalimat pada 66,6% batas antar-potongan. Cara baru saya turun ke 16,3%, tapi baru terlihat jelas di skala besar, bukan di dua dokumen.',
            'Yang lebih menarik bukan angkanya, tapi apa yang tersembunyi di baliknya. Saya menemukan dokumen daftar isi yang rusak, sehingga potongan yang diambil sistem seolah-olah judul bab padahal bukan. Saya juga menemukan tanda tangan pejabat dan catatan kaki dokumen resmi ikut terbaca sistem seolah-olah itu judul bab, bukan bagian penutup dokumen.',
            'Ada juga dokumen aturan biaya kuliah dari universitas lain di luar Undiksha yang ikut terpilih ketika saya bertanya soal biaya kuliah Undiksha sendiri. Untungnya kali ini jawabannya tetap benar, tapi saya tahu itu keberuntungan, bukan jaminan. Empat naskah draf berbeda dari dokumen pedoman yang sama juga saya temukan tersimpan bersamaan, murni soal kerapian data, bukan soal cara memotong dokumen.',
            'Pelajaran paling penting minggu ini bukan tentang chunking. Menguji dengan sampel kecil bisa menyesatkan. Dua kesalahan pada program pemotong dokumen baru terlihat setelah saya menguji dengan seratus enam puluh dokumen, dan itu tidak akan pernah ketahuan kalau saya cuma memeriksa dua dokumen seperti sebelumnya. Menyamaratakan semua masalah sebagai satu masalah pemotongan dokumen saja akan keliru.',
          ],
        },
        {
          slug: 'asumsi-yang-runtuh',
          title: 'Asumsi yang runtuh begitu ketemu API aslinya',
          excerpt:
            'Saya merancang adapter arsip Undiksha di atas tiga asumsi. Satu probe read-only ke API asli menjatuhkan dua di antaranya — dan memunculkan dua temuan yang tidak ada di desain manapun.',
          date: '2026-07-28',
          tag: 'Magang',
          body: [
            'Selain kerja sanitasi data yang sudah berjalan, saya dapat tugas tambahan dari rapat mingguan: membangun bot yang mengambil data dari sistem arsip Undiksha sesuai pertanyaan pengguna. Dokumentasi API-nya belum ada saat itu, jadi saya menulis tiga asumsi kerja secara eksplisit dan mulai membangun di atasnya, alih-alih menunggu.',
            'Prinsip desainnya: skema data kanonis di tengah, satu lapisan adapter sempit di pinggir yang menyentuh bentuk API asli. Kalau salah satu asumsi ternyata keliru, yang perlu diubah cuma lapisan adapter itu, bukan seluruh pipeline sanitasi dan chunking yang sudah teruji.',
            'Hari ini dokumentasi API-nya akhirnya datang, dan sebelum menulis satu baris kode adapter, saya jalankan dulu satu probe read-only ke API asli untuk menguji ketiga asumsi itu dengan bukti, bukan tebakan.',
            'Dua di antaranya langsung runtuh. Saya mengasumsikan ada endpoint listing dengan cursor waktu untuk menarik data yang baru diperbarui saja. Ternyata API cuma bisa difilter tahun dan status aktif, tidak ada cursor sama sekali. Saya juga mengasumsikan field kategori dokumen dari API tidak bisa diandalkan. Ternyata sebaliknya, field itu justru jauh lebih reliable daripada rencana cadangan saya sendiri.',
            'Yang lebih menarik, probe itu memunculkan dua temuan yang tidak ada di desain manapun sebelumnya. Pertama, API ternyata sama sekali tidak mengembalikan teks dokumen, cuma metadata dan tautan ke berkas PDF. Karena dokumennya hasil pindaian, itu berarti saya butuh tahap OCR yang belum pernah saya rencanakan sama sekali.',
            'Kedua, tiap dokumen ternyata membawa penanda tingkat kerahasiaan. Itu sinyal bahwa sistem arsip menyimpan dokumen yang bukan untuk konsumsi publik, jadi saya pasang penyaring "fail-closed": hanya dokumen berklasifikasi "Umum" yang boleh diindeks dan dijawab Shavira, sampai ada konfirmasi eksplisit sebaliknya.',
            'Pelajaran hari ini: menulis asumsi secara eksplisit sebelum ada kepastian bukan buang waktu, itu yang membuat kekeliruan bisa dievaluasi dengan jujur begitu bukti datang, dan membuat perbaikannya terarah ke satu lapisan kecil, bukan bongkar total.',
          ],
        },
        {
          slug: 'kalimat-yang-tertulis-bukan-yang-terdengar',
          title: 'Kalimat yang tertulis di kode, bukan yang terdengar',
          excerpt:
            'Mencari kenapa satu pose salam tidak muncul di awal sapaan, saya malah menemukan bahwa teks yang mengatur gerak mulut selama ini berbeda dari suara yang benar-benar diputar.',
          date: '2026-08-05',
          tag: 'Proses',
          body: [
            'Sejak awal Agustus lengan Shavira saya matikan total karena kedua lengan bawahnya saling menembus tiap kali badan ikut berputar. Minggu ini saya coba hidupkan lagi, tapi dengan cara berbeda: badan tetap saya kunci diam, dan yang bergerak cuma lengan, lewat kumpulan pose yang saya susun sendiri sambil melihat hasilnya langsung di layar, bukan tebakan.',
            'Ada dua pose yang jadi milik saya sendiri hari itu: pose salam dan pose menjelaskan. Gerakan lengannya sengaja saya buat sedikit melewati titik akhir lalu kembali menetap, supaya tidak terlihat kaku seperti mesin. Pose salam juga saya batasi supaya hanya muncul ketika kalimat yang diucapkan memang memuat sapaan, tidak sembarang kalimat seperti sebelumnya.',
            'Sambil mengerjakan itu saya juga memasang tombol untuk menghentikan Shavira di tengah bicara, lewat tombol di layar maupun tombol Escape. Ternyata mematikan suara saja tidak cukup. Kalimat berikutnya yang sudah mengantre di belakang layar tetap mulai bicara sendiri beberapa detik kemudian, jadi saya beri setiap giliran bicara nomor urutnya sendiri, supaya seluruh proses yang masih berjalan tahu gilirannya sudah dibatalkan.',
            'Yang paling berkesan justru muncul dari usaha mencari kenapa pose salam tidak pernah muncul di awal sapaan pembuka. Saya telusuri satu per satu, dan menemukan sesuatu yang lebih besar dari dugaan awal: kalimat sapaan yang tertulis di dalam program ternyata berbeda dari kalimat yang benar-benar diucapkan pada rekaman suaranya.',
            'Ini penting karena teks itu juga dipakai untuk mengatur waktu gerak mulut. Berarti sejak awal, gerak mulut Shavira selama sapaan pembuka memang tidak pernah benar-benar selaras dengan suaranya, dan baru minggu ini saya sadari kenapa. Untuk sementara saya tambal dengan menuliskan gestur secara langsung di titik pemutaran sapaan, perbaikan sesungguhnya menunggu saya menuliskan ulang kalimat yang benar-benar diucapkan tiap berkas suara.',
            'Bimbingan ke-2 juga terlaksana minggu ini, dan sore harinya saya lanjutkan dengan memperbaiki tautan pada kolom chat yang sempat tidak terlihat pengguna, serta menambah variasi gerakan tangan supaya Shavira tidak terlihat mengulang gestur yang sama persis setiap kali menjelaskan sesuatu.',
            'Pelajaran minggu ini: gejala yang sama di permukaan bisa berasal dari sumber yang sama sekali berbeda dari dugaan awal. Saya kira masalahnya ada di logika pose, ternyata sumbernya di tempat yang bahkan tidak saya curigai, di teks yang menentukan waktu, bukan di gerakannya sendiri.',
          ],
        },
        {
          slug: 'wajah-yang-benar-benar-bicara',
          title: 'Memberi Shavira wajah yang benar-benar bicara',
          excerpt:
            'Kenapa avatar 3D-nya sengaja tidak punya backend sendiri, dan apa yang berubah ketika lip-sync harus nyambung dengan kalimat yang baru saja selesai dihasilkan.',
          date: '2026-08-10',
          tag: 'Catatan',
          body: [
            'Hari ini saya duduk dan menulis dokumentasi arsitektur menyeluruh untuk sistem visualisasi avatar ini, dari nol sampai selesai, sebagai rujukan pribadi sekaligus bahan menghadapi ujian nanti. Menulisnya urut ternyata memaksa saya melihat satu hal yang selama ini cuma saya ketahui secara terpisah-pisah: proyek ini sengaja sama sekali tidak punya backend sendiri.',
            'Seluruh retrieval, model bahasa, dan text-to-speech tetap ada di layanan tim lain. Yang saya kerjakan cuma sisi visual dan suara, klien murni yang menerima teks dan berkas audio, lalu merendernya jadi sosok yang bicara. Tidak ada satu route server pun, tidak ada basis data, seluruh keluarannya berkas statis.',
            'Ada dua jalur jawaban bisa datang, dan aplikasi memilih sendiri: jalur streaming per kalimat, dan jalur deploy yang mengirim satu jawaban utuh sekaligus. Kalau jalur streaming gagal, aplikasi mundur otomatis ke jalur deploy dan tetap menjawab, cuma tidak per kalimat.',
            'Yang berubah begitu saya menuliskan ini semua secara eksplisit: lip-sync harus menyambung dengan audio yang baru saja selesai dihasilkan pihak lain, bukan berkas yang sudah lama tersedia. Itu artinya sistem lip-sync tidak boleh mengasumsikan audio sudah "siap dan stabil", ia harus tetap bekerja meski audionya baru saja tiba.',
            'Delapan butir masukan dari pimpinan juga masuk hari ini lewat pembimbing lapangan, dan saya pilah satu per satu. Empat butir jadi tanggung jawab saya sendiri, dua di sisi rekan yang menangani server, satu sudah selesai, satu lagi masih perlu dipastikan maksudnya.',
            'Salah satu yang saya kerjakan sendiri: warna jas dan rambut Shavira. Ternyata jas dan kemejanya berbagi satu bahan tekstur yang sama, jadi pemisahannya saya ukur langsung dari tingkat kecerahan gambar teksturnya, bukan ditebak. Latar belakang juga saya buat tembus pandang, supaya avatarnya bisa ditempelkan di situs lain hanya sebagai sosoknya saja.',
            'Fitur kecil lain yang saya kerjakan hari ini: pengakuan topik pertanyaan sebelum jawaban sungguhan tiba, untuk menutupi waktu tunggu. Saya lengkapi dengan penyaring kata tidak pantas, diuji ke tiga puluh kasus termasuk penyamaran pakai angka dan sisipan spasi, semuanya lulus tanpa satu pun kalimat wajar yang ikut ditolak.',
          ],
        },
        {
          slug: 'jari-mengepal-ke-telapak',
          title: 'Jari mengepal ke telapak, bukan ke buku jari',
          excerpt:
            'Berjam-jam habis buat membenahi rig tangan karakter 3D di halaman ini. Catatan soal seberapa jauh detail sekecil itu menentukan sebuah pose terasa hidup atau janggal.',
          date: '2026-08-16',
          tag: 'Proses',
          body: [
            'Pustaka pose lengan Shavira sudah berjalan beberapa minggu, tapi ada satu detail yang selalu saya lewatkan: telapak tangan yang mengepal. Dari jauh terlihat baik-baik saja, begitu kamera mendekat, kepalan itu terasa salah, seperti tangan yang menekuk ke arah yang keliru.',
            'Setiap ruas jari punya sumbu putarnya sendiri, dan sumbu itu tidak sama untuk tiap jari, apalagi tiap ruas. Aturan yang saya pegang sejak awal proyek ini: arah sumbu tulang tidak pernah ditebak, selalu diukur dulu, karena menebak yang salah gagal tanpa bersuara, animasinya tetap berjalan, cuma arahnya keliru.',
            'Kesalahan yang saya perbaiki hari ini sederhana untuk dijelaskan tapi lama ditemukan: jari yang seharusnya menekuk ke telapak tangan malah menekuk ke arah buku jari, ke belakang, karena tanda putarannya terbalik satu ruas jari saja.',
            'Satu ruas yang salah arah itu cukup untuk membuat seluruh kepalan terlihat janggal, meski sembilan ruas lain di tangan yang sama sudah benar. Bukan soal jumlah kesalahan, tapi soal betapa sensitifnya mata terhadap satu bagian kecil yang tidak sinkron dengan bagian di sekitarnya.',
            'Setelah diperbaiki, saya bandingkan dua rekaman layar berdampingan, sebelum dan sesudah. Perbedaannya kecil di atas kertas, satu angka rotasi di satu tulang, tapi di layar bedanya jelas sekali: yang satu terlihat seperti kepalan tangan sungguhan, yang lain terlihat seperti tangan yang dipaksa menekuk.',
            'Pelajaran hari ini bukan soal jari secara khusus. Semakin dekat sebuah gerakan ke tubuh manusia, semakin kecil toleransi kesalahannya. Detail yang di permukaan kelihatan remeh, satu sumbu rotasi di satu ruas jari, ternyata yang membedakan sebuah pose terasa hidup atau terasa janggal.',
          ],
        },
      ],
    },
    contact: {
      eyebrow: 'Kontak',
      heading: "Mari terhubung",
      body: 'Terbuka untuk kolaborasi, diskusi, atau sekadar menyapa.',
      email: 'aarrcane@gmail.com',
    },
    footer: {
      backToTop: 'Kembali ke atas',
      rights: 'Seluruh hak cipta dilindungi.',
    },
    themeToggle: {
      toLight: 'Mode terang',
      toDark: 'Mode gelap',
    },
    langToggle: {
      label: 'EN',
    },
  },
  en: {
    meta: {
      title: 'I Putu Arcana — Portfolio',
      description:
        'Portfolio of I Putu Arcana, a Computer Science student at Ganesha University of Education.',
    },
    nav: {
      about: 'About',
      skills: 'Skills',
      projects: 'Projects',
      blog: 'Blog',
      contact: 'Contact',
    },
    hero: {
      eyebrow: 'Computer Science Student',
      name: 'I Putu Arcana',
      tagline: 'Building small things with clear intent.',
      intro:
        "I'm learning to design and build software while chasing the truth behind every problem I solve.",
      ctaPrimary: 'View projects',
      ctaSecondary: 'Get in touch',
      stats: [
        { value: '3', label: 'Active projects' },
        { value: '30+', label: 'Public repositories' },
        { value: 'UNDIKSHA', label: 'Currently studying at' },
      ],
    },
    about: {
      eyebrow: 'About',
      heading: 'A little about me',
      paragraphs: [
        "I'm I Putu Arcana, a Computer Science student at Ganesha University of Education. I'm drawn to the process of building something from nothing — from idea, to structure, to the small details that make it feel finished.",
        'From July to August 2026 I interned at UPA TIK Undiksha: giving the campus chatbot Shavira a 3D avatar that can actually speak, and building a bot that finds and summarises archive documents. Outside campus I work on a three-branch motorbike rental system whose customer conversations are handled by an AI agent.',
        'Outside of code, I draw and practice calisthenics — two things that both teach patience and repetition. My goal is simple: keep uncovering the truth behind everything I learn.',
      ],
    },
    skills: {
      eyebrow: 'Skills',
      heading: 'What I work with',
      note: 'What actually shipped in the projects below, not a wish list.',
      groups: [
        { label: 'Languages', items: ['TypeScript', 'Python', 'C#', 'C++'] },
        { label: 'Frameworks', items: ['Next.js', 'SvelteKit', 'Astro', 'Godot'] },
        { label: 'Tools', items: ['Git', 'Docker', 'PostgreSQL', 'Three.js', 'Blender'] },
      ],
    },
    projects: {
      eyebrow: 'Projects',
      heading: 'Selected work',
      note: 'Internship and client work, this site, and the projects I started on my own outside coursework.',
      linkLabel: 'View project',
      privateLabel: 'Private repo',
      archiveLabel: 'Archive & coursework',
      archiveNote: 'Class assignments and practice repos, kept as they are.',
      items: [
        {
          title: 'Shavira 3D Avatar',
          description:
            "A face and body for Shavira, Undiksha's campus chatbot: a 3D avatar that speaks with real-time lip-sync, facial expression, and arm gestures that follow what it is actually saying. Built as a pure client on SvelteKit 5 and Threlte — the RAG, LLM, and TTS all stay in the team's services, and this project renders the result as someone talking. Built during my internship at UPA TIK Undiksha.",
          tags: ['SvelteKit', 'Threlte', 'Lip-sync'],
        },
        {
          title: 'Shavira Archive Bot',
          description:
            'A bot that searches and summarises Undiksha archive documents in response to a user\'s question. The archive system is unfinished and its API docs arrived late, so every dependency on it is confined to one narrow adapter layer, letting the pipeline be built first. Filtering is fail-closed: only documents classified "Public" may be indexed.',
          tags: ['Python', 'RAG', 'API integration'],
        },
        {
          title: 'Rentalday',
          description:
            'A motorbike rental management system across three branches, with a WhatsApp agent that handles customer conversations through a state machine — understand, decide, ask, reply. Next.js and Drizzle on a deliberately preserved multi-tenant schema, plus PDF invoices and Sentry error monitoring.',
          tags: ['Next.js', 'Drizzle', 'AI agent'],
        },
        {
          title: 'This portfolio',
          description:
            'The site you are reading. A static bilingual Astro build with light and dark modes, and a 3D VRM character whose rig is driven by hand on top of Three.js.',
          tags: ['Astro', 'Three.js', 'TypeScript'],
          href: 'https://github.com/IPutuArcana/IPutuArcana.github.io',
        },
        {
          title: 'Comparative Temporal Multi-Document RAG',
          description:
            'A retrieval-augmented generation experiment comparing many documents at once along a time dimension. Worked through as a cycle of try, break, learn, fix.',
          tags: ['Python', 'RAG'],
          href: 'https://github.com/IPutuArcana/RAG-Komparatif-Multi-Dokumen-Temporal',
        },
        {
          title: 'Balinese TTS',
          description: 'An attempt at building text-to-speech for the Balinese language.',
          tags: ['Jupyter', 'TTS'],
          href: 'https://github.com/IPutuArcana/Balinese-TTS',
        },
        {
          title: 'Akashudra',
          description: 'A personal assistant project.',
          tags: ['Python', 'Assistant'],
          href: 'https://github.com/IPutuArcana/Akashudra',
        },
        {
          title: 'Arcana POS',
          description: 'A Laravel point-of-sale application. Final project for my Web Technology class.',
          tags: ['Laravel', 'Blade'],
          href: 'https://github.com/IPutuArcana/arcana-pos',
        },
        {
          title: 'Wumpus World Agent',
          description: 'An AI agent that explores and survives the Wumpus World. Intelligent Agent coursework.',
          tags: ['C#', 'AI agent'],
          href: 'https://github.com/IPutuArcana/WUMPUS-WORLD-AGENT',
          archived: true,
        },
        {
          title: 'Game Character Pathfinding',
          description:
            'A pathfinding agent for game character movement, comparing the A* and Dijkstra algorithms side by side.',
          tags: ['C#', 'Pathfinding'],
          href: 'https://github.com/IPutuArcana/-path-pergerakan-karakter-game',
          archived: true,
        },
        {
          title: 'TicTacToe Minimax',
          description: 'An agent that plays tic-tac-toe using minimax alone. Intelligent Agent coursework.',
          tags: ['C#', 'Minimax'],
          href: 'https://github.com/IPutuArcana/TicTacToe',
          archived: true,
        },
        {
          title: 'School Scheduler',
          description: 'A school timetable scheduler built with a genetic algorithm. Intelligent Agent coursework.',
          tags: ['C#', 'Genetic algorithm'],
          href: 'https://github.com/IPutuArcana/School-Scheduler-',
          archived: true,
        },
        {
          title: 'Eight Queens',
          description: 'A program that solves the Eight Queens problem using a genetic algorithm.',
          tags: ['C#', 'Genetic algorithm'],
          href: 'https://github.com/IPutuArcana/solve-Eight-Queen-Problem-using-Genetic-Algorithm',
          archived: true,
        },
        {
          title: 'LastSISTER',
          description: 'A project for my Distributed Systems class.',
          tags: ['Python', 'Distributed systems'],
          href: 'https://github.com/IPutuArcana/LastSISTER',
          archived: true,
        },
        {
          title: 'Machine Learning Task 1',
          description: 'The first assignment for my Machine Learning class at Undiksha.',
          tags: ['Jupyter', 'Machine learning'],
          href: 'https://github.com/IPutuArcana/MachineLearningTask1_UNDIKSHA',
          archived: true,
        },
        {
          title: 'Scrap Playstore',
          description: 'An attempt at scraping app data from the Play Store.',
          tags: ['Jupyter', 'Scraping'],
          href: 'https://github.com/IPutuArcana/ScrapPlaystore',
          archived: true,
        },
        {
          title: 'Simple Web',
          description: 'A simple PHP site built for a class assignment.',
          tags: ['PHP', 'Web'],
          href: 'https://github.com/IPutuArcana/Simple-WEB-forASSignment',
          archived: true,
        },
        {
          title: 'Solar System in HTML & CSS',
          description: 'A solar system visualisation in pure HTML and CSS. Class assignment.',
          tags: ['HTML', 'CSS'],
          href: 'https://github.com/IPutuArcana/Solar-Systems-HTML-CSS',
          archived: true,
        },
        {
          title: 'Toko Tag Ayam',
          description: 'A PHP web application for a shop.',
          tags: ['PHP', 'Web'],
          href: 'https://github.com/IPutuArcana/toko-tag-ayam',
          archived: true,
        },
        {
          title: 'Computer Graphics',
          description: 'Everything I wrote over the course of my Computer Graphics class.',
          tags: ['C++', 'Graphics'],
          href: 'https://github.com/IPutuArcana/Computer-Graphics',
          archived: true,
        },
        {
          title: 'Automata',
          description: 'Code for my Theory of Computation class.',
          tags: ['C++', 'Automata'],
          href: 'https://github.com/IPutuArcana/Automata',
          archived: true,
        },
        {
          title: 'TechWEB',
          description: 'An HTML repository for my Web Technology class.',
          tags: ['HTML', 'Web'],
          href: 'https://github.com/IPutuArcana/TechWEB',
          archived: true,
        },
        {
          title: 'Coursework',
          description: 'A collection of university assignments in notebook form.',
          tags: ['Jupyter', 'University'],
          href: 'https://github.com/IPutuArcana/Coursework',
          archived: true,
        },
        {
          title: 'Third Person Controller',
          description: 'Notes from learning to build a third-person controller and drive the camera in Godot.',
          tags: ['Godot', 'GDScript'],
          href: 'https://github.com/IPutuArcana/Third-Person-Controller',
          archived: true,
        },
        {
          title: 'Model Selection — Classification',
          description: 'Comparing several classification models to find the one that fits the data best.',
          tags: ['Jupyter', 'Machine learning'],
          href: 'https://github.com/IPutuArcana/Model_Selection_Classification',
          archived: true,
        },
        {
          title: 'Model Selection — Regression',
          description: 'Finding the regression model that suits a given dataset best.',
          tags: ['Python', 'Machine learning'],
          href: 'https://github.com/IPutuArcana/Model_Selection_Regression',
          archived: true,
        },
        {
          title: 'My First Game',
          description: 'My first game, built by following a Brackeys tutorial through to the end.',
          tags: ['Game', 'Tutorial'],
          href: 'https://github.com/IPutuArcana/myFirstGame',
          archived: true,
        },
        {
          title: 'Sorting Algorithm Benchmark',
          description: 'A benchmark of several sorting algorithms, used as the appendix to a university paper.',
          tags: ['C++', 'Benchmark'],
          href: 'https://github.com/IPutuArcana/DAA_Benchmark_sortingAlgorithm',
          archived: true,
        },
        {
          title: 'Leetcode Together',
          description: 'LeetCode practice problems worked through together with friends.',
          tags: ['C++', 'Practice'],
          href: 'https://github.com/IPutuArcana/Leetcode-bareng',
          archived: true,
        },
        {
          title: 'Steganography',
          description: 'A steganography implementation written in C.',
          tags: ['C', 'Steganography'],
          href: 'https://github.com/IPutuArcana/Steganographi',
          archived: true,
        },
        {
          title: 'Practice Problems',
          description: 'A collection of programming practice problems in C++.',
          tags: ['C++', 'Practice'],
          href: 'https://github.com/IPutuArcana/LATIHAN-SOAL',
          archived: true,
        },
        {
          title: 'Practice',
          description: 'A C++ practice repository.',
          tags: ['C++', 'Practice'],
          href: 'https://github.com/IPutuArcana/Practice',
          archived: true,
        },
        {
          title: 'TRY-WEB',
          description: 'My earliest repository, created back in 2022 to learn how to code.',
          tags: ['HTML', 'Early'],
          href: 'https://github.com/IPutuArcana/TRY-WEB',
          archived: true,
        },
      ],
    },
    blog: {
      eyebrow: 'Blog',
      heading: 'Notes & thoughts',
      note: 'Working notes, not tutorials.',
      posts: [
        {
          slug: 'tanda-tangan-pejabat-jadi-judul-bab',
          title: 'A signature block that pretended to be a chapter heading',
          excerpt:
            'Re-testing how documents get cut with a sample eighty times larger, and finding two error types small samples never showed.',
          date: '2026-07-24',
          tag: 'Internship',
          body: [
            "The first week of this internship started with a task that sounded simple: the campus chatbot Shavira sometimes answered questions with nonsense, and I was asked to find out why. I spent day one on black-box testing, firing questions at Shavira one by one and logging the odd patterns in its answers.",
            "Four categories of noise came out of that and held up for the rest of the internship: garbage formatting and characters, mixed-up context, pure hallucination, and answers that were genuinely clean. But categories alone weren't enough, I needed to know exactly where document chunking was contributing to the problem.",
            'I built a "structural chunker", a program that splits documents into smaller pieces before indexing, using keyword heuristics tuned for Indonesian legal documents: BAB, Pasal, Menimbang. Tested against two sample documents, it looked good. I almost stopped there.',
            "Good thing I didn't. On day five I scaled the sample up to a hundred and sixty documents, eighty times larger than the first test, and the numbers changed completely. The old method cut mid-word at 66.6% of chunk boundaries. My new one dropped that to 16.3%, but that only became visible at scale, not in two documents.",
            "What mattered more than the numbers was what they uncovered. I found a broken table-of-contents document that made the system read a stray fragment as if it were a chapter title. I also found official signature blocks and footnotes on formal documents that the system was reading as chapter headings instead of the closing section they actually were.",
            "There was also a tuition-fee regulation document from a completely different university that got pulled in when I asked about Undiksha's own tuition fees. The answer stayed correct that time, but I knew that was luck, not a guarantee. Four different draft versions of the same guideline document turned up stored side by side too, purely a data-tidiness issue, nothing to do with how documents get cut.",
            "The biggest lesson this week wasn't really about chunking. Testing with a small sample can mislead you. Two bugs in the new chunking program only surfaced once I tested against a hundred and sixty documents, and they never would have shown up if I'd kept checking just two like before. Treating every failure as one single chunking problem would have been wrong.",
          ],
        },
        {
          slug: 'asumsi-yang-runtuh',
          title: 'The assumptions that collapsed on contact with the real API',
          excerpt:
            'I designed the Undiksha archive adapter on three assumptions. One read-only probe against the real API knocked two of them down — and turned up two findings no design had accounted for.',
          date: '2026-07-28',
          tag: 'Internship',
          body: [
            "Alongside the data-sanitisation work already in progress, I picked up an extra task from the weekly team meeting: build a bot that pulls data from Undiksha's archive system in response to what a user asks. There was no API documentation yet at that point, so I wrote down three working assumptions explicitly and started building on top of them instead of waiting.",
            "The design principle: a canonical data schema in the middle, one narrow adapter layer on the edge that's the only thing touching the real API's shape. If an assumption turned out wrong, only that adapter layer would need to change, not the sanitisation and chunking pipeline that was already tested and working.",
            "Today the API documentation finally arrived, and before writing a single line of adapter code, I ran a read-only probe against the real API to test those three assumptions against evidence, not guesswork.",
            "Two of them collapsed immediately. I'd assumed there would be a listing endpoint with a time-based cursor for pulling only recently updated records. Turned out the API can only be filtered by year and active status, no cursor at all. I'd also assumed the document category field from the API couldn't be trusted. It turned out the opposite: that field was far more reliable than the fallback plan I'd built for it.",
            "More interesting, the probe surfaced two findings that no design had accounted for at all. First, the API doesn't return document text whatsoever, only metadata and a link to a PDF file. Since the documents are scans, that meant I needed an OCR stage I hadn't planned for in any way.",
            'Second, every document carries a confidentiality classification. That\'s a signal the archive system stores documents that aren\'t meant for public consumption, so I built in a "fail-closed" filter: only documents classified "Public" may be indexed and answered by Shavira, until there\'s explicit confirmation otherwise.',
            "Today's lesson: writing assumptions down explicitly before there's certainty isn't wasted effort, it's what lets you evaluate being wrong honestly once evidence shows up, and it keeps the fix contained to one small layer instead of tearing everything down.",
          ],
        },
        {
          slug: 'kalimat-yang-tertulis-bukan-yang-terdengar',
          title: 'The sentence written in the code, not the one you hear',
          excerpt:
            'Looking for why one wave pose refused to show up at the start of a greeting, I found the text driving the mouth movement never matched the audio actually playing.',
          date: '2026-08-05',
          tag: 'Process',
          body: [
            "Since early August I'd shut Shavira's arms down completely, because both forearms kept intersecting whenever the torso rotated along with them. This week I brought them back, but differently: the torso stays locked still, and only the arms move, through a set of poses I authored myself while watching the results live on screen, not by guessing.",
            "Two poses became mine that day: a wave and an explaining gesture. I deliberately made the arm motion overshoot slightly past its end point before settling, so it wouldn't read as mechanically stiff. I also restricted the wave so it only fires when the spoken sentence actually contains a greeting, instead of appearing on any sentence like before.",
            "Alongside that I wired up a way to interrupt Shavira mid-sentence, both from an on-screen button and the Escape key. Turning off the audio alone wasn't enough, though. The next sentence already queued behind it would start speaking on its own a few seconds later, so I gave every turn of speech its own sequence number, so any process still running would know its turn had already been cancelled.",
            "The most memorable part came out of chasing down why the wave pose never appeared at the start of the opening greeting. I traced it step by step and found something bigger than I expected: the greeting sentence written into the program didn't actually match the sentence spoken in the audio recording.",
            'That mattered because the same text was also driving the timing of the mouth movement. Which meant Shavira\'s mouth had never actually been in sync with her voice during the opening greeting, from the very start, and I only found out why this week. For now I patched it by hard-coding the gesture at the point the greeting plays, the real fix is waiting on me writing down what each audio file actually says.',
            "The second formal mentoring session also happened this week, and that afternoon I followed up by fixing chat links that had gone invisible to users, and adding more variation to the hand gestures so Shavira wouldn't look like she was repeating the exact same motion every time she explained something.",
            "This week's lesson: the same surface symptom can come from a source completely different from your first guess. I assumed the problem lived in the pose logic. It turned out to live somewhere I hadn't even suspected, in the text that controls timing, not in the motion itself.",
          ],
        },
        {
          slug: 'wajah-yang-benar-benar-bicara',
          title: 'Giving Shavira a face that really speaks',
          excerpt:
            'Why the 3D avatar deliberately has no backend of its own, and what changes once lip-sync has to line up with a sentence that was generated moments ago.',
          date: '2026-08-10',
          tag: 'Notes',
          body: [
            "Today I sat down and wrote the full architecture documentation for this avatar visualisation system, start to finish, both as a personal reference and as material for the eventual exam. Writing it in order forced me to see something I'd only ever known in scattered pieces: this project deliberately has no backend of its own, at all.",
            "All the retrieval, the language model, and the text-to-speech stay on another team's services. What I build is only the visual and audio side, a pure client that receives text and an audio file and renders that into someone talking. Not one server route, no database, every output is a static file.",
            "There are two paths an answer can arrive by, and the app picks between them on its own: a per-sentence streaming path, and a deploy path that sends one whole answer at once. If streaming fails, the app falls back automatically to the deploy path and still answers, just not sentence by sentence.",
            'What shifted once I wrote all of this out explicitly: lip-sync has to line up with audio that another service just finished generating, not a file that\'s been sitting there ready for a while. Which means the lip-sync system can\'t assume the audio is already "settled and stable", it has to keep working even when the audio has only just arrived.',
            "Eight pieces of feedback from leadership also came in today through my field supervisor, and I sorted through them one by one. Four became my own responsibility, two sit with the teammate handling the server, one was already done, and one still needs its intent confirmed with whoever raised it.",
            "One I took on myself: Shavira's jacket and hair colour. It turned out the jacket and the shirt share the exact same texture material, so I measured the split directly from the texture image's brightness levels instead of guessing at it. I also made the background transparent, so the avatar could be dropped onto other sites as just the figure itself.",
            "One other small feature I built today: acknowledging the topic of a question before the real answer arrives, to mask the wait. I paired it with a profanity filter, tested against thirty cases including attempts to disguise words with digits and inserted spaces, all thirty passed without a single legitimate sentence getting rejected.",
          ],
        },
        {
          slug: 'jari-mengepal-ke-telapak',
          title: 'Fingers curl into the palm, not over the knuckles',
          excerpt:
            "Hours went into fixing the hand rig of the 3D character on this page. A note on how far a detail that small decides whether a pose reads as alive or as wrong.",
          date: '2026-08-16',
          tag: 'Process',
          body: [
            "Shavira's arm pose library has been running for a few weeks now, but there was one detail I kept missing: the closed fist. From a distance it looked fine, the moment the camera got close, that fist felt wrong, like a hand bending the wrong way.",
            "Every finger joint has its own rotation axis, and that axis isn't the same across fingers, let alone across joints within the same finger. The rule I've held onto since the start of this project: a bone's axis direction never gets guessed, it always gets measured first, because a wrong guess fails silently, the animation still plays, it just bends the wrong way.",
            "The bug I fixed today was simple to explain but slow to find: a finger that was supposed to curl into the palm was instead curling backward, over the knuckle, because the rotation sign was flipped on just one joint.",
            "That one wrongly-signed joint was enough to make the entire fist read as off, even though nine other joints on the same hand were correct. It wasn't about the count of mistakes, it was about how sensitive the eye is to one small part being out of sync with everything around it.",
            "After fixing it, I compared two screen recordings side by side, before and after. On paper the difference was tiny, one rotation value on one bone, but on screen the difference was unmistakable: one read as an actual closed fist, the other read as a hand being forced to bend.",
            "Today's lesson wasn't really about fingers specifically. The closer a motion gets to the human body, the smaller its margin for error. A detail that looks trivial on the surface, one rotation axis on one finger joint, turned out to be exactly what separates a pose that feels alive from one that feels wrong.",
          ],
        },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      heading: "Let's connect",
      body: "Open to collaboration, a chat, or just saying hi.",
      email: 'aarrcane@gmail.com',
    },
    footer: {
      backToTop: 'Back to top',
      rights: 'All rights reserved.',
    },
    themeToggle: {
      toLight: 'Light mode',
      toDark: 'Dark mode',
    },
    langToggle: {
      label: 'ID',
    },
  },
};

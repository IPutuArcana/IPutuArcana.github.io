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
  title: string;
  excerpt: string;
  date: string;
  tag: string;
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
          title: 'Asumsi yang runtuh begitu ketemu API aslinya',
          excerpt:
            'Saya merancang adapter arsip Undiksha di atas tiga asumsi. Satu probe read-only ke API asli menjatuhkan dua di antaranya — dan memunculkan dua temuan yang tidak ada di desain manapun.',
          date: '2026-07-28',
          tag: 'Magang',
        },
        {
          title: 'Memberi Shavira wajah yang benar-benar bicara',
          excerpt:
            'Kenapa avatar 3D-nya sengaja tidak punya backend sendiri, dan apa yang berubah ketika lip-sync harus nyambung dengan kalimat yang baru saja selesai dihasilkan.',
          date: '2026-08-10',
          tag: 'Catatan',
        },
        {
          title: 'Jari mengepal ke telapak, bukan ke buku jari',
          excerpt:
            'Berjam-jam habis buat membenahi rig tangan karakter 3D di halaman ini. Catatan soal seberapa jauh detail sekecil itu menentukan sebuah pose terasa hidup atau janggal.',
          date: '2026-08-16',
          tag: 'Proses',
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
          title: 'The assumptions that collapsed on contact with the real API',
          excerpt:
            'I designed the Undiksha archive adapter on three assumptions. One read-only probe against the real API knocked two of them down — and turned up two findings no design had accounted for.',
          date: '2026-07-28',
          tag: 'Internship',
        },
        {
          title: 'Giving Shavira a face that really speaks',
          excerpt:
            'Why the 3D avatar deliberately has no backend of its own, and what changes once lip-sync has to line up with a sentence that was generated moments ago.',
          date: '2026-08-10',
          tag: 'Notes',
        },
        {
          title: 'Fingers curl into the palm, not over the knuckles',
          excerpt:
            "Hours went into fixing the hand rig of the 3D character on this page. A note on how far a detail that small decides whether a pose reads as alive or as wrong.",
          date: '2026-08-16',
          tag: 'Process',
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

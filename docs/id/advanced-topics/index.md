# Topik Lanjutan {#advanced-topics}

Setelah terbiasa dengan NixOS, kamu bisa menjelajahi topik lanjutan dan mendalami
ekosistem Nix. Berikut beberapa sumber dan proyek komunitas yang bisa membantu memperluas
pengetahuan:

## Komunitas {#community}

- [Nix Official - Community](https://nixos.org/community/): Memuat informasi komunitas
  Nix, forum, obrolan langsung, pertemuan, RFC, struktur tim resmi, dan sebagainya.
- [Nix Channel Status](https://status.nixos.org/): Status build setiap channel Nix.
- [nix-community/NUR](https://github.com/nix-community/NUR): Meski Nixpkgs memuat banyak
  paket, beberapa tidak disertakan karena alasan seperti kecepatan peninjauan dan
  perjanjian lisensi. NUR adalah repositori paket Nix terdesentralisasi. Siapa pun bisa
  membuat repositori Nix sendiri dan menambahkannya ke NUR untuk dipakai orang lain. Jika
  menginginkan paket yang tidak ada dalam Nixpkgs, coba cari di sini. Jika ingin berbagi
  paket Nix sendiri, kamu bisa membuat dan membagikan repositori Nix sesuai README NUR.

## Dokumentasi dan Video {#documentation-and-videos}

- [Eelco Dolstra - The Purely Functional Software Deployment Model - 2006](https://edolstra.github.io/pubs/phd-thesis.pdf):
  Disertasi doktoral penting Eelco Dolstra tentang pengelola paket Nix,
- [Nix Reference Manual](https://nixos.org/manual/nix/stable/package-management/profiles.html):
  Panduan menyeluruh pengelola paket Nix, mencakup rancangan dan penggunaan dari baris
  perintah.
- [nixpkgs Manual](https://nixos.org/manual/nixpkgs/unstable/): Manual nixpkgs yang
  memperkenalkan parameternya serta menjelaskan cara memakai, mengubah, dan mengemas paket
  Nix.
- [NixOS Manual](https://nixos.org/manual/nixos/unstable/): Manual pengguna NixOS, dengan
  petunjuk konfigurasi komponen tingkat sistem seperti Wayland/X11 dan GPU.
- [nix-pills](https://nixos.org/guides/nix-pills/): "Nix Pills" adalah rangkaian panduan
  yang menjelaskan pembuatan paket perangkat lunak dengan Nix secara mendalam.
  Penjelasannya jelas dan mudah dipahami.
- [nixos-in-production](https://github.com/Gabriella439/nixos-in-production): Buku yang
  masih dikerjakan, diterbitkan di LeanPub, tentang memperkenalkan dan memelihara NixOS
  dalam lingkungan produksi.

Ada juga banyak video resmi di kanal YouTube
[NixOS Foundation](https://www.youtube.com/@NixOS-Foundation) dan
[NixCon](https://www.youtube.com/@NixCon). Berikut beberapa video yang sangat disarankan:

- [Summer of Nix 2022 — Public Lecture Series](https://www.youtube.com/playlist?list=PLt4-_lkyRrOMWyp5G-m_d1wtTcbBaOxZk):
  Rangkaian kuliah umum yang diselenggarakan NixOS Foundation, disampaikan oleh anggota
  inti komunitas Nix seperti Eelco Dolstra dan Armijn Hemel. Materinya mencakup sejarah
  pengembangan Nix, sejarah NixOS, masa depan Nix, dan topik lainnya.
- [Summer of Nix 2023 — Nix Developer Dialogues](https://www.youtube.com/playlist?list=PLt4-_lkyRrOPcBuz_tjm6ZQb-6rJjU3cf):
  Rangkaian dialog antar-anggota inti komunitas Nix pada 2023. Materinya mencakup evolusi
  dan tantangan arsitektur Nixpkgs, penjelajahan sistem modul Nix, pembahasan ekosistem
  Nix, penerapan AI dalam Nixpkgs, serta penerapan Nix dalam dunia komersial dan ekonomi
  sumber terbuka.

## Teknik Lanjutan dan Proyek Komunitas {#advanced-techniques-and-community-projects}

Setelah nyaman memakai Flakes, kamu bisa menjelajahi teknik yang lebih canggih dan proyek
komunitas. Berikut beberapa yang populer untuk dicoba:

- [flake-parts](https://github.com/hercules-ci/flake-parts): Menyederhanakan penulisan dan
  pemeliharaan konfigurasi dengan sistem modul Module.
- [flake-utils-plus](https://github.com/gytis-ivaskevicius/flake-utils-plus): Paket pihak
  ketiga yang meningkatkan konfigurasi Flake dan menyediakan fitur tambahan yang andal.

Masih banyak proyek komunitas berharga lainnya yang layak dijelajahi. Berikut beberapa
contohnya:

- [nix-output-monitor](https://github.com/maralorn/nix-output-monitor): Menampilkan
  kemajuan build paket Nix dengan menarik, disertai informasi tambahan seperti waktu dan
  log build.
- [agenix](https://github.com/ryantm/agenix): Alat pengelolaan rahasia.
- [colmena](https://github.com/nix-community/colmena): Alat deployment NixOS.
- [lanzaboote](https://github.com/nix-community/lanzaboote): Mengaktifkan secure boot
  untuk NixOS.
- [impermanence](https://github.com/nix-community/impermanence): Membantu membuat NixOS
  tanpa keadaan tersimpan dan meningkatkan reproduksibilitas sistem.
- [devbox](https://github.com/jetify-com/devbox): Lingkungan pengembangan ringan yang bisa
  dibuat ulang tanpa kerepotan kontainer, dengan Nix di baliknya.
- [nixpak](https://github.com/nixpak/nixpak): Alat untuk menjalankan berbagai aplikasi
  yang dikemas dengan Nix dalam sandbox, termasuk aplikasi grafis.
- [nixpacks](https://github.com/railwayapp/nixpacks): Nixpacks menerima direktori sumber
  dan menghasilkan image yang sesuai OCI, yang bisa diterapkan di mana saja, serupa dengan
  buildpacks.
- ...

Proyek-proyek ini menawarkan fungsi dan alat tambahan yang bisa meningkatkan pengalaman
memakai NixOS.

Untuk informasi lebih lanjut, lihat
[awesome-nix](https://github.com/nix-community/awesome-nix).

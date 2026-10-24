# Pengantar Flakes {#introduction-to-flakes}

Fitur eksperimental flakes merupakan perkembangan besar bagi Nix. Fitur ini memperkenalkan
kebijakan pengelolaan dependensi antar-ekspresi Nix, serta meningkatkan reproduksibilitas,
kemampuan komposisi, dan kemudahan penggunaan dalam ekosistem Nix. Meski masih merupakan
fitur eksperimental, flakes sudah banyak dipakai oleh komunitas Nix.[^1]

Flakes merupakan salah satu perubahan terbesar yang pernah terjadi dalam proyek nix.[^2]

Sederhananya, jika pernah memakai JavaScript/Go/Rust/Python, kamu semestinya sudah
mengenal berkas seperti `package.json`/`go.mod`/`Cargo.toml`/`pyproject.toml`. Dalam
bahasa-bahasa pemrograman ini, berkas tersebut dipakai untuk menggambarkan dependensi
antar-paket perangkat lunak dan cara membangun proyek.

Demikian pula, pengelola paket bahasa-bahasa ini memakai berkas seperti
`package-lock.json`/`go.sum`/`Cargo.lock`/`poetry.lock` untuk mengunci versi dependensi,
sehingga memastikan reproduksibilitas proyek.

Flakes meminjam gagasan dari pengelola paket ini untuk meningkatkan reproduksibilitas,
kemampuan komposisi, dan kemudahan penggunaan ekosistem Nix.

Flakes memperkenalkan `flake.nix`, serupa dengan `package.json`, untuk menggambarkan
dependensi antar-paket Nix dan cara membangun proyek. Selain itu, tersedia `flake.lock`,
seperti `package-lock.json`, untuk mengunci versi dependensi demi memastikan
reproduksibilitas proyek.

Di sisi lain, fitur eksperimental Flakes tidak merusak rancangan asli Nix pada tingkat
pengguna. Dua berkas baru yang diperkenalkan Flakes, `flake.nix`/`flake.lock`, hanyalah
pembungkus bagi konfigurasi Nix lainnya. Pada bab-bab berikutnya, kita akan melihat bahwa
fitur Flakes memberikan cara baru yang lebih praktis untuk mengelola dependensi
antar-ekspresi Nix berdasarkan rancangan asli Nix.

## Peringatan tentang Flakes <Badge type="danger" text="perhatian" /> {#a-word-of-caution-about-flakes}

Manfaat Flakes terlihat jelas, dan seluruh komunitas NixOS menyambutnya dengan antusias.
Saat ini, lebih dari separuh pengguna memakai Flakes[^3], sehingga memberi keyakinan bahwa
Flakes tidak akan ditinggalkan.

:warning: Namun, perlu diingat bahwa **Flakes masih merupakan fitur eksperimental**.
Beberapa masalah masih ada, dan perubahan yang merusak kompatibilitas mungkin terjadi
selama proses stabilisasi. Seberapa besar perubahan tersebut masih belum pasti.

Secara keseluruhan, saya sangat menyarankan semua orang memakai Flakes, apalagi buku ini
membahas NixOS dan Flakes. Namun, kamu perlu bersiap menghadapi kemungkinan masalah akibat
perubahan yang merusak kompatibilitas di kemudian hari.

## Kapan Flakes Akan Stabil? {#when-will-flakes-be-stabilized}

Saya menelusuri beberapa hal terkait Flakes:

- [[RFC 0136] A Plan to Stabilize Flakes and the New CLI Incrementally](https://github.com/NixOS/rfcs/pull/136):
  Rencana untuk menstabilkan Flakes dan CLI baru secara bertahap, sudah digabungkan.
- [CLI stabilization effort](https://github.com/NixOS/nix/issues/7701): Issue yang melacak
  kemajuan upaya stabilisasi CLI baru.
- [Why Are Flakes Still Experimental? - NixOS Discourse](https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317):
  Kiriman yang membahas alasan Flakes masih dianggap eksperimental.
- [Flakes Are Such an Obviously Good Thing - Graham Christensen](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/):
  Artikel yang menekankan keunggulan Flakes sekaligus menyarankan perbaikan pada rancangan
  dan proses pengembangannya.
- [ teaching Nix 3 CLI and Flakes #281 - nix.dev](https://github.com/NixOS/nix.dev/issues/281):
  Issue tentang "Mengajarkan CLI Nix 3 dan Flakes" di nix.dev. Kesimpulannya, kita
  sebaiknya tidak mempromosikan fitur yang belum stabil di nix.dev.

Setelah membaca sumber-sumber ini, tampaknya Flakes mungkin akan (atau mungkin juga
belum...) stabil dalam dua tahun, mungkin disertai beberapa perubahan yang merusak
kompatibilitas.

## CLI Baru dan CLI Klasik {#the-new-cli-and-the-classic-cli}

Nix memperkenalkan dua fitur eksperimental, `nix-command` dan `flakes`, pada tahun 2020.
Fitur ini menghadirkan antarmuka baris perintah baru (disebut CLI Baru), definisi struktur
paket Nix yang baku (dikenal sebagai fitur Flakes), dan fitur seperti `flake.lock`, serupa
dengan berkas pengunci versi pada cargo/npm. Meski masih eksperimental per 1 Februari
2024, fitur-fitur ini banyak diadopsi komunitas Nix karena sangat meningkatkan kemampuan
Nix.

CLI Baru Nix saat ini (fitur eksperimental `nix-command`) sangat terkait dengan fitur
Flakes. Meski pemisahan keduanya secara tegas sedang diupayakan, penggunaan Flakes pada
dasarnya memerlukan CLI Baru. Sebagai panduan pemula NixOS dan Flakes, buku ini perlu
memperkenalkan perbedaan CLI Baru, yang menjadi tumpuan Flakes, dengan CLI lama.

Berikut daftar CLI Nix lama dan konsep terkait yang tidak lagi diperlukan saat memakai CLI
Baru dan Flakes (`nix-command` dan `flakes`). Saat mencari informasi, kamu bisa
menggantinya dengan perintah CLI Baru yang bersesuaian (kecuali `nix-collect-garbage`,
karena saat ini belum ada penggantinya):

1. `nix-channel`: `nix-channel` mengelola versi input seperti nixpkgs melalui channel
   stable/unstable, serupa dengan daftar paket pada alat pengelolaan paket lain seperti
   apt/yum/pacman. Secara tradisional, inilah yang menyediakan `<nixpkgs>` dalam bahasa
   Nix.
   1. Dalam Flakes, fungsi `nix-channel` digantikan oleh Flake Registry (`nix registry`)
      untuk menyediakan "suatu versi global nixpkgs yang tidak ditentukan" bagi penggunaan
      CLI interaktif (misalnya `nix run nixpkgs#hello`). Saat memakai `flake.nix`, versi
      input dikelola dalam flake itu sendiri.
   2. Flakes memakai bagian `inputs` dalam `flake.nix` untuk mengelola versi nixpkgs dan
      input lain pada setiap Flake, alih-alih memakai keadaan global.
2. `nix-env`: `nix-env` adalah alat baris perintah inti Nix klasik untuk mengelola paket
   perangkat lunak dalam lingkungan pengguna.
   1. Alat ini memasang paket dari sumber data yang ditambahkan melalui `nix-channel`,
      sehingga versi paket yang dipasang dipengaruhi oleh channel. Paket yang dipasang
      dengan `nix-env` tidak otomatis dicatat dalam konfigurasi deklaratif Nix dan berada
      sepenuhnya di luar kendalinya. Akibatnya, paket-paket ini sulit direproduksi pada
      mesin lain. Memperbarui paket yang dipasang melalui `nix-env` lambat dan bisa
      memberikan hasil tak terduga, karena nama atribut tempat paket ditemukan dalam
      nixpkgs tidak disimpan.

      Karena itu, penggunaan perintah ini secara langsung tidak disarankan.

   2. Perintah yang bersesuaian dalam CLI Baru adalah `nix profile`. Secara pribadi, saya
      tidak menyarankannya untuk pemula.

3. `nix-shell`: `nix-shell` membuat lingkungan shell sementara, yang berguna untuk
   pengembangan dan pengujian.
   1. CLI Baru: Alat ini dibagi menjadi tiga subperintah: `nix develop`, `nix shell`, dan
      `nix run`. Kita akan membahas ketiganya secara terperinci dalam bab
      "[Pengembangan](../development/intro.md)".
4. `nix-build`: `nix-build` membangun paket Nix dan menempatkan hasil build di
   `/nix/store`, tetapi tidak mencatatnya dalam konfigurasi deklaratif Nix.
   1. CLI Baru: `nix-build` digantikan oleh `nix build`.
5. `nix-collect-garbage`: Perintah pengumpulan sampah untuk membersihkan Store Object yang
   tidak dipakai di `/nix/store`.
   1. Ada perintah serupa dalam CLI Baru, `nix store gc --debug`, tetapi perintah ini
      tidak membersihkan generasi profil. Jadi, saat ini belum ada pengganti untuk
      perintah tersebut.
6. Perintah lain yang lebih jarang digunakan tidak dicantumkan di sini.
   1. Kamu bisa merujuk daftar perbandingan perintah yang terperinci dalam
      [Try to explain nix commands](https://qiita.com/Sumi-Sumi/items/6de9ee7aab10bc0dbead?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en).

[^1]: [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes)

[^2]:
    [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)

[^3]:
    [Draft: 1 year roadmap - NixOS Foundation](https://web.archive.org/web/20250317120825/https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)

![](/nixos-and-flakes-book.webp)

# Pengantar Nix & NixOS {#introduction-to-nix-nixos}

Nix adalah pengelola paket deklaratif. Pengguna menyatakan keadaan sistem yang diinginkan
dalam berkas konfigurasi (konfigurasi deklaratif), lalu Nix bertanggung jawab mewujudkan
keadaan tersebut.

> Sederhananya, "konfigurasi deklaratif" berarti pengguna cukup menyatakan hasil yang
> diinginkan. Misalnya, jika kamu menyatakan ingin mengganti pengelola jendela i3 dengan
> sway, Nix akan membantu mewujudkannya. Kamu tidak perlu memikirkan detail di baliknya:
> paket apa yang diperlukan untuk memasang sway, paket terkait i3 mana yang perlu dihapus,
> atau penyesuaian konfigurasi sistem dan variabel lingkungan untuk sway. Begitu pula
> parameter Sway mana yang perlu diubah agar berjalan pada GPU Nvidia. Nix otomatis
> menangani semua detail ini untuk pengguna (asalkan paket Nix terkait sway dan i3
> dirancang dengan baik).

NixOS, distribusi Linux yang dibangun di atas pengelola paket Nix, bisa disebut "OS
sebagai Kode". NixOS memakai berkas konfigurasi Nix deklaratif untuk menggambarkan seluruh
keadaan sistem operasi.

Sistem operasi terdiri dari berbagai paket perangkat lunak, berkas konfigurasi, serta data
teks/biner. Semuanya mewakili keadaan sistem saat ini. Konfigurasi deklaratif hanya bisa
mengelola bagian statis dari keadaan tersebut. Data dinamis, seperti data PostgreSQL,
MySQL, atau MongoDB, tidak bisa dikelola secara efektif melalui konfigurasi deklaratif.
(Tidak masuk akal menghapus semua data PostgreSQL baru yang tidak dinyatakan dalam
konfigurasi setiap kali melakukan deployment.) Karena itu, **NixOS terutama berfokus pada
pengelolaan bagian statis keadaan sistem secara deklaratif**. Data dinamis, beserta isi
direktori home pengguna, tidak terpengaruh saat NixOS dikembalikan ke generasi sebelumnya.

Meski reproduksibilitas sistem secara menyeluruh belum bisa dicapai, direktori `/home`
merupakan direktori penting pengguna yang menyimpan banyak berkas konfigurasi yang
diperlukan—[Dotfiles](https://wiki.archlinux.org/title/Dotfiles). Proyek komunitas besar
bernama [home-manager](https://github.com/nix-community/home-manager) dirancang untuk
mengelola paket dan berkas konfigurasi tingkat pengguna di dalam direktori home.

Berkat sifatnya yang deklaratif dan dapat direproduksi, Nix tidak terbatas pada
pengelolaan lingkungan desktop. Nix juga banyak dipakai untuk mengelola lingkungan
pengembangan, lingkungan kompilasi, mesin virtual cloud, dan pembuatan image kontainer.
[colmena](https://github.com/nix-community/colmena) dan
[deploy-rs](https://github.com/serokell/deploy-rs) (proyek komunitas) sama-sama merupakan
alat operasional berbasis Nix.

## Mengapa NixOS? {#why-nixos}

Saya pertama kali mengenal pengelola paket Nix beberapa tahun lalu. Nix memakai bahasa Nix
untuk menggambarkan konfigurasi sistem. NixOS, distribusi Linux yang dibangun di atasnya,
memungkinkan sistem dikembalikan ke keadaan sebelumnya mana pun. (Namun, hanya keadaan
yang dinyatakan dalam berkas konfigurasi Nix yang bisa dikembalikan.) Kedengarannya memang
hebat, tetapi mempelajari bahasa baru dan menulis kode untuk memasang paket terasa
merepotkan. Jadi, saat itu saya tidak melanjutkannya.

Namun, belakangan saya menemui banyak masalah lingkungan saat memakai EndeavourOS.
Mengatasinya menghabiskan banyak tenaga dan membuat saya kelelahan. Setelah dipikirkan
baik-baik, saya menyadari ketiadaan kontrol versi dan mekanisme rollback di EndeavourOS
membuat saya tidak bisa memulihkan sistem saat masalah muncul.

Saat itulah saya memutuskan beralih ke NixOS.

Saya senang sekali karena NixOS melampaui harapan saya. Yang paling menakjubkan, kini saya
bisa memulihkan seluruh lingkungan i3 dan semua paket yang biasa saya gunakan pada host
NixOS baru. Cukup dengan satu perintah `sudo nixos-rebuild switch --flake .`. Luar biasa!

Kemampuan rollback dan reproduksibilitas NixOS membuat saya jauh lebih percaya diri—saya
tidak lagi takut merusak sistem. Saya bahkan mulai mencoba hal-hal baru di NixOS, seperti
kompositor hyprland. Dulu, di EndeavourOS, saya tidak akan berani mengutak-atik kompositor
baru semacam itu. Jika sistem bermasalah, saya harus bersusah payah menanganinya secara
manual dengan berbagai solusi sementara.

Semakin dalam saya menggunakan NixOS dan Nix, semakin terasa bahwa keduanya juga cocok
untuk mengelola konfigurasi beberapa host secara serempak. Saat ini,
[nix-config](https://github.com/ryan4yin/nix-config) pribadi saya mengelola konfigurasi
banyak host secara serempak:

- Komputer desktop
  - 1 Macbook Pro 2022 (M2 aarch64).
  - 1 Macbook Pro 2024 (M4Pro aarch64).
  - 1 PC desktop NixOS (amd64).
- Server
  - 10+ mesin virtual NixOS (amd64).
  - Beberapa papan pengembangan untuk aarch64 dan riscv64.

Lingkungan pengembangan ketiga komputer desktop dikelola oleh Home Manager. Konfigurasi
utamanya dipakai bersama sepenuhnya, dan perubahan konfigurasi pada host mana pun bisa
disinkronkan dengan lancar ke host lain melalui Git.

Nix hampir sepenuhnya menyembunyikan perbedaan OS dan arsitektur CPU di antara ketiga
mesin itu dari saya. Pengalamannya sangat mulus!

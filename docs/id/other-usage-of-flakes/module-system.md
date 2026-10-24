# Sistem Modul dan Opsi Kustom {#module-system-and-custom-options}

Dalam konfigurasi NixOS sebelumnya, kita menetapkan berbagai nilai `options` untuk
mengonfigurasi NixOS atau Home Manager. `options` ini sebenarnya didefinisikan di dua
lokasi:

- NixOS:
  [nixpkgs/nixos/modules](https://github.com/NixOS/nixpkgs/tree/nixos-26.05/nixos/modules),
  tempat semua opsi NixOS yang terlihat di <https://search.nixos.org/options>
  didefinisikan.
- Home Manager:
  [home-manager/modules](https://github.com/nix-community/home-manager/blob/release-26.05/modules),
  dengan semua opsinya tersedia di
  <https://nix-community.github.io/home-manager/options.xhtml>.

> Jika kamu juga memakai nix-darwin, konfigurasinya serupa. Sistem modulnya
> diimplementasikan dalam
> [nix-darwin/modules](https://github.com/nix-darwin/nix-darwin/tree/master/modules).

Fondasi Modul NixOS dan Modul Home Manager di atas adalah sistem modul universal yang
diimplementasikan dalam Nixpkgs, di [lib/modules.nix][lib/modules.nix]. Berikut
dokumentasi resmi sistem modul ini (bahkan bagi pengguna NixOS berpengalaman, memahaminya
bisa menjadi tugas yang menantang):

- [Module System - Nixpkgs]

Karena dokumentasi sistem modul Nixpkgs kurang memadai, dokumentasi tersebut langsung
menyarankan panduan penulisan lain yang khusus membahas sistem modul NixOS. Panduan ini
lebih jelas, tetapi mungkin tetap sulit bagi pendatang baru:

- [Writing NixOS Modules - Nixpkgs]

Singkatnya, sistem modul diimplementasikan oleh Nixpkgs dan bukan bagian dari pengelola
paket Nix. Karena itu, dokumentasinya tidak disertakan dalam dokumentasi pengelola paket
Nix. Selain itu, NixOS maupun Home Manager sama-sama berbasis implementasi sistem modul
Nixpkgs.

## Apa Tujuan Sistem Modul? {#what-is-the-purpose-of-the-module-system}

Sebagai pengguna biasa, memakai berbagai opsi yang disediakan NixOS dan Home Manager
berdasarkan sistem modul sudah cukup untuk memenuhi sebagian besar kebutuhan kita. Lalu,
apa manfaat mempelajari sistem modul lebih dalam bagi kita?

Pada pembahasan konfigurasi modular sebelumnya, gagasan utamanya adalah memecah
konfigurasi menjadi beberapa modul, lalu mengimpornya dengan `imports = [ ... ];`. Ini
penggunaan sistem modul yang paling dasar. Namun, hanya memakai `imports = [ ... ];`
membuat kita sekadar mengimpor konfigurasi modul apa adanya, tanpa penyesuaian, sehingga
keleluasaannya terbatas. Cara ini cukup untuk konfigurasi sederhana, tetapi tidak memadai
jika konfigurasinya lebih rumit.

Sebagai gambaran kekurangannya, mari lihat contoh. Misalkan saya mengelola empat host
NixOS: A, B, C, dan D. Saya ingin mencapai tujuan berikut sambil meminimalkan pengulangan
konfigurasi:

- Semua host (A, B, C, dan D) perlu mengaktifkan layanan Docker dan menjalankannya saat
  boot.
- Host A perlu mengubah driver penyimpanan Docker menjadi `btrfs`, sementara pengaturan
  lainnya tetap sama.
- Host B, yang berada di Tiongkok, perlu mengatur mirror dalam negeri pada konfigurasi
  Docker.
- Host C, yang berada di Amerika Serikat, tidak punya kebutuhan khusus.
- Host D, sebuah mesin desktop, perlu mengatur proxy HTTP untuk mempercepat unduhan
  Docker.

Jika hanya memakai `imports`, kita mungkin harus memecah konfigurasi menjadi beberapa
modul seperti ini, lalu mengimpor modul berbeda untuk setiap host:

```bash
› tree
.
├── docker-default.nix  # Basic Docker configuration, including starting at boot
├── docker-btrfs.nix    # Imports docker-default.nix and changes the storage driver to btrfs
├── docker-china.nix    # Imports docker-default.nix and sets a domestic mirror
└── docker-proxy.nix    # Imports docker-default.nix and sets an HTTP proxy
```

Bukankah konfigurasi ini terasa berulang? Ini masih contoh sederhana. Jika mesinnya lebih
banyak dengan perbedaan konfigurasi yang lebih besar, pengulangannya akan semakin jelas.

Jelas, kita perlu cara lain untuk mengatasi masalah konfigurasi berulang ini. Membuat
`options` kustom sendiri merupakan pilihan yang sangat baik.

Sebelum mempelajari sistem modul lebih dalam, saya tekankan lagi bahwa materi berikut
tidak wajib dipelajari dan dipakai. Banyak pengguna NixOS tidak membuat `options` kustom
sama sekali dan sudah puas memakai `imports` untuk memenuhi kebutuhan. Jika masih pemula,
pertimbangkan mempelajari bagian ini saat menemui masalah yang tidak bisa diatasi dengan
`imports`. Itu sama sekali tidak masalah.

## Struktur dan Penggunaan Dasar {#basic-structure-and-usage}

Struktur dasar modul yang didefinisikan dalam Nixpkgs adalah sebagai berikut:

```nix
{ config, pkgs, ... }:

{
  imports =
    [ # import other modules here
    ];

  options = {
    # ...
  };

  config = {
    # ...
  };
}
```

Di antaranya, kita sudah mengenal `imports = [ ... ];`, tetapi dua bagian lainnya belum
dijelajahi. Berikut pengantar singkatnya:

- `options = { ... };`: Serupa dengan deklarasi variabel dalam bahasa pemrograman, dipakai
  untuk mendeklarasikan opsi yang bisa dikonfigurasi.
- `config = { ... };`: Serupa dengan pemberian nilai variabel dalam bahasa pemrograman,
  dipakai untuk menetapkan nilai opsi yang dideklarasikan dalam `options`.

Penggunaan yang paling umum: dalam modul Nixpkgs yang sama, tetapkan nilai `options` lain
pada `config = { .. };` berdasarkan nilai saat ini yang dideklarasikan dalam
`options = { ... };`. Dengan begitu, konfigurasi bisa diatur melalui parameter.

Contoh langsung akan lebih mudah dipahami:

```nix
# ./foo.nix
{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.programs.foo;
in {
  options.programs.foo = {
    enable = mkEnableOption "the foo program";

    package = mkOption {
      type = types.package;
      default = pkgs.hello;
      defaultText = literalExpression "pkgs.hello";
      description = "foo package to use.";
    };

    extraConfig = mkOption {
      default = "";
      example = ''
        foo bar
      '';
      type = types.lines;
      description = ''
        Extra settings for foo.
      '';
    };
  };

  config = mkIf cfg.enable {
    home.packages = [ cfg.package ];
    xdg.configFile."foo/foorc" = mkIf (cfg.extraConfig != "") {
      text = ''
        # Generated by Home Manager.

        ${cfg.extraConfig}
      '';
    };
  };
}
```

Modul di atas memperkenalkan tiga `options`:

- `programs.foo.enable`: Mengendalikan apakah modul ini diaktifkan.
- `programs.foo.package`: Memungkinkan penyesuaian paket `foo`, misalnya memakai versi
  berbeda, menetapkan parameter kompilasi berbeda, dan sebagainya.
- `programs.foo.extraConfig`: Menyesuaikan berkas konfigurasi `foo`.

Lalu, pada bagian `config`, pengaturan berbeda diterapkan berdasarkan nilai ketiga
variabel yang dideklarasikan dalam `options`:

- Jika `programs.foo.enable` bernilai `false` atau tidak didefinisikan, tidak ada
  pengaturan yang diterapkan.
  - Ini dicapai dengan `lib.mkIf`.
- Jika tidak,
  - Tambahkan `programs.foo.package` ke `home.packages` untuk memasangnya dalam lingkungan
    pengguna.
  - Tulis nilai `programs.foo.extraConfig` ke `~/.config/foo/foorc`.

Dengan cara ini, kita bisa mengimpor modul tersebut dalam berkas Nix lain dan menyesuaikan
konfigurasi `foo` dengan menetapkan `options` yang didefinisikan di sini. Misalnya:

```nix
# ./bar.nix
{ config, lib, pkgs, ... }:

{
  imports = [
    ./foo.nix
  ];

  programs.foo ={
    enable = true;
    package = pkgs.hello;
    extraConfig = ''
      foo baz
    '';
  };
}
```

Pada contoh di atas, cara kita memberi nilai pada `options` sebenarnya merupakan bentuk
**singkat**. Jika modul hanya memuat `config` tanpa deklarasi lain (seperti `option` dan
parameter khusus sistem modul lainnya), pembungkus `config` bisa dihilangkan. Cukup tulis
langsung isi `config` untuk memberi nilai pada bagian `option` yang dideklarasikan dalam
modul lain!

## Pemberian Nilai dan Evaluasi Malas dalam Sistem Modul {#assignment-and-lazy-evaluation-in-the-module-system}

Sistem modul memanfaatkan sepenuhnya fitur evaluasi malas Nix, yang sangat penting untuk
mewujudkan konfigurasi berparameter.

Mari mulai dengan contoh sederhana:

```nix
# ./flake.nix
{
  description = "NixOS Flake for Test";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "test" = nixpkgs.lib.nixosSystem {
        modules = [
          ({config, lib, ...}: {
            options = {
              foo = lib.mkOption {
                default = false;
                type = lib.types.bool;
              };
            };

            # Scenario 1 (works fine)
            config.warnings = if config.foo then ["foo"] else [];

            # Scenario 2 (error: infinite recursion encountered)
            # config = if config.foo then { warnings = ["foo"];} else {};

            # Scenario 3 (works fine)
            # config = lib.mkIf config.foo {warnings = ["foo"];};
          })
        ];
      };
    };
  };
}
```

Pada contoh 1, 2, dan 3 dalam konfigurasi di atas, nilai `config.warnings` bergantung pada
nilai `config.foo`, tetapi cara implementasinya berbeda. Simpan konfigurasi di atas
sebagai `flake.nix`, lalu pakai perintah
`nix eval .#nixosConfigurations.test.config.warnings` untuk menguji contoh 1, 2, dan 3
secara terpisah. Kamu akan mendapati contoh 1 dan 3 berjalan dengan benar, sementara
contoh 2 menghasilkan kesalahan: `error: infinite recursion encountered`.

Mari jelaskan setiap kasus:

1. Alur evaluasi contoh 1: `config.warnings` => `config.foo` => `config`
   1. Pertama, Nix mencoba menghitung nilai `config.warnings`, tetapi ternyata nilainya
      bergantung pada `config.foo`.
   2. Berikutnya, Nix mencoba menghitung nilai `config.foo`, yang bergantung pada `config`
      di luarnya.
   3. Nix mencoba menghitung nilai `config`. Karena isi yang tidak benar-benar dipakai
      `config.foo` dievaluasi secara malas, pada titik ini tidak ada dependensi rekursif
      pada `config.warnings`.
   4. Evaluasi `config.foo` selesai, diikuti pemberian nilai `config.warnings`, dan
      perhitungan berakhir.

2. Contoh 2: `config` => `config.foo` => `config`
   1. Awalnya, Nix mencoba menghitung nilai `config`, tetapi ternyata nilainya bergantung
      pada `config.foo`.
   2. Berikutnya, Nix mencoba menghitung nilai `config.foo`, yang bergantung pada `config`
      di luarnya.
   3. Nix mencoba menghitung nilai `config`, lalu kembali ke langkah 1. Ini menimbulkan
      rekursi tak berhingga dan akhirnya kesalahan.

3. Contoh 3: Satu-satunya perbedaan dari contoh 2 adalah penggunaan `lib.mkIf` untuk
   mengatasi masalah rekursi tak berhingga.

Kuncinya terletak pada fungsi `lib.mkIf`. Saat `lib.mkIf` dipakai untuk mendefinisikan
`config`, Nix akan mengevaluasinya secara malas. Artinya, perhitungan
`config = lib.mkIf ...` hanya terjadi setelah evaluasi `config.foo` selesai.

Sistem modul Nixpkgs menyediakan serangkaian fungsi serupa `lib.mkIf` untuk konfigurasi
berparameter dan penggabungan modul secara cerdas:

1. `lib.mkIf`: Sudah diperkenalkan.
2. `lib.mkOverride` / `lib.mkDefault` / `lib.mkForce`: Sudah dibahas dalam
   [Memodulkan Konfigurasi NixOS](../nixos-with-flakes/modularize-the-configuration.md).
3. `lib.mkOrder`, `lib.mkBefore`, dan `lib.mkAfter`: Seperti disebutkan di atas.
4. Periksa [Option Definitions - NixOS] untuk fungsi lain terkait pemberian nilai
   (definisi) opsi.

## Deklarasi Opsi dan Pemeriksaan Tipe {#option-declaration-and-type-checking}

Meski pemberian nilai merupakan fitur sistem modul yang paling sering dipakai, untuk
membuat `options` kustom kamu juga perlu mendalami deklarasi opsi dan pemeriksaan tipe.
Menurut saya, bagian ini cukup mudah, jauh lebih sederhana daripada pemberian nilai.
Dasarnya bisa dipahami langsung dengan merujuk dokumentasi resmi. Saya tidak akan
membahasnya secara terperinci di sini.

- [Option Declarations - NixOS]
- [Options Types - NixOS]

## Meneruskan Parameter Nonbawaan ke Sistem Modul {#passing-non-default-parameters-to-the-module-system}

Kita sudah memperkenalkan penggunaan `specialArgs` dan `_module.args` untuk meneruskan
parameter tambahan ke fungsi Modul lain pada bagian
[Kemampuan Komposisi Flakes dan Sistem Modul Nixpkgs](../nixos-with-flakes/nixos-flake-and-module-system.md#pass-non-default-parameters-to-submodules).
Tidak perlu dijelaskan lagi di sini.

## Cara Mengimpor Modul secara Selektif {#selectively-import-modules}

Pada contoh di atas, kita memperkenalkan cara mengaktifkan atau menonaktifkan fitur
tertentu melalui opsi kustom. Namun, semua implementasi kode kita berada dalam berkas Nix
yang sama. Jika modul tersebar dalam beberapa berkas, bagaimana mengimpornya secara
selektif?

Mari terlebih dahulu lihat beberapa pola penggunaan keliru yang umum, lalu perkenalkan
cara yang benar.

### Penggunaan Keliru #1 — Memakai `imports` dalam `config = { ... };` {#wrong-usage-1}

Pikiran pertama mungkin langsung memakai `imports` dalam `config = { ... };`, seperti ini:

```nix
# ./flake.nix
{
  description = "NixOS Flake for Test";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "test" = nixpkgs.lib.nixosSystem {
        modules = [
          ({config, lib, ...}: {
            options = {
              foo = lib.mkOption {
                default = false;
                type = lib.types.bool;
              };
            };
            config = lib.mkIf config.foo {
              # Using imports in config will cause an error
              imports = [
                {warnings = ["foo"];}
                # ...omit other module or file paths
              ];
            };
          })
        ];
      };
    };
  };
}
```

Namun, ini tidak akan berhasil. Coba simpan `flake.nix` di atas dalam direktori baru, lalu
jalankan `nix eval .#nixosConfigurations.test.config.warnings` di sana. Akan muncul
kesalahan seperti `error: The option 'imports' does not exist.`.

Ini karena `config` adalah attribute set biasa, sementara `imports` merupakan parameter
khusus sistem modul. Tidak ada definisi seperti `config.imports`.

### Penggunaan Benar #1 — Definisikan `options` Tersendiri untuk Semua Modul yang Memerlukan Impor Bersyarat {#correct-usage-1}

Inilah cara yang paling disarankan. Modul dalam sistem NixOS diimplementasikan dengan cara
ini. Pencarian `enable` di <https://search.nixos.org/options> akan menampilkan banyak
modul sistem yang bisa diaktifkan atau dinonaktifkan melalui opsi `enable`.

Cara penulisannya sudah diperkenalkan pada bagian
[Struktur dan Penggunaan Dasar](#basic-structure-and-usage) sebelumnya dan tidak akan
diulangi di sini.

Kekurangannya, semua modul Nix yang memerlukan impor bersyarat harus diubah. Seluruh
deklarasi konfigurasi dalam modul harus dipindahkan ke blok kode `config = { ... };`. Ini
menambah kerumitan kode dan kurang ramah bagi pemula.

### Penggunaan Benar #2 — Pakai `lib.optionals` dalam `imports = [];` {#correct-usage-2}

Keunggulan utama cara ini: jauh lebih sederhana daripada cara-cara sebelumnya. Isi modul
tidak perlu diubah. Cukup pakai `lib.optionals` dalam `imports` untuk menentukan apakah
modul perlu diimpor.

> Rincian cara kerja `lib.optionals`: <https://noogle.dev/f/lib/optionals>

Mari langsung lihat contohnya:

```nix
# ./flake.nix
{
  description = "NixOS Flake for Test";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "test" = nixpkgs.lib.nixosSystem {
        specialArgs = { enableFoo = true; };
        modules = [
          ({config, lib, enableFoo ? false, ...}: {
            imports =
              [
                 # Other Modules
              ]
              # Use lib.optionals to decide whether to import foo.nix
              ++ (lib.optionals (enableFoo) [./foo.nix]);
          })
        ];
      };
    };
  };
}
```

```nix
# ./foo.nix
{ warnings = ["foo"];}
```

Simpan kedua berkas Nix di atas dalam satu folder, lalu jalankan
`nix eval .#nixosConfigurations.test.config.warnings` di folder tersebut. Semuanya
berjalan normal:

```bash
› nix eval .#nixosConfigurations.test.config.warnings
[ "foo" ]
```

Satu hal yang perlu diperhatikan: **kamu tidak bisa memakai parameter yang diteruskan
melalui `_module.args` dalam `imports =[ ... ];`**. Kita sudah menjelaskannya secara
terperinci pada bagian sebelumnya,
[Meneruskan Parameter Nonbawaan ke Submodul](../nixos-with-flakes/nixos-flake-and-module-system#pass-non-default-parameters-to-submodules).

## Rujukan {#references}

- [Best resources for learning about the NixOS module system? - Discourse](https://discourse.nixos.org/t/best-resources-for-learning-about-the-nixos-module-system/1177/4)
- [NixOS modules - NixOS Wiki](https://wiki.nixos.org/wiki/NixOS_modules)
- [NixOS: config argument - NixOS Wiki](https://wiki.nixos.org/wiki/NixOS:config_argument)
- [Module System - Nixpkgs]
- [Writing NixOS Modules - Nixpkgs]

[lib/modules.nix]: https://github.com/NixOS/nixpkgs/blob/nixos-26.05/lib/modules.nix
[Module System - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/doc/module-system/module-system.chapter.md
[Writing NixOS Modules - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/writing-modules.chapter.md
[Option Definitions - NixOS]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/option-def.section.md
[Option Declarations - NixOS]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/option-declarations.section.md
[Options Types - NixOS]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/option-types.section.md

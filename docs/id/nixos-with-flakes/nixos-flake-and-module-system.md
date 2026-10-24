# Kemampuan Komposisi Flakes dan Sistem Modul Nixpkgs {#the-combination-ability-of-flakes-and-nixpkgs-module-system}

## Penjelasan Struktur Modul Nixpkgs {#simple-introduction-to-nixpkgs-module-structure}

> Cara kerja sistem modul ini akan diperkenalkan secara terperinci pada bagian
> [Memodulkan Konfigurasi NixOS](./modularize-the-configuration.md) berikutnya. Di sini,
> kita hanya membahas beberapa pengetahuan dasar.

Kamu mungkin bertanya-tanya mengapa berkas konfigurasi `/etc/nixos/configuration.nix`
mengikuti definisi Modul Nixpkgs dan bisa langsung dirujuk dalam `flake.nix`.

Untuk memahaminya, kita perlu terlebih dahulu mempelajari asal-usul sistem modul Nixpkgs
dan tujuannya.

Seluruh kode implementasi NixOS disimpan dalam direktori
[Nixpkgs/nixos](https://github.com/NixOS/nixpkgs/tree/master/nixos), dan sebagian besarnya
ditulis dalam bahasa Nix. Untuk menulis dan memelihara kode Nix sebanyak itu, serta
memungkinkan pengguna menyesuaikan berbagai fungsi sistem NixOS dengan leluasa, sistem
modular untuk kode Nix sangat diperlukan.

Sistem modular untuk kode Nix ini juga diimplementasikan dalam repositori Nixpkgs dan
terutama dipakai untuk memodulkan konfigurasi sistem NixOS. Namun, penggunaannya juga luas
di tempat lain, seperti nix-darwin dan home-manager. Karena NixOS dibangun di atas sistem
modular ini, wajar jika berkas konfigurasinya, termasuk `/etc/nixos/configuration.nix`,
merupakan Modul Nixpkgs.

Sebelum melanjutkan, kita perlu memahami dasar cara kerja sistem modul ini.

Berikut struktur sederhana sebuah Modul Nixpkgs:

```nix
{lib, config, options, pkgs, ...}:
{
  # Importing other Modules
  imports = [
    # ...
    ./xxx.nix
  ];
  for.bar.enable = true;
  # Other option declarations
  # ...
}
```

Definisi ini sebenarnya adalah fungsi Nix, dengan lima **parameter yang dihasilkan
otomatis, disuntikkan otomatis, dan tidak perlu dideklarasikan**, yang disediakan oleh
sistem modul:

1. `lib`: Pustaka fungsi bawaan nixpkgs, berisi banyak fungsi praktis untuk mengolah
   ekspresi Nix.
   - Untuk informasi lebih lanjut, lihat
     <https://nixos.org/manual/nixpkgs/stable/#id-1.4>.
2. `config`: Set nilai semua opsi dalam lingkungan saat ini. Ini akan banyak dipakai pada
   bagian sistem modul selanjutnya.
3. `options`: Set semua opsi yang didefinisikan di seluruh Modul dalam lingkungan saat
   ini.
4. `pkgs`: Koleksi yang memuat semua paket nixpkgs beserta beberapa fungsi utilitas
   terkait.
   - Pada tahap pemula, kamu bisa menganggap nilai bawaannya sebagai
     `nixpkgs.legacyPackages.<system>`, dengan `<system>` sebagai arsitektur mesinmu
     (misalnya `x86_64-linux`). Nilai `pkgs` bisa disesuaikan melalui opsi `nixpkgs.pkgs`.
5. `modulesPath`: Parameter yang hanya tersedia dalam NixOS, berupa path yang menunjuk ke
   [nixpkgs/nixos/modules](https://github.com/NixOS/nixpkgs/tree/nixos-26.05/nixos/modules).
   - Didefinisikan dalam [nixpkgs - modulesPath].
   - Biasanya dipakai untuk mengimpor modul NixOS tambahan dan bisa ditemukan dalam
     sebagian besar berkas `hardware-configuration.nix` yang dihasilkan otomatis oleh
     NixOS.

## Meneruskan Parameter Nonbawaan ke Submodul {#pass-non-default-parameters-to-submodules}

Jika perlu meneruskan parameter nonbawaan lain ke submodul, kamu perlu memakai cara khusus
untuk menentukan parameter tersebut secara manual.

Sistem modul Nixpkgs menyediakan dua cara meneruskan parameter nonbawaan:

1. Parameter `specialArgs` pada fungsi `nixpkgs.lib.nixosSystem`
2. Opsi `_module.args` dalam modul mana pun untuk meneruskan parameter

Dokumentasi resmi kedua parameter ini tersembunyi jauh dan penjelasannya samar serta sulit
dipahami. Bagi pembaca yang tertarik, saya sertakan tautannya di sini:

1. `specialArgs`: Ada beberapa penyebutan yang tersebar dalam NixOS Manual dan Nixpkgs
   Manual.
   - Nixpkgs Manual: [Module System - Nixpkgs]
   - NixOS Manual: [nixos manual - specialArgs]
1. `_module.args`:
   - NixOS Manual:
     [Appendix A. Configuration Options](https://nixos.org/manual/nixos/stable/options#opt-_module.args)
   - Kode Sumber: [nixpkgs/nixos-26.05/lib/modules.nix - _module.args]

Singkatnya, `specialArgs` dan `_module.args` sama-sama memerlukan attribute set sebagai
nilainya. Keduanya memiliki tujuan yang sama: meneruskan semua parameter dalam attribute
set itu ke semua submodul. Perbedaannya:

1. Opsi `_module.args` bisa dipakai dalam modul mana pun untuk saling meneruskan
   parameter. Ini lebih leluasa daripada `specialArgs`, yang hanya bisa dipakai dalam
   fungsi `nixpkgs.lib.nixosSystem`.
1. `_module.args` dideklarasikan dalam modul, sehingga baru bisa dipakai setelah seluruh
   modul selesai dievaluasi. Artinya, **jika parameter yang diteruskan melalui
   `_module.args` dipakai dalam `imports = [ ... ];`, akan terjadi kesalahan
   `infinite recursion`**. Dalam kasus ini, kamu harus memakai `specialArgs`.

Secara pribadi, saya lebih menyukai `specialArgs` karena lebih langsung dan mudah dipakai.
Selain itu, gaya penamaan `_xxx` membuatnya terasa seperti sesuatu yang internal dan
kurang cocok dipakai dalam berkas konfigurasi pengguna.

Misalnya, kamu ingin meneruskan suatu dependensi agar bisa dipakai submodul. Kamu bisa
memakai parameter `specialArgs` untuk meneruskan `inputs` ke semua submodul:

```nix{11}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    another-input.url = "github:username/repo-name/branch-name";
  };

  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      # Set all inputs parameters as special arguments for all submodules,
      # so you can directly use all dependencies in inputs in submodules
      specialArgs = { inherit inputs; };
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

Atau, kamu bisa memperoleh hasil yang sama dengan opsi `_module.args`:

```nix{13}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    another-input.url = "github:username/repo-name/branch-name";
  };
  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        ./configuration.nix
        {
          # Set all inputs parameters as special arguments for all submodules,
          # so you can directly use all dependencies in inputs in submodules
          _module.args = { inherit inputs; };
        }
      ];
    };
  };
}
```

Pilih salah satu dari dua cara di atas untuk mengubah konfigurasi. Setelah itu, parameter
`inputs` bisa dipakai dalam `/etc/nixos/configuration.nix`. Sistem modul akan otomatis
mencocokkan `inputs` yang didefinisikan dalam `specialArgs` dan menyuntikkannya ke semua
submodul yang memerlukan parameter ini:

```nix{3}
# Nix will match by name and automatically inject the inputs
# from specialArgs/_module.args into the third parameter of this function
{ config, pkgs, inputs, ... }:
{
  # ...
}
```

Bagian berikutnya akan memperlihatkan penggunaan `specialArgs`/`_module.args` untuk
memasang perangkat lunak sistem dari sumber flake lain.

## Memasang Perangkat Lunak Sistem dari Sumber Flake Lain {#install-system-packages-from-other-flakes}

Kebutuhan paling umum dalam mengelola sistem adalah memasang perangkat lunak. Di bagian
sebelumnya, kita sudah melihat cara memasang paket dari repositori resmi nixpkgs dengan
`environment.systemPackages`. Semua paket tersebut berasal dari repositori resmi nixpkgs.

Sekarang, kita akan belajar memasang paket perangkat lunak dari sumber flake lain. Ini
jauh lebih leluasa daripada langsung memasang dari nixpkgs. Penggunaan utamanya adalah
memasang versi terbaru perangkat lunak yang belum ditambahkan atau diperbarui dalam
Nixpkgs.

Sebagai contoh, berikut cara langsung mengompilasi dan memasang branch master editor
Helix.

Pertama, tambahkan sumber data input helix ke `flake.nix`:

```nix{6,11,17}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

    # helix editor, use the master branch
    helix.url = "github:helix-editor/helix/master";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      specialArgs = { inherit inputs; };
      modules = [
        ./configuration.nix

        # This module works the same as the `specialArgs` parameter we used above
        # choose one of the two methods to use
        # { _module.args = { inherit inputs; };}
      ];
    };
  };
}
```

Selanjutnya, kamu bisa merujuk sumber data input flake ini dalam `configuration.nix`:

```nix{1,10}
{ config, pkgs, inputs, ... }:
{
  # ...
  environment.systemPackages = with pkgs; [
    git
    vim
    wget
    # Here, the helix package is installed from the helix input data source
    inputs.helix.packages."${pkgs.stdenv.hostPlatform.system}".helix
  ];
  # ...
}
```

Lakukan perubahan yang diperlukan dan terapkan dengan `sudo nixos-rebuild switch`.
Deployment kali ini akan jauh lebih lama, karena Nix akan mengompilasi seluruh program
Helix dari kode sumber.

Setelah deployment, kamu bisa langsung menguji dan memastikan instalasinya dengan perintah
`hx` di terminal.

Selain itu, jika hanya ingin mencoba versi terbaru Helix sebelum memutuskan memasangnya
pada sistem, ada cara lebih sederhana dengan satu perintah. (Namun, seperti disebutkan
sebelumnya, kompilasi dari kode sumber akan memakan waktu lama.)

```bash
nix run github:helix-editor/helix/master
```

Penggunaan `nix run` akan kita bahas lebih terperinci pada bagian
[Penggunaan CLI Baru](../other-usage-of-flakes/the-new-cli.md) berikutnya.

## Memanfaatkan Fitur dari Paket Flakes Lain {#leveraging-features-from-other-flakes-packages}

Sebenarnya, inilah fungsi utama Flakes: sebuah flake bisa bergantung pada flake lain agar
bisa memanfaatkan fitur yang disediakannya. Mirip dengan memakai fungsi dari pustaka lain
saat menulis program dalam TypeScript, Go, Rust, dan bahasa pemrograman lainnya.

Contoh di atas, yang memakai versi terbaru dari Flake resmi Helix, memperlihatkan fungsi
ini. Penggunaan lain akan dibahas nanti. Berikut beberapa contoh yang akan dirujuk:

- [Mulai Menggunakan Home Manager](./start-using-home-manager.md): Memperkenalkan
  Home-Manager dari komunitas sebagai dependensi, sehingga fitur Flake ini bisa langsung
  dipakai.
- [Menurunkan atau Menaikkan Versi Paket](./downgrade-or-upgrade-packages.md):
  Memperkenalkan beberapa versi Nixpkgs sebagai dependensi, sehingga paket bisa dipilih
  dengan leluasa dari berbagai versi Nixpkgs.

## Tutorial Flakes Lainnya {#more-flakes-tutorials}

Sampai di sini, kita sudah belajar memakai Flakes untuk mengonfigurasi sistem NixOS. Jika
masih punya pertanyaan tentang Flakes atau ingin belajar lebih dalam, langsung rujuk
berbagai dokumen resmi/semiresmi berikut:

- Dokumentasi resmi Nix Flakes:
  - [Nix flakes - Nix Manual](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake)
  - [Flakes - nix.dev](https://nix.dev/concepts/flakes)
- Rangkaian tutorial Flakes oleh Eelco Dolstra (pencipta Nix):
  - [Nix Flakes, Part 1: An introduction and tutorial (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-05-25-flakes/)
  - [Nix Flakes, Part 2: Evaluation caching (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-06-25-eval-cache/)
  - [Nix Flakes, Part 3: Managing NixOS systems (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-07-31-nixos-flakes/)
- Dokumen berguna lainnya:
  - [Practical Nix Flakes](https://serokell.io/blog/practical-nix-flakes)

[nix flake - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake#flake-inputs
[nixpkgs/flake.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-26.05/flake.nix
[nixpkgs/nixos/lib/eval-config.nix]:
  https://github.com/NixOS/nixpkgs/tree/nixos-26.05/nixos/lib/eval-config.nix
[Module System - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/doc/module-system/module-system.chapter.md
[nixpkgs/nixos-26.05/lib/modules.nix - _module.args]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/lib/modules.nix#L122-L184
[nixos manual - specialArgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/option-types.section.md?plain=1#L299-L306
[nixpkgs - modulesPath]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/lib/eval-config-minimal.nix#L42

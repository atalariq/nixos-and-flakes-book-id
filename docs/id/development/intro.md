# Lingkungan Pengembangan di NixOS {#development-environments-on-nixos}

Reproduksibilitas NixOS membuatnya ideal untuk membangun lingkungan pengembangan. Namun,
jika terbiasa dengan distribusi lain, kamu mungkin menemui masalah karena NixOS memiliki
logikanya sendiri. Kita akan menjelaskannya secara singkat di bawah.

Pada bagian-bagian berikut, kita akan memperkenalkan cara kerja lingkungan pengembangan
NixOS.

## Membuat Lingkungan Shell Kustom dengan `nix shell` {#creating-a-custom-shell-environment-with-nix-shell}

Cara paling sederhana membuat lingkungan pengembangan adalah memakai `nix shell`.
`nix shell` membuat lingkungan shell dengan paket Nix yang ditentukan terpasang di
dalamnya.

Berikut contohnya:

```shell
# hello is not available
› hello
hello: command not found

# Enter an environment with the 'hello' and `cowsay` package
› nix shell nixpkgs#hello nixpkgs#cowsay

# hello is now available
› hello
Hello, world!

# ponysay is also available
› cowsay "Hello, world!"
 _______
< hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

`nix shell` sangat berguna saat kamu hanya ingin mencoba beberapa paket atau membuat
lingkungan bersih dengan cepat.

## Membuat Lingkungan Pengembangan {#creating-a-development-environment}

`nix shell` sederhana dan mudah dipakai, tetapi tidak terlalu luwes. Untuk lingkungan
pengembangan yang lebih rumit, kita perlu memakai `pkgs.mkShell` dan `nix develop`.

Kita bisa membuat lingkungan pengembangan dengan `pkgs.mkShell { ... }` dan membuka shell
Bash interaktif di dalamnya melalui `nix develop`.

Untuk melihat cara kerja [`pkgs.mkShell`], mari periksa kode sumbernya.

```nix
{ lib, stdenv, buildEnv }:

# A special kind of derivation that is only meant to be consumed by the
# nix-shell.
{ name ? "nix-shell"
, # a list of packages to add to the shell environment
  packages ? [ ]
, # propagate all the inputs from the given derivations
  inputsFrom ? [ ]
, buildInputs ? [ ]
, nativeBuildInputs ? [ ]
, propagatedBuildInputs ? [ ]
, propagatedNativeBuildInputs ? [ ]
, ...
}@attrs:
let
  mergeInputs = name:
    (attrs.${name} or [ ]) ++
    (lib.subtractLists inputsFrom (lib.flatten (lib.catAttrs name inputsFrom)));

  rest = builtins.removeAttrs attrs [
    "name"
    "packages"
    "inputsFrom"
    "buildInputs"
    "nativeBuildInputs"
    "propagatedBuildInputs"
    "propagatedNativeBuildInputs"
    "shellHook"
  ];
in

stdenv.mkDerivation ({
  inherit name;

  buildInputs = mergeInputs "buildInputs";
  nativeBuildInputs = packages ++ (mergeInputs "nativeBuildInputs");
  propagatedBuildInputs = mergeInputs "propagatedBuildInputs";
  propagatedNativeBuildInputs = mergeInputs "propagatedNativeBuildInputs";

  shellHook = lib.concatStringsSep "\n" (lib.catAttrs "shellHook"
    (lib.reverseList inputsFrom ++ [ attrs ]));

  phases = [ "buildPhase" ];

  # ......

  # when distributed building is enabled, prefer to build locally
  preferLocalBuild = true;
} // rest)
```

`pkgs.mkShell { ... }` adalah derivation (paket Nix) khusus. Parameter `name`,
`buildInputs`, dan lainnya bisa disesuaikan. `shellHook` adalah parameter khusus yang
dijalankan ketika `nix develop` memasuki lingkungan.

Berikut `flake.nix` yang mendefinisikan lingkungan pengembangan dengan Node.js 24
terpasang:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system should match the system you are running on
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs { inherit system; };
    in pkgs.mkShell {
      # create an environment with nodejs, pnpm, and yarn
      packages = with pkgs; [
        nodejs_24
        pnpm
        (yarn.override { nodejs = nodejs_24; })
      ];

      shellHook = ''
        echo "node `node --version`"
      '';
    };
  };
}
```

Buat folder kosong, simpan konfigurasi di atas sebagai `flake.nix`, lalu jalankan
`nix develop` (atau, lebih tepatnya, `nix develop .#default`). Versi nodejs saat ini akan
dicetak, dan kini kamu bisa memakai `node` `pnpm` `yarn` dengan lancar.

## Memakai zsh/fish/... sebagai Pengganti bash {#using-zsh-fish-instead-of-bash}

`pkgs.mkShell` memakai `bash` secara bawaan, tetapi kamu juga bisa memakai `zsh` atau
`fish` dengan menambahkan `exec <your-shell>` ke `shellHook`.

Berikut contohnya:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system should match the system you are running on
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs { inherit system; };
    in pkgs.mkShell {
      # create an environment with nodejs_24, pnpm, and yarn
      packages = with pkgs; [
        nodejs_24
        pnpm
        (yarn.override { nodejs = nodejs_24; })
        nushell
      ];

      shellHook = ''
        echo "node `node --version`"
        exec nu
      '';
    };
  };
}
```

Dengan konfigurasi di atas, `nix develop` akan memasuki lingkungan REPL nushell.

## Membuat Lingkungan Pengembangan dengan `pkgs.runCommand` {#creating-a-development-environment-with-pkgs-runcommand}

Derivation yang dibuat oleh `pkgs.mkShell` tidak bisa dipakai langsung, melainkan harus
diakses melalui `nix develop`.

Sebenarnya, kita bisa membuat pembungkus shell berisi paket yang diperlukan melalui
`pkgs.stdenv.mkDerivation`. Lingkungannya lalu bisa langsung dimasuki dengan menjalankan
pembungkus itu.

Memakai `mkDerivation` langsung agak merepotkan. Nixpkgs menyediakan fungsi lebih
sederhana untuk membantu membuat pembungkus semacam ini, seperti `pkgs.runCommand`.

Contoh:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system should match the system you are running on
    system = "x86_64-linux";
  in {
    packages."${system}".dev = let
      pkgs = import nixpkgs { inherit system; };
      packages = with pkgs; [
          nodejs_22
          pnpm
          nushell
      ];
    in pkgs.runCommand "dev-shell" {
      # Dependencies that should exist in the runtime environment
      buildInputs = packages;
      # Dependencies that should only exist in the build environment
      nativeBuildInputs = [ pkgs.makeWrapper ];
    } ''
      mkdir -p $out/bin/
      ln -s ${pkgs.nushell}/bin/nu $out/bin/dev-shell
      wrapProgram $out/bin/dev-shell --prefix PATH : ${pkgs.lib.makeBinPath packages}
    '';
  };
}
```

Lalu jalankan `nix run .#dev` atau `nix shell .#dev --command 'dev-shell'`. Kamu akan
memasuki sesi nushell, tempat perintah `node` `pnpm` bisa dipakai secara normal, dengan
node versi 22.

Pembungkus yang dihasilkan dengan cara ini merupakan berkas yang bisa dieksekusi dan
sebenarnya tidak bergantung pada perintah `nix run` atau `nix shell`.

Misalnya, kita bisa langsung memasang pembungkus ini melalui `environment.systemPackages`
NixOS, lalu langsung menjalankannya:

```nix
{pkgs, lib, ...}:{

  environment.systemPackages = [
    # Install the wrapper into the system
    (let
      packages = with pkgs; [
          nodejs_22
          pnpm
          nushell
      ];
    in pkgs.runCommand "dev-shell" {
      # Dependencies that should exist in the runtime environment
      buildInputs = packages;
      # Dependencies that should only exist in the build environment
      nativeBuildInputs = [ pkgs.makeWrapper ];
    } ''
      mkdir -p $out/bin/
      ln -s ${pkgs.nushell}/bin/nu $out/bin/dev-shell
      wrapProgram $out/bin/dev-shell --prefix PATH : ${pkgs.lib.makeBinPath packages}
    '')
  ];
}
```

Tambahkan konfigurasi di atas ke Modul NixOS mana pun, lalu terapkan dengan
`sudo nixos-rebuild switch`. Kamu bisa langsung memasuki lingkungan pengembangan melalui
perintah `dev-shell`. Inilah keistimewaan `pkgs.runCommand` dibandingkan `pkgs.mkShell`.

Kode sumber terkait:

- [pkgs/build-support/trivial-builders/default.nix - runCommand]
- [pkgs/build-support/setup-hooks/make-wrapper.sh]

## Memasuki Lingkungan Build Paket Nix Mana Pun {#enter-the-build-environment-of-any-nix-package}

Sekarang, mari lihat `nix develop`. Pertama, baca dokumen bantuan yang ditampilkan oleh
`nix develop --help`:

```shell
Name
    nix develop - run a bash shell that provides the build environment of a derivation

Synopsis
    nix develop [option...] installable
# ......
```

Di sana dijelaskan bahwa `nix develop` menerima parameter `installable`. Artinya, kita
bisa memasuki lingkungan pengembangan paket Nix mana pun yang bisa dipasang, bukan hanya
lingkungan yang dibuat oleh `pkgs.mkShell`.

Secara bawaan, `nix develop` akan mencoba atribut berikut dalam output flake:

- `devShells.<system>.default`
- `packages.<system>.default`

Jika memakai `nix develop /path/to/flake#<name>` untuk menentukan alamat paket flake dan
nama output-nya, `nix develop` akan mencoba atribut berikut dalam output flake:

- `devShells.<system>.<name>`
- `packages.<system>.<name>`
- `legacyPackages.<system>.<name>`

Sekarang mari coba. Pertama, pastikan lingkungan saat ini tidak memiliki `c++` `g++` dan
perintah terkait kompilasi lainnya:

```shell
ryan in 🌐 aquamarine in ~
› c++
c++: command not found

ryan in 🌐 aquamarine in ~
› g++
g++: command not found
```

Lalu pakai `nix develop` untuk memasuki lingkungan build paket `hello` dalam `nixpkgs`:

```shell
# login to the build environment of the package `hello`
ryan in 🌐 aquamarine in ~
› nix develop nixpkgs#hello

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› env | grep CXX
CXX=g++

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› c++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› g++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

Terlihat bahwa variabel lingkungan `CXX` sudah ditetapkan. `c++` `g++` dan perintah lain
kini bisa dipakai secara normal.

Selain itu, kita juga bisa memanggil setiap tahap build paket `hello` secara normal:

> Urutan eksekusi bawaan semua tahap build paket Nix adalah:
> `$prePhases unpackPhase patchPhase $preConfigurePhases configurePhase $preBuildPhases buildPhase checkPhase $preInstallPhases installPhase fixupPhase installCheckPhase $preDistPhases distPhase $postPhases`

```shell
# unpack source code
ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› unpackPhase
unpacking source archive /nix/store/pa10z4ngm0g83kx9mssrqzz30s84vq7k-hello-2.12.1.tar.gz
source root is hello-2.12.1
setting SOURCE_DATE_EPOCH to timestamp 1653865426 of file hello-2.12.1/ChangeLog

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› ls
hello-2.12.1

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› cd hello-2.12.1/

# generate Makefile
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via ❄️  impure (hello-2.12.1-env)
› configurePhase
configure flags: --prefix=/tmp/xxx/outputs/out --prefix=/tmp/xxx/outputs/out
checking for a BSD-compatible install... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/install -c
checking whether build environment is sane... yes
checking for a thread-safe mkdir -p... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/mkdir -p
checking for gawk... gawk
checking whether make sets $(MAKE)... yes
checking whether make supports nested variables... yes
checking for gcc... gcc
# ......
checking that generated files are newer than configure... done
configure: creating ./config.status
config.status: creating Makefile
config.status: creating po/Makefile.in
config.status: creating config.h
config.status: config.h is unchanged
config.status: executing depfiles commands
config.status: executing po-directories commands
config.status: creating po/POTFILES
config.status: creating po/Makefile

# build the package
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env) took 2s
› buildPhase
build flags: SHELL=/run/current-system/sw/bin/bash
make  all-recursive
make[1]: Entering directory '/tmp/xxx/hello-2.12.1'
# ......
ranlib lib/libhello.a
gcc  -g -O2   -o hello src/hello.o  ./lib/libhello.a
make[2]: Leaving directory '/tmp/xxx/hello-2.12.1'
make[1]: Leaving directory '/tmp/xxx/hello-2.12.1'

# run the built program
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env)
› ./hello
Hello, world!
```

Penggunaan ini terutama ditujukan untuk debugging proses build paket Nix, atau menjalankan
beberapa perintah dalam lingkungan build paket Nix.

## `nix build` {#nix-build}

Perintah `nix build` dipakai untuk membangun paket perangkat lunak dan membuat tautan
simbolis bernama `result` dalam direktori saat ini, yang menunjuk ke hasil build.

Berikut contohnya:

```bash
# Build the package 'ponysay' from the 'nixpkgs' flake
nix build "nixpkgs#ponysay"
# Use the built 'ponysay' command
› ./result/bin/ponysay 'hey buddy!'
 ____________
< hey buddy! >
 ------------
     \
      \
       \
       ▄▄  ▄▄ ▄ ▄
    ▀▄▄▄█▄▄▄▄▄█▄▄▄
   ▀▄███▄▄██▄██▄▄██
  ▄██▄███▄▄██▄▄▄█▄██
 █▄█▄██▄█████████▄██
  ▄▄█▄█▄▄▄▄▄████████
 ▀▀▀▄█▄█▄█▄▄▄▄▄█████         ▄   ▄
    ▀▄████▄▄▄█▄█▄▄██       ▄▄▄▄▄█▄▄▄
    █▄██▄▄▄▄███▄▄▄██    ▄▄▄▄▄▄▄▄▄█▄▄
    ▀▄▄██████▄▄▄████    █████████████
       ▀▀▀▀▀█████▄▄ ▄▄▄▄▄▄▄▄▄▄██▄█▄▄▀
            ██▄███▄▄▄▄█▄▄▀  ███▄█▄▄▄█▀
            █▄██▄▄▄▄▄████   ███████▄██
            █▄███▄▄█████    ▀███▄█████▄
            ██████▀▄▄▄█▄█    █▄██▄▄█▄█▄
           ███████ ███████   ▀████▄████
           ▀▀█▄▄▄▀ ▀▀█▄▄▄▀     ▀██▄▄██▀█
                                ▀  ▀▀█
```

## Memakai `nix profile` untuk Mengelola Lingkungan Pengembangan dan Hiburan {#using-nix-profile-to-manage-development-environments-and-entertainment-environments}

`nix develop` adalah alat untuk membuat dan mengelola beberapa lingkungan pengguna, serta
beralih ke lingkungan berbeda saat diperlukan.

Berbeda dengan `nix develop`, `nix profile` mengelola lingkungan sistem pengguna,
alih-alih membuat lingkungan shell sementara. Jadi, alat ini lebih kompatibel dengan
Jetbrains IDE / VSCode dan IDE lainnya. Masalah lingkungan pengembangan yang sudah
dikonfigurasi tetapi tidak bisa dipakai dalam IDE pun tidak terjadi.

Belum dikerjakan

## Perintah Lain {#other-commands}

Ada perintah lain seperti `nix flake init`, yang bisa kamu jelajahi dalam [New Nix
Commands][New Nix Commands]. Untuk informasi lebih terperinci, rujuk dokumentasinya.

## Rujukan {#references}

- [pkgs.mkShell - nixpkgs manual](https://nixos.org/manual/nixpkgs/stable/#sec-pkgs-mkShell)
- [A minimal nix-shell](https://fzakaria.com/2021/08/02/a-minimal-nix-shell.html)
- [Wrapping packages - NixOS Cookbook](https://wiki.nixos.org/wiki/Nix_Cookbook#Wrapping_packages)
- [One too many shell, Clearing up with nix' shells nix shell and nix-shell - Yannik Sander](https://blog.ysndr.de/posts/guides/2021-12-01-nix-shells/)
- [Shell Scripts - NixOS Wiki](https://wiki.nixos.org/wiki/Shell_Scripts)

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html
[pkgs/build-support/trivial-builders/default.nix - runCommand]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/trivial-builders/default.nix#L25-L54
[pkgs/build-support/setup-hooks/make-wrapper.sh]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/setup-hooks/make-wrapper.sh
[`pkgs.mkShell`]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/mkshell/default.nix
